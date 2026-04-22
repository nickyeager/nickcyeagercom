---
title: "Building AI Agents with Claude Code — Session 4: Parallel Agents & Feedback Loops"
date: "2026-05-16"
event: "Building AI Agents with Claude Code (4-week course)"
description: "Competing agent variants, adversarial evaluation, and self-improving systems — turning non-determinism into an advantage."
tags: ["claude-code", "ai-agents", "context-engineering", "course"]
---

## What You'll Build

A system that generates competing variants in parallel, evaluates them adversarially, and feeds results back to improve future runs.

## Key Patterns

- **Complexity triage** — classify before processing, skip overkill for simple tasks
- **Adversarial evaluation** — evaluators that attack, not praise
- **Uncorrelated perspectives** — independent reviewers catch what solo reviewers miss
- **Fresh context via files** — file-based state over LLM memory for reliability
- **Parallel generation** — non-determinism becomes an advantage with evaluation
- **Feedback loops** — agents that learn from past results
- **Workflow DAGs** — composing everything into pipelines
