import * as THREE from 'three';

export function resizeRenderer(renderer, camera, container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
}

export function frameLevel(camera, level, config) {
  const aspect = camera.aspect || 1;
  const paddedHeight = level.bounds.height * config.world.fitPadding;
  const paddedWidth = level.bounds.width * config.world.fitPadding;
  const viewHeight = Math.max(paddedHeight, paddedWidth / aspect);
  const halfHeight = viewHeight / 2;
  const halfWidth = (viewHeight * aspect) / 2;

  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.position.x = level.bounds.width / 2;
  camera.position.y = level.bounds.height / 2;
  camera.updateProjectionMatrix();
}

export function updateCamera(camera, level, playerPosition, dt, config) {
  const viewWidth = camera.right - camera.left;
  const viewHeight = camera.top - camera.bottom;
  const horizontalPadding = viewWidth * 0.2;
  const verticalPadding = viewHeight * 0.22;
  const targetX = THREE.MathUtils.clamp(
    playerPosition.x,
    level.bounds.minX + horizontalPadding,
    Math.max(level.bounds.minX + horizontalPadding, level.bounds.maxX - horizontalPadding)
  );
  const targetY = THREE.MathUtils.clamp(
    playerPosition.y + viewHeight * 0.08,
    level.bounds.minY + verticalPadding,
    Math.max(level.bounds.minY + verticalPadding, level.bounds.maxY - verticalPadding)
  );
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 1 - Math.exp(-dt * config.world.cameraFollowTightnessX));
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 1 - Math.exp(-dt * config.world.cameraFollowTightnessY));
}
