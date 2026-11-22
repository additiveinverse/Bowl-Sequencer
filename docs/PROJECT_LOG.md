# Project Log

## 2026-11-22 — First playable pass

### Challenges
- The repository contained only the build brief; there was no application scaffold, test setup, or existing design system to extend.
- The brief is much larger than a first session can safely deliver, so implementation scope had to stay focused on the core throw-to-groove loop.

### What We Learned
- The product's differentiator is the deterministic connection between a bowling outcome and a drum artifact, not bowling simulation fidelity.
- Outcome state can be represented as a ten-bit remaining-pin mask and used as a stable pattern seed.

### Changed Assumptions
- This pass uses a simple arcade outcome model and a basic ten-frame/two-throw flow. It is not yet a full ten-pin scoring implementation.
- Power and hook are direct controls rather than timing meters; the lane and pins are rendered in Canvas 2D.

### Decisions
- Started with Vue 3, Vite, and browser-native Canvas 2D as specified.
- Kept pattern generation deterministic from remaining pins. Artifacts are held in memory and exported as JSON.
- Deferred audio, MIDI, official scoring, controller input, and persistence to subsequent passes.

### Open Questions
- Should the prototype use a timed power/hook meter, or keep direct controls as a more accessible arcade option?
- What should the final MIDI output use for note duration, channel, and drum mapping configuration?
- Should an exported artifact represent each throw or only completed frames?

### Next Experiment
- Play-test aim/power/hook feel and compare repeated outcomes to verify that identical remaining-pin states always produce identical patterns.
- Add focused tests for the pin-mask seed and official frame scoring before expanding the gameplay loop.
