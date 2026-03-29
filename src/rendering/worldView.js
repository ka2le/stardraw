import * as THREE from 'three';
import { createDoorMesh, createGoalMesh, createHeartMesh, createJumpBootsMesh, createKeyMesh, createLavaMesh, createPlayerMesh, createStarMesh, createTileMesh } from './meshFactories.js';

export function createWorldView(worldRoot, materials, config) {
  const dynamicRoot = worldRoot;
  const playerMesh = createPlayerMesh(materials, config);
  dynamicRoot.add(playerMesh);
  let goalMesh = null, backgroundPlane = null, levelMeshes = [];
  let starViews = [], keyViews = [], heartViews = [], bootsViews = [], doorViews = [], lavaViews = [];

  function clearLevel() {
    for (const mesh of levelMeshes) { dynamicRoot.remove(mesh); mesh.traverse?.((child) => child.geometry?.dispose?.()); }
    if (backgroundPlane) { dynamicRoot.remove(backgroundPlane); backgroundPlane.geometry?.dispose?.(); backgroundPlane.material?.map?.dispose?.(); backgroundPlane.material?.dispose?.(); backgroundPlane = null; }
    levelMeshes = []; starViews = []; keyViews = []; heartViews = []; bootsViews = []; doorViews = []; lavaViews = []; goalMesh = null;
  }

  function buildBackground(level) {
    if (!level.backgroundImage) return;
    const texture = new THREE.Texture(level.backgroundImage); texture.needsUpdate = true; texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
    backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(level.bounds.width, level.bounds.height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 }));
    backgroundPlane.position.set(level.bounds.width / 2, level.bounds.height / 2, -0.18); dynamicRoot.add(backgroundPlane);
  }

  function buildLevel(level, runtime) {
    clearLevel(); buildBackground(level);
    for (const rect of runtime.baseSolidRects) { const mesh = createTileMesh(rect, materials, config, Boolean(level.backgroundImage)); levelMeshes.push(mesh); dynamicRoot.add(mesh); }
    doorViews = runtime.doors.map((door) => { const group = new THREE.Group(); for (const rect of door.solidRects) group.add(createDoorMesh(rect, materials, config)); dynamicRoot.add(group); levelMeshes.push(group); return { id: door.id, mesh: group }; });
    lavaViews = runtime.lava.map((lava) => { const mesh = createLavaMesh(lava.bounds, materials, config); dynamicRoot.add(mesh); levelMeshes.push(mesh); return { id: lava.id, mesh }; });
    goalMesh = createGoalMesh(level.goal, materials, config); goalMesh.userData.baseY = level.goal.y; levelMeshes.push(goalMesh); dynamicRoot.add(goalMesh);
    starViews = runtime.stars.map((star) => { const mesh = createStarMesh(star, materials, config); levelMeshes.push(mesh); dynamicRoot.add(mesh); return { id: star.id, mesh, baseY: star.y }; });
    keyViews = runtime.keys.map((item) => { const mesh = createKeyMesh(item, materials, config); levelMeshes.push(mesh); dynamicRoot.add(mesh); return { id: item.id, mesh, baseY: item.y }; });
    heartViews = runtime.hearts.map((item) => { const mesh = createHeartMesh(item, materials, config); levelMeshes.push(mesh); dynamicRoot.add(mesh); return { id: item.id, mesh, baseY: item.y }; });
    bootsViews = runtime.jumpBoots.map((item) => { const mesh = createJumpBootsMesh(item, materials, config); levelMeshes.push(mesh); dynamicRoot.add(mesh); return { id: item.id, mesh, baseY: item.y }; });
  }

  function setDoorVisible(id, visible) { const view = doorViews.find((entry) => entry.id === id); if (view) view.mesh.visible = visible; }
  function syncPlayer(player) { playerMesh.position.x = player.position.x; playerMesh.position.y = player.position.y - player.height * 0.05; playerMesh.rotation.z = -player.velocity.x * 0.01; const body = playerMesh.userData.body, leftEye = playerMesh.userData.leftEye, rightEye = playerMesh.userData.rightEye; if (!body) return; const speed = Math.abs(player.velocity.x); const stretchY = player.onGround ? 1 - Math.min(speed * 0.01, 0.08) : 1.16; const stretchX = player.onGround ? 1 + Math.min(speed * 0.012, 0.1) : 0.84; body.scale.x = config.player.width * 0.52 * stretchX; body.scale.y = config.player.height * 0.56 * stretchY; body.position.y = player.onGround ? -config.player.height * 0.06 : config.player.height * 0.12; const eyeY = player.onGround ? config.player.height * 0.06 : config.player.height * 0.18; leftEye.position.y = eyeY; rightEye.position.y = eyeY; }
  return { buildLevel, syncPlayer, setDoorVisible, getGoalMesh: () => goalMesh, getStarViews: () => starViews, getKeyViews: () => keyViews, getHeartViews: () => heartViews, getBootsViews: () => bootsViews, getLavaViews: () => lavaViews, getPlayerMesh: () => playerMesh };
}
