---
name: diagnose-loop
description: The root-cause-analysis engine. Finds the root cause of a bug by causation, not correlation, and returns it. Use when another skill needs the root-cause loop (for example /diagnose), when a bug, error, crash, failing test, or unexpected behavior must be diagnosed, or when "why is this happening" needs an evidence-backed answer rather than a guessed fix.
---

# diagnose-loop

The RCA engine: find the root cause of a bug by causation, not correlation. Return the cause and its evidence. Never the fix.

## The loop

1. **Reproduce and observe first.** Make the bug happen on demand, then watch what it actually does. If you cannot reproduce it, gather more data. Do not guess.
2. **Form 3 to 5 falsifiable hypotheses.** State each as "I think X is the root cause because Y." If a hypothesis cannot be proven wrong by an observation, it is not a hypothesis. Discard it.
3. **Test one hypothesis at a time, one variable at a time.** Make the smallest possible change that would confirm or kill a single hypothesis. Change one thing, observe, record.
4. **Instrument to gather evidence.** Add logging, asserts, or breakpoints to capture the truth at the boundary. Tag all temporary instrumentation (for example `// DIAGNOSE-LOOP`) so it is trivial to remove afterward.
5. **Trace backward to the trigger.** Follow the call chain back from where the error surfaces to what originally caused it. The surface is a symptom. Never stop there.

Repeat until one hypothesis survives every test with evidence behind it. That is the root cause.

## Hard rules

- **No conclusion without a root cause.** "It might be X" is not a finding. Keep looping until the cause is proven.
- **Causation, not correlation.** A plausible-looking correlation is not a cause until evidence shows the mechanism. Two things moving together is a hypothesis, not an answer.
- **One variable at a time.** Change two things and you learn nothing: you cannot attribute the result. Reset between tests.
- **Trace to the trigger, not the surface.** The line that throws is rarely the line that is wrong. Walk the chain back to the origin.
- **If the root cause is architectural, say so.** An architectural root cause is itself the finding. Name it, back it with evidence, and hand off to planning. Do not paper over it.
- **This engine produces the root cause and its evidence only. Never the fix.** Return the cause to the caller (`/diagnose`). Proposing or building a fix is out of scope.
