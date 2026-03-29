export function createInputController() {
  const keys = new Set();

  const isJumpCode = (code) => code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
  const isMovementCode = (code) => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(code);

  window.addEventListener('keydown', (event) => {
    if (isMovementCode(event.code)) event.preventDefault();
    keys.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });

  return {
    isLeftPressed: () => keys.has('ArrowLeft') || keys.has('KeyA'),
    isRightPressed: () => keys.has('ArrowRight') || keys.has('KeyD'),
    isJumpHeld: () => isJumpCode('Space') && (keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')),
    markJumpPress(code, player, config) {
      if (isJumpCode(code)) {
        player.jumpBufferTimer = config.player.jumpBufferTime;
      }
    },
  };
}
