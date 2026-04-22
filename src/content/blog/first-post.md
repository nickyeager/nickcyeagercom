---
title: "Building RuleMetric: A Universal Instruction Layer for AI Coding Tools"
date: "2026-04-18"
description: "Why I built a platform to manage, convert, and evaluate AI agent instructions across 25+ coding tools — and what I learned about how context shapes AI output."
tags: ["ai", "developer-tools", "open-source"]
draft: true
---

I wanted to work on RuleMetric for a number of reasons. First and foremost, I wanted to understand how context affected the output of these AI systems. In many ways, they still represent black boxes, even with increased observability. 

## The Problem

Every AI coding tool has its own instruction format. Claude Code uses `CLAUDE.md`. Cursor uses `.cursorrules`. Copilot uses `copilot-instructions.md`. Windsurf, Cline, and dozens of others each have their own conventions. If you've settled on a set of rules that make your AI assistant actually useful — coding standards, project context, testing policies — you're copy-pasting them between tools and hoping nothing drifts.

There's no way to know if your instructions are working. No way to share what's effective across a team. No way to measure whether a rule change improved or degraded output quality.

## What RuleMetric Does

RuleMetric is a cloud-backed platform that treats AI instructions as first-class, observable artifacts. Write your rules once in a canonical format, and convert them to any of 25+ tool-specific formats on demand. The core loop is simple: capture what the AI sees, link it to the instructions that were active, and measure the outcome.

The system has a few key pieces:

- **A CLI and API** for importing, converting, and managing instructions across projects and tools
- **Session tracking** via hooks and an HTTPS proxy that captures the full LLM context — system prompts, tools, messages — from any supported provider
- **An eval framework** that tests whether instructions actually change AI behavior, with A/B comparisons and iterative optimization
- **An insights pipeline** that connects instructions to sessions to outcomes, answering the question: *does this rule help?*

## What I Learned

The most interesting discovery was how much the surrounding context — not just the explicit instructions — shapes what an AI produces. System prompts, available tools, conversation history, and even the order of messages all influence output in ways that aren't obvious until you can observe them side by side. RuleMetric gave me the instrumentation to see that clearly for the first time.
