---
name: tdd
description: >-
  Builds a feature or fixes a bug test-first, one vertical slice at a time, via
  red-green-refactor. Use when implementing backend behavior, fixing a bug that
  needs a regression test, or whenever the work is test-first. Triggers:
  "red-green-refactor", "test-first", "write a failing test", "TDD", "regression
  test". Not for: frontend UI (implement directly, no TDD), throwaway spikes, or
  pure config/docs changes.
---

# TDD

Build behavior in vertical slices: one failing test, minimum code to pass, repeat.

## The loop

1. Write ONE failing test for the next slice of behavior.
2. Run it. Watch it fail. Verify RED. If you did not watch it fail, you do not know it tests the right thing.
3. Write the minimum code to make it pass. Nothing more.
4. Run it. Watch it pass. Verify GREEN.
5. Repeat from step 1 for the next slice.
6. Refactor ONCE at the end, after the feature is complete. Not during the cycle.

Vertical, not horizontal. One test plus its implementation, then the next. Never write all the tests first and then all the implementation.

## What good tests look like

- Verify behavior through the public interface (the contract).
- Survive a full rewrite of the implementation. If the internals change and the test breaks, the test was wrong.
- Use a `Fake*` class that implements the contract (e.g. `FakeReportService`). Drive the system under test through it.
- One slice of behavior per test. Name it by the behavior, not the method.
- Live in a root `tests/` folder, scoped to the touched function.

## What bad tests look like

- Assert call counts or that a method "was called."
- Mock internal collaborators and patch private methods.
- Reach into implementation details, private state, or internal helpers.
- Break when you refactor without changing behavior.
- Cover untouched functions you happened to walk past. Test only what you touched.

## Mocking

Fakes, not mocks. Write a fake that honors the contract and assert on the resulting behavior, never on interactions. Mock ONLY at true system boundaries (network, clock, filesystem, third-party SDK) and only when a fake is genuinely impractical. If you reach for a mock on your own code, you have the wrong seam.

## Hard rules

- No production code without a failing test first. If you wrote code before the test, delete it and start over.
- You MUST watch the test fail before writing the code. RED is not optional.
- Refactor only at the end, never during red-green.
- Fakes, not mocks. Never assert call counts. Never mock internal collaborators.
- Test through the contract only. Never import internal helpers or the implementation class into a test.
- Backend is test-first. Frontend implements directly, no TDD.
- A regression test for a bug MUST fail before the fix and pass after. No failing test, no proof you fixed it.
