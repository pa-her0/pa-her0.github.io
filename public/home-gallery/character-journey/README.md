# Homepage character sequence

Frames extracted from the user-supplied 4.04-second reference clip; no audio or
video player is shipped. The 64 frames cover 0–2.625 seconds (24 fps), ending on
the frontal gaze. Each numbered WebP sheet holds eight frames in a 4 × 2 grid.

- `scene-*.webp`: original 1114 × 576 pixels per frame, WebP quality 94 (desktop).
- `mobile-*.webp`: 768 × 398 pixels per frame, WebP quality 91 (compact screens).
- `head-down.webp`: still shown before animation assets load.
- `gaze.webp`: static reduced-motion / short-viewport alternative.

The video's closing phrase is rendered as live, accessible text, with editable
copy in `src/data/home-journey.ts`. Animation timing lives in
`src/components/scroll-journey.tsx`.
