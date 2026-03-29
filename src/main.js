import * as THREE from 'three';
import { gameConfig } from './game_config.js';
import {
  buildSolidRects,
  getImageDataFromImage,
  loadImageFromFile,
  loadLevelFromImageUrl,
  parseImageDataToLevel,
} from './levelLoader.js';
import './style.css';

const container = document.getElementById('gameContainer');
const menuButton = document.getElementById('menuButton');
const menuPanel = document.getElementById('menuPanel');
const levelFileInput = document.getElementById('levelFileInput');
const reloadButton = document.getElementById('reloadButton');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');

const scene = new THREE.Scene();
scene.background = new THREE.Color(gameConfig.world.backgroundBottom);

const camera = new THREE.OrthographicCamera(-24, 24, 14, -14, 0.1, 100);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.05);
sunLight.position.set(8, 18, 14);
scene.add(sunLight);

const backgroundPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 120),
  new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(gameConfig.world.backgroundTop) },
      bottomColor: { value: new THREE.Color(gameConfig.world.backgroundBottom) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0); }`,
    depthWrite: false,
  })
);
backgroundPlane.position.z = -12;
scene.add(backgroundPlane);

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const keyState = new Set();
const gameState = {
  level: null,
  solidRects: [],
  stars: [],
  score: 0,
  player: {
    position: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    width: gameConfig.player.width,
    height: gameConfig.player.height,
    onGround: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    facing: 1,
  },
};

const tileMaterialTop = new THREE.MeshStandardMaterial({ color: gameConfig.tiles.topColor, roughness: 0.92 });
const tileMaterialSide = new THREE.MeshStandardMaterial({ color: gameConfig.tiles.sideColor, roughness: 1.0 });
const playerMaterial = new THREE.MeshStandardMaterial({ color: gameConfig.player.color, roughness: 0.55 });
const goalMaterial = new THREE.MeshStandardMaterial({ color: gameConfig.goal.color, emissive: gameConfig.goal.glowColor, emissiveIntensity: 0.55 });
const starMaterial = new THREE.MeshStandardMaterial({ color: gameConfig.star.color, emissive: gameConfig.star.glowColor, emissiveIntensity: 0.8, roughness: 0.35, metalness: 0.05 });

const playerMesh = new THREE.Mesh(
  new THREE.BoxGeometry(gameConfig.player.width, gameConfig.player.height, 0.7),
  playerMaterial
);
playerMesh.position.z = 0.4;
worldRoot.add(playerMesh);

let goalMesh = null;
const clock = new THREE.Clock();
let messageTimeout = null;

function setMessage(text, durationMs = gameConfig.ui.winMessageDurationMs) {
  messageEl.textContent = text;
  messageEl.classList.remove('hidden');
  if (messageTimeout) clearTimeout(messageTimeout);
  if (durationMs > 0) {
    messageTimeout = setTimeout(() => messageEl.classList.add('hidden'), durationMs);
  }
}

function hideMessage() {
  messageEl.classList.add('hidden');
}

function setScore(value) {
  gameState.score = value;
  scoreEl.textContent = `Stars: ${value}`;
}

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height, false);
  const aspect = width / Math.max(height, 1);
  const viewHeight = 18;
  camera.left = (-viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
}

function clearLevelMeshes() {
  while (worldRoot.children.length > 1) {
    const child = worldRoot.children[1];
    worldRoot.remove(child);
    if (child.geometry) child.geometry.dispose?.();
  }
}

function createTileMesh(rect) {
  const mesh = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(rect.width, rect.height, gameConfig.world.groundDepth),
    tileMaterialTop
  );
  top.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2, 0);
  mesh.add(top);

  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(rect.width, 0.12, gameConfig.world.groundDepth + 0.06),
    tileMaterialSide
  );
  lip.position.set(rect.x + rect.width / 2, rect.y + rect.height - 0.06, -0.05);
  mesh.add(lip);

  return mesh;
}

function createStarMesh(position) {
  const star = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), starMaterial);
  star.position.set(position.x, position.y, 0.65);
  star.userData.baseY = position.y;
  return star;
}

function createGoalMesh(position) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.11, 12, 24),
    goalMaterial
  );
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({ color: '#ddffd6', emissive: '#88ff9b', emissiveIntensity: 0.7 })
  );
  ring.rotation.x = Math.PI / 2;
  gem.position.z = 0.05;
  group.add(ring, gem);
  group.position.set(position.x, position.y, 0.55);
  group.userData.baseY = position.y;
  return group;
}

function playerAabbAt(x, y) {
  return {
    minX: x - gameState.player.width / 2,
    maxX: x + gameState.player.width / 2,
    minY: y - gameState.player.height / 2,
    maxY: y + gameState.player.height / 2,
  };
}

function overlaps(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function rectToAabb(rect) {
  return {
    minX: rect.x,
    maxX: rect.x + rect.width,
    minY: rect.y,
    maxY: rect.y + rect.height,
  };
}

function resolveHorizontal(targetX) {
  const currentY = gameState.player.position.y;
  let resolvedX = targetX;
  let velocityX = gameState.player.velocity.x;
  const playerBox = playerAabbAt(resolvedX, currentY);

  for (const rect of gameState.solidRects) {
    const solidBox = rectToAabb(rect);
    if (!overlaps(playerBox, solidBox)) continue;

    if (velocityX > 0) {
      resolvedX = solidBox.minX - gameState.player.width / 2;
    } else if (velocityX < 0) {
      resolvedX = solidBox.maxX + gameState.player.width / 2;
    }
    velocityX = 0;
    playerBox.minX = resolvedX - gameState.player.width / 2;
    playerBox.maxX = resolvedX + gameState.player.width / 2;
  }

  gameState.player.position.x = resolvedX;
  gameState.player.velocity.x = velocityX;
}

function resolveVertical(targetY) {
  const currentX = gameState.player.position.x;
  let resolvedY = targetY;
  let velocityY = gameState.player.velocity.y;
  let landed = false;
  const playerBox = playerAabbAt(currentX, resolvedY);

  for (const rect of gameState.solidRects) {
    const solidBox = rectToAabb(rect);
    if (!overlaps(playerBox, solidBox)) continue;

    if (velocityY > 0) {
      resolvedY = solidBox.minY - gameState.player.height / 2;
    } else if (velocityY < 0) {
      resolvedY = solidBox.maxY + gameState.player.height / 2;
      landed = true;
    }
    velocityY = 0;
    playerBox.minY = resolvedY - gameState.player.height / 2;
    playerBox.maxY = resolvedY + gameState.player.height / 2;
  }

  gameState.player.position.y = resolvedY;
  gameState.player.velocity.y = velocityY;
  gameState.player.onGround = landed;
  if (landed) gameState.player.coyoteTimer = gameConfig.player.coyoteTime;
}

function updatePlayer(dt) {
  const left = keyState.has('ArrowLeft') || keyState.has('KeyA');
  const right = keyState.has('ArrowRight') || keyState.has('KeyD');
  const down = keyState.has('ArrowDown') || keyState.has('KeyS');
  void down;
  const jumpHeld = keyState.has('Space') || keyState.has('ArrowUp') || keyState.has('KeyW');
  const moveIntent = (right ? 1 : 0) - (left ? 1 : 0);

  if (moveIntent !== 0) gameState.player.facing = moveIntent;

  if (gameState.player.jumpBufferTimer > 0) gameState.player.jumpBufferTimer -= dt;
  if (gameState.player.coyoteTimer > 0 && !gameState.player.onGround) gameState.player.coyoteTimer -= dt;

  const targetSpeed = moveIntent * gameConfig.player.moveSpeed;
  const accel = gameState.player.onGround ? gameConfig.player.accelerationGround : gameConfig.player.accelerationAir;
  const friction = gameState.player.onGround ? gameConfig.player.frictionGround : gameConfig.player.frictionAir;

  if (moveIntent !== 0) {
    const delta = targetSpeed - gameState.player.velocity.x;
    const maxStep = accel * dt;
    gameState.player.velocity.x += Math.max(-maxStep, Math.min(maxStep, delta));
  } else {
    const drag = Math.min(Math.abs(gameState.player.velocity.x), friction * dt);
    gameState.player.velocity.x -= Math.sign(gameState.player.velocity.x || 0) * drag;
  }

  if (gameState.player.jumpBufferTimer > 0 && (gameState.player.onGround || gameState.player.coyoteTimer > 0)) {
    gameState.player.velocity.y = gameConfig.player.jumpVelocity;
    gameState.player.onGround = false;
    gameState.player.coyoteTimer = 0;
    gameState.player.jumpBufferTimer = 0;
  }

  if (!jumpHeld && gameState.player.velocity.y > 0) {
    gameState.player.velocity.y -= gameConfig.player.gravity * gameConfig.player.jumpCutMultiplier * dt;
  }

  gameState.player.velocity.y -= gameConfig.player.gravity * dt;
  gameState.player.velocity.y = Math.max(gameState.player.velocity.y, -gameConfig.player.maxFallSpeed);

  resolveHorizontal(gameState.player.position.x + gameState.player.velocity.x * dt);
  resolveVertical(gameState.player.position.y + gameState.player.velocity.y * dt);

  playerMesh.position.x = gameState.player.position.x;
  playerMesh.position.y = gameState.player.position.y;
  playerMesh.rotation.z = THREE.MathUtils.lerp(playerMesh.rotation.z, -gameState.player.velocity.x * 0.02, 0.1);
}

function updatePickupsAndGoal(elapsedTime) {
  for (const star of gameState.stars) {
    if (star.collected) continue;
    star.mesh.rotation.y += gameConfig.star.spinSpeed * 0.02;
    star.mesh.position.y = star.baseY + Math.sin(elapsedTime * gameConfig.star.bobSpeed + star.phase) * gameConfig.star.bobHeight;

    const dx = gameState.player.position.x - star.mesh.position.x;
    const dy = gameState.player.position.y - star.mesh.position.y;
    if (dx * dx + dy * dy < 0.52) {
      star.collected = true;
      star.mesh.visible = false;
      setScore(gameState.score + 1);
    }
  }

  if (goalMesh) {
    goalMesh.rotation.z += 0.01;
    goalMesh.position.y = gameState.level.goal.y + Math.sin(elapsedTime * gameConfig.goal.bobSpeed) * gameConfig.goal.bobHeight;

    const dx = gameState.player.position.x - gameState.level.goal.x;
    const dy = gameState.player.position.y - goalMesh.position.y;
    if (dx * dx + dy * dy < 0.72) {
      const totalStars = gameState.level.stars.length;
      setMessage(`Level complete — ${gameState.score}/${totalStars} stars collected`);
    }
  }
}

function updateCamera(dt) {
  const targetX = THREE.MathUtils.clamp(
    gameState.player.position.x,
    camera.left * -1 + 6,
    gameState.level.bounds.maxX - 6
  );
  const targetY = THREE.MathUtils.clamp(
    gameState.player.position.y + 1.8,
    4,
    gameState.level.bounds.maxY - 2
  );
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 1 - Math.exp(-dt * 5));
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 1 - Math.exp(-dt * 4));
}

function buildLevel(level) {
  clearLevelMeshes();
  hideMessage();
  gameState.level = level;
  gameState.solidRects = buildSolidRects(level.solids);
  gameState.stars = [];
  setScore(0);

  for (const rect of gameState.solidRects) {
    worldRoot.add(createTileMesh(rect));
  }

  goalMesh = createGoalMesh(level.goal);
  worldRoot.add(goalMesh);

  for (const star of level.stars) {
    const mesh = createStarMesh(star);
    worldRoot.add(mesh);
    gameState.stars.push({ ...star, mesh, baseY: star.y, phase: Math.random() * Math.PI * 2, collected: false });
  }

  gameState.player.position.set(level.start.x, level.start.y + 0.3);
  gameState.player.velocity.set(0, 0);
  gameState.player.onGround = false;
  gameState.player.coyoteTimer = 0;
  gameState.player.jumpBufferTimer = 0;
  playerMesh.position.set(gameState.player.position.x, gameState.player.position.y, 0.4);

  camera.position.x = gameState.player.position.x;
  camera.position.y = gameState.player.position.y + 2;

  if (level.unknownColors.length > 0) {
    setMessage(`Loaded with ignored colors: ${level.unknownColors.map((entry) => entry.hex).join(', ')}`, 4200);
  }
}

async function loadDefaultLevel() {
  const level = await loadLevelFromImageUrl('/levels/world-1.png');
  buildLevel(level);
}

menuButton.addEventListener('click', () => {
  menuPanel.classList.toggle('hidden');
});

reloadButton.addEventListener('click', async () => {
  menuPanel.classList.add('hidden');
  await loadDefaultLevel();
});

levelFileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    menuPanel.classList.add('hidden');
    const image = await loadImageFromFile(file);
    const level = parseImageDataToLevel(getImageDataFromImage(image));
    buildLevel(level);
    setMessage(`Imported ${file.name}`);
  } catch (error) {
    setMessage(error.message || 'Could not import level.', 4000);
  } finally {
    event.target.value = '';
  }
});

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(event.code)) {
    event.preventDefault();
  }

  if (!keyState.has(event.code) && (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW')) {
    gameState.player.jumpBufferTimer = gameConfig.player.jumpBufferTime;
  }

  keyState.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keyState.delete(event.code);
});

window.addEventListener('resize', resize);
resize();

async function init() {
  await loadDefaultLevel();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    const elapsed = clock.elapsedTime;
    if (gameState.level) {
      updatePlayer(dt);
      updatePickupsAndGoal(elapsed);
      updateCamera(dt);
    }
    renderer.render(scene, camera);
  });
}

init().catch((error) => {
  console.error(error);
  setMessage(error.message || 'Failed to start game.', 6000);
});
