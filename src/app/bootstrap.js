import * as THREE from 'three';
import { getDom } from '../ui/dom.js';
import { createGame } from './createGame.js';

export async function bootstrap() {
  const dom = getDom();
  const game = createGame(dom);
  const clock = new THREE.Clock();

  game.resize();
  window.addEventListener('resize', () => game.resize());
  await game.loadBundledLevel();

  function loop() {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    const elapsed = clock.elapsedTime;
    game.update(dt, elapsed);
    game.render();
    requestAnimationFrame(loop);
  }

  loop();
}
