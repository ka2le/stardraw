import * as THREE from 'three';
import { gameConfig } from '../config/gameConfig.js';

export function createGameState() {
  return {
    level: null,
    baseSolidRects: [],
    activeSolidRects: [],
    stars: [],
    keysOnMap: [],
    hearts: [],
    jumpBootsItems: [],
    lava: [],
    doors: [],
    score: 0,
    keyCount: 0,
    lives: gameConfig.player.maxLives,
    maxLives: gameConfig.player.maxLives,
    bootsActive: false,
    levelComplete: false,
    respawnLockTimer: 0,
    player: {
      position: new THREE.Vector2(),
      velocity: new THREE.Vector2(),
      spawn: new THREE.Vector2(),
      width: gameConfig.player.width,
      height: gameConfig.player.height,
      onGround: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      facing: 1,
      jumpMultiplier: 1,
    },
  };
}
