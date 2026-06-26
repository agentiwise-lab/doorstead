# Slop checklist

The slop reviewer's checklist for the CODE+SLOP lens. Each item is a thing AI-written code adds that a human would not. Flag each with a `file:line`.

## Flag these

- **Unnecessary comments** restating what the code already says.
- **Defensive over-engineering**: try/except for errors that cannot occur, broad `except`, guards on inputs the type system already rules out.
- **Gratuitous abstraction**: a base class, interface, or wrapper introduced for a single implementation.
- **Dead code**: unreachable branches, unused functions, commented-out blocks.
- **Leftover debug prints** and scratch logging.
- **Over-parameterization**: knobs, flags, or options no caller uses.
- **Fake tests**: break the implementation in your head; if the test still passes, it is fake (asserts nothing real, or only asserts the mock).
- **Confident hallucination**: APIs, flags, methods, or imports that do not exist. Verify the symbol before trusting it.
- **Architectural drift at integration points**: a new endpoint that skips auth, a handler that bypasses the service layer, a write that dodges the repository.

## False-positive guard (do NOT flag)

- Generic names (`data`, `result`, `tmp`) are fine in small scopes.
- Defensive code is fine in genuinely critical paths (auth, money, data loss).
- Detailed docstrings are fine for public-library surfaces.

A finding that trips this guard is noise; drop it.
