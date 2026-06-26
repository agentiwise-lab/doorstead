---
name: diagnose
description: Produces a root-cause analysis of a bug. Gets to causation, not correlation, and stops there. Triggers on "diagnose", "debug this", "find the root cause", "why is this failing", "it's broken", "what's causing X". Not for fixing, planning the fix, building a repro, or writing a test: this skill is RCA only.
---

# diagnose

Trace a bug from symptom back to its root cause and write the RCA. Nothing else.

## Inputs

- A bug report (error, logs, observed-vs-expected behavior).
- If the report is unclear or missing conditions/inputs/dependencies, run `/grill` first and use its output as the input here.

## Process

1. Read the error and logs in full before anything else. Criterion: you can quote the exact failing line and message.
2. Clarify the report. If conditions, inputs, or dependencies are ambiguous, run `/grill`. Criterion: the bug is reproducible in description, with no "sometimes" or "I think" left unresolved.
3. Restate the symptom in your own words and confirm understanding. Criterion: a one-sentence symptom statement that the reporter would agree with.
4. Run `/diagnose-loop`: form 3 to 5 falsifiable hypotheses, instrument one variable at a time, gather evidence, kill hypotheses that the evidence rejects. Criterion: exactly one hypothesis survives, backed by evidence, not plausibility.
5. Trace backward from the symptom to the original trigger. Never stop at the symptom. Criterion: each step in the chain is linked to the next by evidence, ending at the trigger.
6. Write the RCA to the output path using the template. Criterion: every section is filled and the root cause cites the evidence that proves it.

## Output

Write to `docs/bug-reports/<slug>.md`.

<rca-template>
## The bug (as reported)
[Verbatim symptom and how it surfaced.]

## Conditions and dependencies (clarified)
[Inputs, environment, versions, and preconditions that reproduce it. From /grill if run.]

## Causal traceback (symptom back to the trigger)
[Step-by-step chain, each link backed by evidence: symptom -> ... -> trigger.]

## Root cause (what and why, backed by evidence)
[The single confirmed cause. State what broke and why, citing the evidence.]

## What would have prevented this
[The check, test, or guard whose absence let this through.]
</rca-template>

## Hard rules

- Read the error and logs first. Acting before reading wastes the investigation on the wrong thread.
- Restate the symptom and confirm understanding before proposing anything. Misread the symptom and every step downstream is wrong.
- Causation, not correlation. A plausible guess that fits the symptom is not a root cause; only evidence is.
- No conclusion without a confirmed root cause. Stopping at the symptom hands the next skill a guess to build on.
- One fix path, never a menu. A menu means you have not finished diagnosing.
- Never run random experiments. Instrument one variable at a time so each result is interpretable.
- Do NOT propose or build the fix here. The fix is designed later; mixing it in corrupts the RCA.
- If the eventual fix would be destructive, it is subject to `/destructive-change-gate`. That is the next skill's concern, not this one's.

## Handoff

Feed the finished RCA to `/plan`, where the fix is designed. `/implement` builds it, and the failing test becomes `/tdd`'s RED step.
