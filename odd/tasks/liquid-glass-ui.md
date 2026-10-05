# Liquid Glass UI Refresh

## Objective
Refresh the passenger app's shared visual language toward a refined liquid-glass look while preserving the current navigation, screen structure, content, and exact brand palette.

## Problem and Why
The user likes the existing structure and color palette but wants the overall interface to feel more polished and glass-like, inspired by iPhone liquid glass. Android rendering performance is an explicit constraint.

## Scope
- Add reusable glass surface styling/components using existing palette colors with translucency, layered highlights, thin borders, and restrained elevation.
- Apply the material consistently to high-visibility shared UI surfaces and common cards/panels without changing information architecture, navigation, or business behavior.
- Prefer native blur selectively where it is visually meaningful; avoid broad or dynamic Android blur. Android surfaces should use performant translucent fills, borders, and highlights.
- Keep controls legible and preserve accessibility, press, disabled, loading, and error states.

## Constraints
- No palette/token color changes and no navigation or feature changes.
- Preserve all pre-existing working-tree edits; stage/commit only files for this feature.
- Expo SDK 57 versioned documentation is authoritative.
- User explicitly selected implementation without TDD; retain normal typecheck and Android export checks.
- Route: delegated direct implementation (multi-file shared visual system; writer owns mapping and writes).
- Delivery strategy: ask-on-risk. Forecast: approximately 250–400 authored changed lines; reassess from work-unit commits.

## TDD and Checks
- TDD: off, explicitly selected by user for this task.
- Functional checks: `npm run typecheck`; `npx expo export --platform android`.
- Runtime scenario: inspect core app tabs/screens and primary glass surfaces on Android for visual consistency, readability, and performance; device-level run is user-owned if no emulator is available.

## Tasks
- [x] LG-1 Define the reusable, palette-preserving glass surface with translucent existing-palette fills, fine highlights, and restrained elevation; no runtime blur dependency was added.
- [x] LG-2 Apply the glass treatment to the floating tab bar, primary CTA, trip summary/reservation/history cards, profile choices, and pricing choices without changing their structure or behavior.
- [x] LG-3 Run available static and Android export checks; record the unavailable package command and native compiler limitation below.

## Progress
- Implementation complete; existing unrelated working-tree edits were left untouched.
- Palette evidence: `src/presentation/theme/colors.js` was not changed. All new fills/borders/highlights reference the existing `surface`, `platinum`, `gold`, and `charcoal` palette values.
- Layout/behavior evidence: only visual classes, decorative non-interactive highlights, and shadow/elevation were changed; navigation, labels, card content, actions, and state behavior remain unchanged.
- Android performance: no broad/dynamic blur or added dependency; translucent fills, thin highlights, and restrained elevation are used instead.
- Verification: `npm run typecheck` could not start because `npm` is not recognized in this environment. Equivalent compiler check via bundled Node (`node node_modules/typescript/bin/tsc --noEmit`) passed (exit 0).
- Verification: `npx expo export --platform android` could not start because `npx` is unavailable. Expo CLI export via bundled Node reached Metro, then failed with `hermesc.exe: permission denied` while generating Hermes bytecode; no device-level visual run was available.
- Work-unit commit: `b3f3702` (`feat(ui): add lightweight liquid glass surfaces`).

## Next Step
Parent to review the isolated work-unit commit and handle any native receipt-driven review; device-level Android visual confirmation remains user-owned.

## Relevant Files
- `src/presentation/theme/colors.js` — existing palette tokens to preserve.
- `src/presentation/components/Screen.tsx` — shared screen container.
- `src/presentation/components/Typography.tsx` — shared typography.
- `src/presentation/components/VIPButton.tsx` — shared primary action surface.
- `src/presentation/components/FloatingTabBar.tsx` — high-visibility app navigation surface.
