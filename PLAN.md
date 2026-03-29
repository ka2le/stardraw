# Stardraw Plan

## Concept
A 2.5D/3D-rendered side-view puzzle platformer built with Three.js where levels are authored as simple PNG images in Paint.

## Core Prototype Goals
- Load a level from an image
- Interpret pixels by exact color codes
- Spawn a player at blue
- Reach the green goal
- Collect yellow stars that disappear and increment score
- Treat black pixels as solid terrain
- Provide satisfying jump + movement with collision handling against thin walls
- Show a small top bar with hamburger menu, title, and score
- Start with a default included level image

## Color Mapping
- Black `#000000` = solid ground
- Blue `#3F48CC` = player start
- Green `#22B14C` = goal
- Yellow `#FFF200` = star pickup
- White `#FFFFFF` = empty space

## Prototype Scope
- Three.js rendering with orthographic camera for classic side view
- Tile-based world generated from image pixels
- Rectangle collision body for player
- Axis-separated movement/collision for stable wall handling
- Simple hover/glow animation for pickups and goal
- Import level from local image file via menu
- Configurable gameplay + color values in `game_config.js`
- Tests for level parsing and validation

## Later
- Keys / locked doors
- Hazards
- Better art pass
- More advanced tile meshing
- Multi-level flow
- GitHub Pages deploy
