import { resolveHorizontal, resolveVertical } from './collisions.js';

export function updatePlayer(player, input, solidRects, config, dt) {
  const moveIntent = (input.isRightPressed() ? 1 : 0) - (input.isLeftPressed() ? 1 : 0);
  const jumpHeld = input.isJumpHeld();
  if (moveIntent !== 0) player.facing = moveIntent;
  if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;
  if (player.coyoteTimer > 0 && !player.onGround) player.coyoteTimer -= dt;

  const targetSpeed = moveIntent * config.player.moveSpeed;
  const accel = player.onGround ? config.player.accelerationGround : config.player.accelerationAir;
  const friction = player.onGround ? config.player.frictionGround : config.player.frictionAir;
  if (moveIntent !== 0) {
    const delta = targetSpeed - player.velocity.x;
    const maxStep = accel * dt;
    player.velocity.x += Math.max(-maxStep, Math.min(maxStep, delta));
  } else {
    const drag = Math.min(Math.abs(player.velocity.x), friction * dt);
    player.velocity.x -= Math.sign(player.velocity.x || 0) * drag;
  }

  if (player.jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0)) {
    player.velocity.y = config.player.jumpVelocity * (player.jumpMultiplier || 1);
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
  }
  if (!jumpHeld && player.velocity.y > 0) player.velocity.y -= config.player.gravity * config.player.jumpCutMultiplier * dt;
  player.velocity.y -= config.player.gravity * dt;
  player.velocity.y = Math.max(player.velocity.y, -config.player.maxFallSpeed);
  resolveHorizontal(player, solidRects, player.position.x + player.velocity.x * dt, config.player.stepHeight);
  resolveVertical(player, solidRects, player.position.y + player.velocity.y * dt, config.player.coyoteTime);
}
