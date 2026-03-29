export function playerAabbAt(player, x, y) {
  return {
    minX: x - player.width / 2,
    maxX: x + player.width / 2,
    minY: y - player.height / 2,
    maxY: y + player.height / 2,
  };
}

export function rectToAabb(rect) {
  return {
    minX: rect.x,
    maxX: rect.x + rect.width,
    minY: rect.y,
    maxY: rect.y + rect.height,
  };
}

export function overlaps(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function collidesAt(player, solidRects, x, y) {
  const playerBox = playerAabbAt(player, x, y);
  for (const rect of solidRects) {
    if (overlaps(playerBox, rectToAabb(rect))) return true;
  }
  return false;
}

export function resolveHorizontal(player, solidRects, targetX, stepHeight = 0) {
  const currentY = player.position.y;
  let resolvedX = targetX;
  let resolvedY = currentY;
  let velocityX = player.velocity.x;
  const playerBox = playerAabbAt(player, resolvedX, currentY);

  for (const rect of solidRects) {
    const solidBox = rectToAabb(rect);
    if (!overlaps(playerBox, solidBox)) continue;

    const canStep =
      stepHeight > 0 &&
      player.velocity.y <= 0 &&
      currentY + player.height / 2 >= solidBox.maxY &&
      solidBox.maxY - (currentY - player.height / 2) <= stepHeight &&
      !collidesAt(player, solidRects, resolvedX, solidBox.maxY + player.height / 2 + 0.001);

    if (canStep) {
      resolvedY = solidBox.maxY + player.height / 2 + 0.001;
      playerBox.minY = resolvedY - player.height / 2;
      playerBox.maxY = resolvedY + player.height / 2;
      continue;
    }

    if (velocityX > 0) resolvedX = solidBox.minX - player.width / 2;
    else if (velocityX < 0) resolvedX = solidBox.maxX + player.width / 2;
    velocityX = 0;
    playerBox.minX = resolvedX - player.width / 2;
    playerBox.maxX = resolvedX + player.width / 2;
  }

  player.position.x = resolvedX;
  player.position.y = resolvedY;
  player.velocity.x = velocityX;
}

export function resolveVertical(player, solidRects, targetY, coyoteTime) {
  const currentX = player.position.x;
  let resolvedY = targetY;
  let velocityY = player.velocity.y;
  let landed = false;
  const playerBox = playerAabbAt(player, currentX, resolvedY);

  for (const rect of solidRects) {
    const solidBox = rectToAabb(rect);
    if (!overlaps(playerBox, solidBox)) continue;
    if (velocityY > 0) resolvedY = solidBox.minY - player.height / 2;
    else if (velocityY < 0) {
      resolvedY = solidBox.maxY + player.height / 2;
      landed = true;
    }
    velocityY = 0;
    playerBox.minY = resolvedY - player.height / 2;
    playerBox.maxY = resolvedY + player.height / 2;
  }

  player.position.y = resolvedY;
  player.velocity.y = velocityY;
  player.onGround = landed;
  if (landed) player.coyoteTimer = coyoteTime;
}
