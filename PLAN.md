# Stardraw Plan

## Concept
A fullscreen Three.js puzzle platformer where levels are drawn as PNG images in Paint.

## Level Rules
Connected color regions are treated as semantic areas:
- Black `#000000` = solid ground
- Blue `#3F48CC` = player spawn area
- Green `#22B14C` = goal area
- Yellow `#FFF200` = star area
- White `#FFFFFF` = empty background

For non-ground semantic colors, the loader should:
1. Find each connected color region
2. Produce one gameplay object from the region
3. Replace that region with empty/white for the rest of analysis

## Prototype Goals
- Fullscreen game viewport
- Proper HUD overlay with hamburger menu, title, score
- Import level PNGs from menu
- Load bundled default level
- Region-based image parsing
- Responsive player movement / jump
- Stable collisions against walls and thin structures
- Stars disappear on pickup and increment score
- Goal completes level
- Modular code structure
- Tests for region parsing and level validation

## Architecture Direction
- `src/app` bootstrap / composition
- `src/config` game config
- `src/state` runtime state
- `src/ui` HUD/menu/messages
- `src/rendering` scene/camera/materials/world view
- `src/levels` loader/service/world builder
- `src/gameplay` input/player/collision/pickups/goal
