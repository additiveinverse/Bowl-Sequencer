# BUILD PROMPT: Bowling For Sequences

## Core Idea

This is NOT a music sequencer with a bowling theme.

This is NOT a realistic bowling simulator.

This is an arcade bowling game that secretly generates drum patterns.

The bowling game must be fun on its own.

The music system is a reward layer sitting on top of the bowling game.

The primary design goal is:

> "One more throw."

---

# Technology

Build as:

```txt
Vue 3
Composition API
Vite

Canvas 2D renderer for the game layer.
```

Vue is responsible for:

```txt
UI
State Management
Artifact Storage
Pattern Visualization
MIDI Configuration
Export / Import
Score Screens
Settings
```

Canvas 2D is responsible for:

```txt
Bowling Lane
Ball Rendering
Pin Rendering
Physics Rendering
Motion Trails
Impact Effects
Glow Effects
```

Avoid:

```txt
Three.js
Phaser
React
Electron
```

Keep dependencies minimal.

Target:

```txt
Desktop Browser on 5 year old hardware
Raspberry Pi
Future Handheld
```

---

# Architecture

Bowling creates artifacts.

Artifacts create music.

These systems should remain loosely coupled.

Modules:

```txt
Bowling Engine

Artifact Generator

Pattern Generator

MIDI Engine

Audio Engine

UI Layer
```

Communication should occur through artifact data structures rather than direct coupling.

---

# Visual Style

Inspiration:

```txt
Arcade Bowling
Tempest
Frequency
Amplitude
Cosmic Bowling
Laser Bowling
```

Visual Characteristics:

```txt
Dark Background

Glowing Lane

Vector Style Graphics

Simple Shapes

Bright Ball

Bright Pins

Motion Trails

Impact Flash

Subtle Glow Effects

No Photorealism

No Textures
```

Think:

```txt
1980s arcade machine
connected to a drum machine
```

not

```txt
real bowling alley simulator
```

---

# Controller Support

Support:

```txt
Xbox Controller
Generic Gamepad
Keyboard
```

Keyboard fallback:

```txt
Left Arrow
Right Arrow

Space

Enter
```

---

# Gameplay Loop

Player bowls normally.

Every frame:

```txt
Throw Ball
↓

Pins Fall
↓

Bowling Score Updates
↓

Music Pattern Updates
↓

Player Hears Groove Change
↓

Next Frame
```

---

# Controls

Use classic arcade bowling controls.

## Stage 1: Position

```txt
Move Left
Move Right

Confirm
```

---

## Stage 2: Power Meter

Moving meter.

```txt
Confirm
```

locks power.

---

## Stage 3: Hook Meter

Moving meter.

```txt
Confirm
```

locks hook.

---

## Stage 4: Launch

Ball launches.

Physics simulation takes over.

No user control during roll.

---

# Bowling Rules

Implement standard 10-pin bowling.

Requirements:

```txt
10 Frames

Strikes
Spares
Splits

Score Tracking
```

Single-player only.

No multiplayer.

---

# Design Philosophy

Bowling creates artifacts.

Artifacts create music.

Keep these responsibilities separate.

The game should remain enjoyable if the audio system is disabled.

The player is bowling for grooves, not programming a sequencer.

---

# Data Capture System

Every throw generates an Artifact.

## Dataset 1: Approach

Capture:

```json
{
  "trajectory": [],
  "travelTime": 0,
  "releasePower": 0,
  "hookAmount": 0
}
```

Purpose:

```txt
Archive
Future Interpretation
Pattern Drift Experiments
```

Do not use heavily in MVP music generation.

---

## Dataset 2: Impact

Capture:

```json
{
  "impactX": 0,
  "impactY": 0,
  "impactEnergy": 0,
  "firstPinHit": 0
}
```

Purpose:

```txt
Performance Characteristics
Velocity Maps
Accent Maps
```

---

## Dataset 3: Outcome

Capture:

```json
{
  "pinsRemaining": [],
  "pinsKnockedDown": 0,
  "score": 0,
  "strike": false,
  "spare": false,
  "split": false
}
```

Purpose:

```txt
Pattern Generation
Seed Generation
```

---

# Musical MVP

Drums only.

No melody.

No chords.

No bass lines.

No synth generation.

Focus on:

```txt
Kick
Snare
Hi-Hat
```

---

# Pattern Generation

MVP uses Outcome Data.

