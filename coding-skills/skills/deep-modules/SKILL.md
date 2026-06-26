---
name: deep-modules
description: Shared vocabulary and rules for designing deep modules: a lot of behavior behind a small interface, placed at a clean seam, tested through that interface. Use when designing or improving a module's interface, deciding where a seam goes, making code testable, or when another skill needs the deep-module vocabulary.
---

# Deep Modules

Design modules that hide a lot of behavior behind a small interface, at a clean seam, tested through that interface.

## Glossary

Use these terms exactly. Do not substitute "component", "service", "API", or "boundary".

- **Module**: a unit with an Interface and a hidden Implementation.
- **Interface**: the small surface other code imports. Method names, inputs, outputs. No logic.
- **Implementation**: everything hidden behind the Interface. All the logic lives here.
- **Depth**: a lot of Implementation behind a small Interface. This is the goal. A deep Module is one callers learn little about to use a lot.
- **Seam**: the point where you can substitute one Implementation for another. Where a test attaches.
- **Adapter**: a thin wrapper translating the Interface to an external system (DB, HTTP API, queue). Logic-free.

## Core principles

- **A deep Module hides a lot behind a little.** Small Interface, large Implementation. A shallow Module (big Interface, thin Implementation) earns its keep poorly: callers pay to learn it and get little back. Push complexity down, not out.
- **The Interface is the test surface.** Test through the Interface, not around it. A test that reaches into the Implementation couples to detail that should be free to change. If you cannot test it through the Interface, the Interface is wrong.
- **The deletion test measures Depth.** If you deleted this Module, how much would callers have to know to do without it? More to know means deeper. Little to know means shallow, and shallow Modules rarely justify their own existence.
- **One Adapter is a hypothetical Seam. Two Adapters is a real Seam.** Do not introduce a Seam for a single Implementation. A Seam earns its place only when a second real Implementation exists.
- **Make the change easy, then make the easy change.** If a change is hard, first reshape the Module so the change becomes easy, then make it. Do not force the hard change through a wrong shape.

## Design it twice

Before committing to an Interface, sketch 2 to 3 structurally different designs:

1. **Minimize the Interface**: smallest surface callers must learn.
2. **Maximize flexibility**: widest range of Implementations the Interface allows.
3. **Optimize the common caller**: easiest for the call site you make most often.

Pick the deepest. The cost of sketching three is minutes. The cost of the wrong Interface is every caller that imports it.

## Hard rules

- **Contracts first, hide Implementation.** Define the Interface before writing any logic. Callers import the Interface only, never the Implementation. The why: the Interface is the contract you must keep stable; the Implementation is free to change only because nothing depends on it directly.
- **A contract over ~15 methods is two Modules.** A large Interface is a shallow Module wearing a disguise. Split it along the real responsibilities. The why: Interface size is what callers pay to learn, and one Module should teach one idea.
- **Do not add a Seam, Interface, or Adapter for a single Implementation.** That is speculative generality. The why: an unused Seam is pure cost: extra indirection, a fake to maintain, a second thing to read, with no second Implementation to justify it. Add the Seam when the second Implementation arrives, not before.
