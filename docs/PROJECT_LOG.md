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

## 2026-11-22 — Collision model and local launch guidance

### Challenges
- Opening `index.html` directly bypasses Vite, so the browser cannot compile the Vue single-file component and initially showed a blank page.
- Outcome counts were previously computed from aim and power rather than the ball's path through the pin deck.

### What We Learned
- Direct impacts can be computed from the sampled ball trajectory, then resolved through deterministic energy transfer to pins in downstream rows.
- The HTML mount point can show launch instructions until Vue mounts, making the `file://` failure actionable without changing the Vite workflow.

### Changed Assumptions
- Pin collisions use a deterministic arcade model rather than rigid-body simulation; actual per-pin fall animation remains a later visual task.

### Decisions
- Kept Vite as the supported local workflow: run `npm run dev` and open its printed localhost URL.
- Extracted throw simulation into a standalone module so collision outcomes can be tested independently of Canvas rendering.

### Open Questions
- Tune collision radius and energy transfer with play-testing once the intended feel is clearer.

## 2026-11-22 — Bowling-first pivot

### Challenges
- The screen still gave equal weight to patterns and pins, and the game had no official scorecard or tenth-frame bonus logic.
- Pinfall was only reflected by removing pins after a throw, which made a good hit feel visually flat.

### What We Learned
- A complete ten-frame scoring model needs to treat bonus rolls as part of the tenth frame and delay strike/spare totals until their bonus rolls exist.
- The trajectory/collision result can drive a short pinfall sequence, trail, and impact flash without putting presentation code in the rules module.

### Changed Assumptions
- User direction: "Forget the sequencer for now. Build the most satisfying minimalist arcade bowling game you can."
- Bowling is now the active product; sequencer screens and outputs are parked rather than part of the throw loop.
- "Satisfying" means the shot is readable, pinfall is visible, and the scorecard rewards frame-to-frame play—not just brighter visuals.

### Decisions
- Added pure scoring rules for regular frames and tenth-frame rack resets/bonus throws.
- Reworked the play screen around a scorecard, lane, shot controls, and roll feedback.
- Kept pin collision results deterministic so scoring and pinfall remain testable.
- Added optional synthesized roll and impact sounds; they are independent of sequencer playback.

### Open Questions
- What balance of power, hook, and collision spread makes a strike feel earned without making misses frustrating?
- Is default-on arcade sound comfortable across desktop and mobile speakers?

### Next Experiment
- Play several complete games, especially tenth-frame combinations, and tune collision/control feel before restoring optional music features.

## 2026-11-22 — Add spin and widen the view

### Challenges
- The previous hook curve was small and fixed in shape, and the ball had no visible rotation cue.
- The lane's far edge was much narrower than its release edge, while the full interface pushed controls below the playfield on medium screens.

### What We Learned
- Side spin can control both the ball's visible seam rotation and a friction-driven late hook; lower power should allow a larger deflection.
- A wider far end makes pin targeting easier to read without changing the game to an isometric projection.

### Changed Assumptions
- Replaced the separate hook control with a signed spin control that produces hook through the lane model.
- The game should prioritize a compact playfield/control layout on typical desktop heights.

### Decisions
- Added a rotating seam and finger holes to the Canvas ball so spin is visible during the roll.
- Reduced the lane's perspective taper and adjusted its height/layout to reclaim vertical screen space.

### Open Questions
- Does the current spin range create enough visible movement without making aiming feel unpredictable?
- Does the wider perspective remain readable on mobile screens?

### Next Experiment
- Play-test left and right spin at low and high power, then tune the curve and compact layout from the feel of actual throws.

### Next Experiment
- Implement and test official ten-pin scoring, including strikes, spares, and tenth-frame rules.