Outcome creates the base groove.

## Seed Generation

Convert the remaining pin state into a 10-bit number.

Example:

```txt
1010110010
```

↓

```txt
690
```

↓

```txt
Pattern Seed
```

This seed must always produce the same rhythm.

Deterministic behavior is required.

---

## Drum Pattern Output

Generate:

```txt
16 Step Pattern
```

Example:

```txt
x---x-x---x--x--
```

Same outcome state:

```txt
Same Pattern
```

Always.

---

# Data Interpretation Model

```txt
Outcome Data
    =
Pattern Structure

Approach Data
    =
Pattern Drift / Mutation

Impact Data
    =
Performance Characteristics
```

Approach and Impact must be captured and stored for future use even if only partially utilized in MVP.

---

# Impact Interpretation

Impact data should not produce a single velocity value.

Instead it should generate performance maps.

## Velocity Map

Example:

```txt
100
78
120
92
85
110
75
127
...
```

Generated per step.

---

## Accent Map

Example:

```txt
0
1
0
0
1
0
1
0
...
```

Generated per step.

---

Do NOT implement:

```txt
Swing
Probability
Ratchets
Microtiming
Melody Generation
```

in MVP.

---

# Audio System

Simple WebAudio implementation is acceptable.

Provide:

```txt
Kick
Snare
Hi-Hat
```

Loop continuously.

When a frame completes:

```txt
Generate New Pattern

Update Groove

Continue Playback
```

No complex DAW features.

---

# MIDI

Web MIDI support is required.

Allow the user to select an available MIDI output device.

Generated drum patterns should be playable through:

```txt
Hardware Drum Machines
Hardware Samplers
Grooveboxes
External DAWs
```

Default Note Mapping:

```txt
Kick  -> MIDI Note 36
Snare -> MIDI Note 38
Hat   -> MIDI Note 42
```

Architecture:

```txt
Outcome
↓
Pattern Seed
↓
Pattern Generator
↓
MIDI Output
```

Provide:

```txt
Enable MIDI Toggle

MIDI Device Selector

Send Notes To External Devices

Internal WebAudio Fallback
```

The game must function correctly with no MIDI devices connected.

---

# Artifact Schema

Every completed throw generates and stores:

```json
{
  "timestamp": "",
  "frame": 0,
  "throw": 0,

  "approach": {},
  "impact": {},
  "outcome": {},

  "pattern": "",
  "velocityMap": [],
  "accentMap": []
}
```

Store artifacts in memory.

Allow export to:

```txt
artifact.json
```

---

# User Interface

After every completed frame display:

```txt
Frame Result

Strike / Spare / Open

Seed Value

Generated Pattern

Velocity Map Preview

Accent Map Preview
```

Buttons:

```txt
Continue

Export Artifact
```

---

# Physics Requirements

Physics should feel:

```txt
Readable
Responsive
Arcade-Oriented
```

Priorities:

```txt
Clear Hook Curves

Satisfying Collisions

Understandable Outcomes

Consistent Results
```

Avoid:

```txt
Simulation Accuracy
Professional Bowling Simulation
Complex Ball Dynamics
```

Game feel is more important than realism.

---

# Future-Proofing

Capture all three datasets even if not fully used yet.

Future experiments may use:

```txt
Approach → Pattern Drift

Impact → Performance Maps

Outcome → Pattern Structure
```

The schema should support future interpretation systems without requiring redesign.

---

# Success Criteria

The prototype succeeds if:

```txt
Bowling feels good.

Artifacts are generated.

Drum patterns update.

Different outcomes create different grooves.

Player wants another throw.
```

Do NOT optimize for:

```txt
Music Theory
Realistic Simulation
Feature Completeness
```

Optimize for:

> A glowing arcade bowling machine that accidentally creates drum patterns while you play.

Build the bowling game first.

The music layer exists to reward play, not to replace it.

---

# Prototype Status

The first playable pass provides a Canvas 2D lane, aim/power/hook controls, a basic two-throw frame flow, deterministic drum-pattern generation, and JSON artifact export. Its pinfall model and frame display are prototypes, not a complete bowling simulation or official scoring system.

Run locally with:

```txt
npm install
npm run dev
```

Run the pattern tests and production build with:

```txt
npm test
npm run build
```

See [docs/ROADMAP.md](docs/ROADMAP.md) for the implementation sequence and [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md) for current decisions and open questions.