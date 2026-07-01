---
name: grill
description: Clarify anything ambiguous, one question at a time. Use when the user says "grill", wants to sharpen a requirement, plan, or design, or when you the agent need more clarity before writing a PRD, planning, slicing, or implementing. Not for writing the artifact itself (that is /prd or /plan).
---

# Grill

Resolve ambiguity by interviewing, one question at a time. Reachable by the user or by you whenever clarity is missing. Produces no document of its own: write resolved decisions back into the doc in hand (the PRD, plan, or issue).

## Process

1. **Ask one question at a time.** Asking several at once is bewildering and gets shallow answers.
2. **Recommend an answer** to each question, with a one-line reason. The user corrects faster than they invent.
3. **Explore the codebase instead of asking** when the answer is in the code. Do not spend a question on what you can read.
4. **Walk the decision tree branch by branch.** Resolve a dependency before the choices that hang off it.
5. **Surface conflicts on the spot.** If two requirements contradict, name both and force a resolution before continuing.
6. **Stop when no remaining ambiguity would change the artifact.** Bounded rounds: if a thread stays unclear after a couple of passes, record it as an open question and move on rather than looping.

## Hard rules

- One question per turn. Never batch.
- Never invent a decision the user should make. Recommend, then wait.
- Write each resolved decision into the working doc immediately. Do not batch them to the end.
