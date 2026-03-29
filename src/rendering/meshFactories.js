import * as THREE from 'three';

function createStarShape(outerRadius, innerRadius) {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function createTileMesh(rect, materials, config, softened = false) {
  const mesh = new THREE.Group();
  const topMaterial = softened ? materials.tileTopSoft : materials.tileTop;
  const sideMaterial = softened ? materials.tileSideSoft : materials.tileSide;
  const top = new THREE.Mesh(new THREE.BoxGeometry(rect.width, rect.height, config.world.groundDepth), topMaterial);
  top.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2, 0);
  top.scale.set(1.02, 1.02, 1);
  mesh.add(top);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(rect.width, Math.min(0.12, rect.height), config.world.groundDepth + 0.06), sideMaterial);
  lip.position.set(rect.x + rect.width / 2, rect.y + rect.height - Math.min(0.06, rect.height * 0.5), -0.05);
  mesh.add(lip);
  return mesh;
}

export function createStarMesh(position, materials, config) {
  const geometry = new THREE.ExtrudeGeometry(createStarShape(config.star.radius, config.star.innerRadius), { depth: config.star.depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: config.star.radius * 0.08, bevelThickness: config.star.depth * 0.25 });
  geometry.center();
  const mesh = new THREE.Mesh(geometry, materials.star);
  mesh.position.set(position.x, position.y, 0.16);
  return mesh;
}

export function createHeartMesh(position, materials, config) {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.SphereGeometry(config.heart.radius * 0.38, 16, 16), materials.heart);
  const right = left.clone();
  const point = new THREE.Mesh(new THREE.ConeGeometry(config.heart.radius * 0.48, config.heart.radius * 0.95, 4), materials.heart);
  left.position.set(-config.heart.radius * 0.18, config.heart.radius * 0.18, 0.14);
  right.position.set(config.heart.radius * 0.18, config.heart.radius * 0.18, 0.14);
  point.position.set(0, -config.heart.radius * 0.22, 0.14);
  point.rotation.z = Math.PI / 4;
  group.add(left, right, point);
  group.position.set(position.x, position.y, 0.14);
  return group;
}

export function createKeyMesh(position, materials, config) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(config.key.radius * 0.42, config.key.radius * 0.12, 12, 20), materials.key);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(config.key.radius * 0.72, config.key.radius * 0.16, 0.18), materials.key);
  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(config.key.radius * 0.16, config.key.radius * 0.24, 0.18), materials.key);
  const tooth2 = tooth1.clone();
  ring.rotation.x = Math.PI / 2;
  stem.position.x = config.key.radius * 0.45;
  tooth1.position.set(config.key.radius * 0.62, -config.key.radius * 0.14, 0);
  tooth2.position.set(config.key.radius * 0.82, -config.key.radius * 0.04, 0);
  group.add(ring, stem, tooth1, tooth2);
  group.position.set(position.x, position.y, 0.14);
  return group;
}

export function createJumpBootsMesh(position, materials, config) {
  const group = new THREE.Group();
  const boot = new THREE.Mesh(new THREE.BoxGeometry(config.jumpBoots.radius * 0.65, config.jumpBoots.radius * 0.75, 0.18), materials.jumpBoots);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(config.jumpBoots.radius * 0.8, config.jumpBoots.radius * 0.22, 0.18), materials.jumpBoots);
  boot.position.y = config.jumpBoots.radius * 0.08;
  foot.position.set(config.jumpBoots.radius * 0.1, -config.jumpBoots.radius * 0.32, 0.02);
  group.add(boot, foot);
  group.position.set(position.x, position.y, 0.14);
  return group;
}

export function createGoalMesh(position, materials, config) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(config.goal.radius, config.goal.radius * 0.18, 16, 32), materials.goal);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(config.goal.coreRadius, 0), materials.goalCore);
  ring.rotation.x = Math.PI / 2;
  gem.position.z = 0.1;
  group.add(ring, gem);
  group.position.set(position.x, position.y, 0.18);
  return group;
}

export function createDoorMesh(rect, materials, config) {
  return createTileMesh(rect, { tileTop: materials.doorTop, tileSide: materials.doorSide, tileTopSoft: materials.doorTop, tileSideSoft: materials.doorSide }, config, false);
}

export function createLavaMesh(rect, materials, config) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(rect.maxX - rect.minX, rect.maxY - rect.minY), materials.lava);
  mesh.position.set((rect.minX + rect.maxX) / 2, (rect.minY + rect.maxY) / 2, 0.08);
  return mesh;
}

export function createPlayerMesh(materials, config) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), materials.player);
  body.scale.set(config.player.width * 0.52, config.player.height * 0.56, 0.2);
  body.position.y = -config.player.height * 0.02;
  body.position.z = 0.12;
  const shine = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 18), new THREE.MeshStandardMaterial({ color: '#96adff', transparent: true, opacity: 0.45, roughness: 0.25 }));
  shine.scale.set(config.player.width * 0.22, config.player.height * 0.16, 0.08);
  shine.position.set(-config.player.width * 0.12, config.player.height * 0.28, 0.24);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(config.player.width * 0.04, 10, 10), new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.4 }));
  leftEye.position.set(-config.player.width * 0.12, config.player.height * 0.1, 0.28);
  const rightEye = leftEye.clone(); rightEye.position.x *= -1;
  group.add(body, shine, leftEye, rightEye);
  group.userData.body = body; group.userData.leftEye = leftEye; group.userData.rightEye = rightEye; group.position.z = 0.02;
  return group;
}
