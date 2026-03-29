import * as THREE from 'three';

export function createMaterials(config) {
  return {
    tileTop: new THREE.MeshStandardMaterial({ color: config.tiles.topColor, roughness: 0.92 }),
    tileSide: new THREE.MeshStandardMaterial({ color: config.tiles.sideColor, roughness: 1.0 }),
    tileTopSoft: new THREE.MeshStandardMaterial({ color: config.tiles.topColor, roughness: 0.95, transparent: true, opacity: config.world.terrainOpacityWithBackground }),
    tileSideSoft: new THREE.MeshStandardMaterial({ color: config.tiles.sideColor, roughness: 1.0, transparent: true, opacity: config.world.terrainOpacityWithBackground * 0.9 }),
    doorTop: new THREE.MeshStandardMaterial({ color: config.door.topColor, roughness: 0.85 }),
    doorSide: new THREE.MeshStandardMaterial({ color: config.door.sideColor, roughness: 0.95 }),
    player: new THREE.MeshStandardMaterial({ color: config.player.color, roughness: 0.55 }),
    goal: new THREE.MeshStandardMaterial({ color: config.goal.color, emissive: config.goal.glowColor, emissiveIntensity: 0.55 }),
    goalCore: new THREE.MeshStandardMaterial({ color: '#ddffd6', emissive: '#88ff9b', emissiveIntensity: 0.7 }),
    star: new THREE.MeshStandardMaterial({ color: config.star.color, emissive: config.star.glowColor, emissiveIntensity: 0.8, roughness: 0.35, metalness: 0.05 }),
    key: new THREE.MeshStandardMaterial({ color: config.key.color, emissive: config.key.glowColor, emissiveIntensity: 0.45, roughness: 0.35 }),
    heart: new THREE.MeshStandardMaterial({ color: config.heart.color, emissive: config.heart.glowColor, emissiveIntensity: 0.55, roughness: 0.35 }),
    jumpBoots: new THREE.MeshStandardMaterial({ color: config.jumpBoots.color, emissive: config.jumpBoots.glowColor, emissiveIntensity: 0.45, roughness: 0.3 }),
    lava: new THREE.MeshBasicMaterial({ color: config.lava.color, transparent: true, opacity: 0.88 }),
  };
}
