import { createMessages } from '../ui/messages.js';
import { createHud } from '../ui/hud.js';
import { createMenuController } from '../ui/menuController.js';
import { createWinModal } from '../ui/winModal.js';
import { createDeathModal } from '../ui/deathModal.js';
import { createScene } from '../rendering/createScene.js';
import { createRenderer } from '../rendering/createRenderer.js';
import { createMaterials } from '../rendering/materials.js';
import { createWorldView } from '../rendering/worldView.js';
import { frameLevel, resizeRenderer, updateCamera } from '../rendering/cameraController.js';
import { createInputController } from '../gameplay/inputController.js';
import { updatePlayer } from '../gameplay/playerController.js';
import { updateInteractions, updateLava } from '../gameplay/pickups.js';
import { updateGoal } from '../gameplay/goalSystem.js';
import { createGameState } from '../state/createGameState.js';
import { loadDefaultLevel, loadLevelFromFile } from '../levels/levelService.js';
import { buildWorldRuntime } from '../levels/worldBuilder.js';
import { gameConfig } from '../config/gameConfig.js';

export function createGame(dom) {
  const renderer = createRenderer(dom.container);
  const { scene, camera, worldRoot } = createScene(gameConfig);
  const materials = createMaterials(gameConfig);
  const worldView = createWorldView(worldRoot, materials, gameConfig);
  const state = createGameState();
  const input = createInputController();
  const messages = createMessages(dom.messageEl);
  const hud = createHud(dom);
  const winModal = createWinModal(dom, { onRestart: async () => loadBundledLevel(), onImport: () => dom.levelFileInput.click() });
  const deathModal = createDeathModal(dom, { onRestart: async () => loadBundledLevel(), onImport: () => dom.levelFileInput.click() });

  function rebuildActiveSolids() {
    state.activeSolidRects = [...state.baseSolidRects, ...state.doors.filter((door) => !door.removed).flatMap((door) => door.solidRects)];
  }

  function respawnPlayer() {
    state.player.position.copy(state.player.spawn);
    state.player.velocity.set(0, 0);
    state.player.onGround = false;
    state.player.coyoteTimer = 0;
    state.player.jumpBufferTimer = 0;
  }

  function syncHud() {
    hud.setStars(state.score, state.level?.stars.length ?? 0);
    hud.setLives(state.lives);
    hud.setKeys(state.keyCount);
    hud.setBootsActive(state.bootsActive);
  }

  function applyLevel(level) {
    state.level = level;
    const runtimeWorld = buildWorldRuntime(level);
    state.baseSolidRects = runtimeWorld.baseSolidRects;
    state.activeSolidRects = runtimeWorld.activeSolidRects;
    state.stars = runtimeWorld.stars;
    state.keysOnMap = runtimeWorld.keys;
    state.hearts = runtimeWorld.hearts;
    state.jumpBootsItems = runtimeWorld.jumpBoots;
    state.lava = runtimeWorld.lava;
    state.doors = runtimeWorld.doors;
    state.score = 0;
    state.keyCount = 0;
    state.lives = state.maxLives;
    state.bootsActive = false;
    state.levelComplete = false;
    state.respawnLockTimer = 0;
    state.player.jumpMultiplier = 1;
    state.player.spawn.set(level.start.x, level.start.y + state.player.height * 0.5);
    respawnPlayer();
    syncHud();
    winModal.hide();
    deathModal.hide();
    worldView.buildLevel(level, runtimeWorld);
    worldView.syncPlayer(state.player);
    frameLevel(camera, level, gameConfig);
    messages.hide();
    if (level.unknownColors.length > 0) messages.show(`Ignored colors: ${level.unknownColors.map((entry) => entry.hex).join(', ')}`, 4200, 'warning');
  }

  async function loadBundledLevel() { applyLevel(await loadDefaultLevel()); }
  let pendingLevelFile = null;
  async function importLevel(file, backgroundFile = null) { try { pendingLevelFile = file; applyLevel(await loadLevelFromFile(file, backgroundFile)); messages.show(`Imported ${file.name}`, 2200, 'success'); } catch (error) { messages.show(error.message || 'Could not import level.', 4500, 'danger'); } }
  async function importBackground(backgroundFile) { if (!pendingLevelFile) { messages.show('Import a level PNG first, then a matching background PNG.', 4200, 'warning'); return; } await importLevel(pendingLevelFile, backgroundFile); messages.show(`Loaded background ${backgroundFile.name}`, 2200, 'success'); }
  createMenuController(dom, { onImport: importLevel, onImportBackground: importBackground, onReload: loadBundledLevel });
  window.addEventListener('keydown', (event) => input.markJumpPress(event.code, state.player, gameConfig));

  function resize() { resizeRenderer(renderer, camera, dom.container); }

  function update(dt, elapsedTime) {
    if (!state.level) return;
    if (state.respawnLockTimer > 0) state.respawnLockTimer -= dt;
    rebuildActiveSolids();
    updatePlayer(state.player, input, state.activeSolidRects, gameConfig, dt);
    updateInteractions(state, worldView, gameConfig, elapsedTime, messages);
    rebuildActiveSolids();
    if (updateLava(state, messages)) {
      if (state.lives > 0) respawnPlayer();
      else if (!state.levelComplete) deathModal.show(0);
    }
    syncHud();
    const won = updateGoal(state, worldView.getGoalMesh(), gameConfig, elapsedTime);
    if (won && !state.levelComplete) { state.levelComplete = true; winModal.show({ collected: state.score, total: state.level.stars.length }); messages.hide(); }
    updateCamera(camera, state.level, state.player.position, dt, gameConfig);
    worldView.syncPlayer(state.player);
  }

  function render() { renderer.render(scene, camera); }
  return { loadBundledLevel, resize, update, render };
}
