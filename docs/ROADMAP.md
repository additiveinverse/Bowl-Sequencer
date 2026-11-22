# Roadmap

## First pass — playable throw-to-pattern loop
- [x] Create the Vue 3/Vite application shell and responsive arcade presentation.
- [x] Render a bowling lane, ball, and remaining pins with Canvas 2D.
- [x] Add aim, power, and hook controls plus keyboard throw/continue controls.
- [x] Generate in-memory throw artifacts with approach, impact, and outcome data.
- [x] Derive a repeatable 16-step kick/snare/hat pattern from the remaining-pin mask.
- [x] Preview velocity/accent maps and export artifacts as JSON.

## Next — make bowling feel right
- [ ] Replace the prototype outcome formula with readable, deterministic ball/pin collision behavior.
- [ ] Implement official ten-pin frame scoring, including strike, spare, and tenth-frame rules.
- [ ] Add satisfying pinfall animation, trail, impact flash, and clear split detection.
- [ ] Add tests for scoring, seed stability, and artifact shape.

## Then — make the groove audible and portable
- [ ] Add a lightweight WebAudio kick/snare/hat engine and continuous playback.
- [ ] Add Web MIDI output selection, enable/disable, and configurable note mapping.
- [ ] Verify audio fallback and graceful operation without MIDI devices.
- [ ] Decide artifact export granularity and add import if it remains in scope.

## Later — improve playability and longevity
- [ ] Add gamepad input and tune keyboard/controller interaction.
- [ ] Add persistent artifact storage and session/replay views.
- [ ] Test performance and usability on lower-powered desktop hardware and Raspberry Pi.
- [ ] Explore approach-driven pattern drift and impact-driven performance maps without coupling music generation to the bowling engine.
