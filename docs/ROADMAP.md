# Bowling-First Roadmap

## Playable arcade game
- [x] Keep a working Vue/Vite launch path and a helpful direct-file fallback.
- [x] Render a perspective Canvas 2D lane, ball, pin deck, and shot guide.
- [x] Add aim, power, and spin controls with keyboard throw/continue input.
- [x] Resolve deterministic ball-to-pin impacts and downstream pinfall.
- [x] Add a rolling trail, pinfall animation, and impact flash.
- [x] Implement ten-frame scoring, spares, strikes, and tenth-frame bonus balls.
- [x] Show roll marks, cumulative score, remaining pins, and next-ball prompts.
- [x] Add focused collision and scoring tests.

## Next — make every roll feel great
- [ ] Tune lane perspective, spin curvature, collision energy, and control range through play-testing.
- [x] Add restrained synthesized bowling roll and pin-impact sound effects with a mute option.
- [ ] Improve split recognition and make difficult leave states easy to read.
- [ ] Add gamepad input and verify the full game on lower-powered hardware.
- [ ] Add an end-of-game score reveal and optional best-score persistence.

## Parked — sequencer layer
- [ ] Restore outcome-to-pattern presentation only after bowling stands on its own.
- [ ] Add WebAudio drum playback and Web MIDI output as optional reward layers.
- [ ] Keep artifact capture/export separate from the bowling rules and score state.
