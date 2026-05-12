---
title: "MongoDB Change Streams: At-Least-Once Isn't the Default"
date: "2026-05-08"
description: "A stock change-stream consumer drops events on replica-set failover. Here's why, and how to build one that doesn't."
tags: ["mongodb", "node", "distributed-systems"]
draft: false
---

MongoDB change streams are the standard way to tail a collection and forward events somewhere else: another cluster, a search index, an analytics warehouse. The API is short, the driver handles reconnects, and the loop reads like a generator.

The thing the docs underplay: a stock consumer is at-most-once, with a gap on every reconnection. Getting at-least-once is straightforward, but it is not the default, and the default fails silently.

## How the cursor works

A typical consumer looks like this:

```js
const stream = collection.watch([], { fullDocument: 'updateLookup' });
for await (const change of stream) {
  await sink.write(change);
}
```

The Node driver opens a tailable cursor on the oplog, hands you events as they arrive, and reconnects automatically on resumable errors like primary stepdowns or transient network failures. The for-await loop runs forever.

When you open a stream without a starting point, the cursor begins at the current cluster time. Each delivered event carries a resume token in `change._id`. The driver keeps the most recent token in memory so that if the connection drops cleanly, it can pass that token back on reconnect and pick up where it left off.

That last sentence is where the trouble is.

## Where the gap comes from

The in-memory resume token only covers reconnects within a single process lifetime, and only after at least one event has been delivered. Two cases break it:

1. **The stream has not yet delivered an event.** The driver has no token to resume from, so reconnect falls back to "now."
2. **The process restarts.** A deploy, a crash, an OOM kill, a node reboot. The in-memory token is gone. The next start opens a fresh subscription at "now."

Either case loses everything written between the last successful read and the reconnect timestamp. A typical replica-set failover takes 10 to 30 seconds. On a busy collection, that is hundreds to thousands of events that the consumer will never see. The application throws no exception, the driver logs no warning, and the loop continues processing newer events as if nothing happened.

## Watching it happen

You do not have to wait for a real failover. On a test cluster, force a stepdown:

```js
db.adminCommand({ replSetStepDown: 30, force: true });
```

Run a writer pumping events into the source, a counter on the destination, and trigger the stepdown mid-flight. Compare counts before and after. The delta is your gap.

## Making the consumer durable

Persist the resume token to a sticky store after every successful sink write, and pass it back when you open the stream:

```js
const state = await loadResumeState();
const opts = {
  fullDocument: 'updateLookup',
  ...(state?.resumeToken
    ? { startAfter: state.resumeToken }
    : {}),
};

const stream = collection.watch([], opts);

for await (const change of stream) {
  await sink.write(change);
  await saveResumeState({ resumeToken: change._id });
}
```

A few details that matter:

- **Persist after the sink commit, not before.** If you save the token first and the sink call fails, the next restart will skip the unwritten event. The token should advance only after the data is durable downstream.
- **Use `startAfter`, not `resumeAfter`.** They look similar but have different semantics around invalidate events. `startAfter` is the right choice for resuming a long-running consumer; `resumeAfter` is stricter about cluster lineage.
- **On cold start with no token, fail loud.** Do not silently fall back to "start from now." That is how a restart that should have backfilled instead skips a window of history. Require an operator decision: earliest available oplog entry, a specific cluster time, or an explicit "yes, start from now" override.

This also makes the consumer idempotent across restarts, which is the property you actually wanted from the beginning.

## Defense in depth

Persisting the token closes the obvious hole, but the consumer is still a single moving part between two data stores. The general rule for that shape of system is that the consumer's own view of itself is the least trustworthy signal. A few cheap checks that do not rely on it:

- **Count-delta job on a schedule.** Count documents on the source and the destination by some natural time bucket (`created_at` hour, for example) and alert when the delta exceeds a threshold. Ten lines of code, catches a wide class of bugs that have nothing to do with change streams.
- **Resume-token age alert.** If the persisted token has not advanced in N seconds and the source is healthy, the consumer is wedged. This is the signal you would otherwise be missing.
- **Chaos test in CI.** Kill the source primary mid-batch, verify zero events are lost. Cheap to write once, prevents the regression forever.

## The general shape

Pipelines that connect two systems are where bugs hide. Each end can be internally healthy while the failure lives in the seam between them, and that seam usually has the weakest observability. Telemetry that reports "I am running and not throwing exceptions" tells you nothing about whether data is actually flowing.

Whenever a service is the only path between two data stores, the highest-leverage check is one that does not trust the service's own view of itself: a count, a checksum, a downstream invariant.
