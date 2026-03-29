function overlapBounds(player, bounds) {
  const halfW = player.width / 2;
  const halfH = player.height / 2;
  return player.position.x + halfW > bounds.minX && player.position.x - halfW < bounds.maxX && player.position.y + halfH > bounds.minY && player.position.y - halfH < bounds.maxY;
}

function animateViews(items, views, bobHeight, bobSpeed, elapsedTime, spinSpeed = 0) {
  for (const item of items) {
    const view = views.find((entry) => entry.id === item.id);
    if (!view || item.collected) continue;
    if (spinSpeed) view.mesh.rotation.y += spinSpeed * 0.02;
    view.mesh.position.y = item.baseY + Math.sin(elapsedTime * bobSpeed + item.phase) * bobHeight;
  }
}

export function updateInteractions(state, worldView, config, elapsedTime, messages) {
  animateViews(state.stars, worldView.getStarViews(), config.star.bobHeight, config.star.bobSpeed, elapsedTime, config.star.spinSpeed);
  animateViews(state.keysOnMap, worldView.getKeyViews(), config.key.bobHeight, config.key.bobSpeed, elapsedTime, 1.2);
  animateViews(state.hearts, worldView.getHeartViews(), config.heart.bobHeight, config.heart.bobSpeed, elapsedTime, 1.1);
  animateViews(state.jumpBootsItems, worldView.getBootsViews(), config.jumpBoots.bobHeight, config.jumpBoots.bobSpeed, elapsedTime, 0.9);

  for (const star of state.stars) {
    if (star.collected || !overlapBounds(state.player, star.bounds)) continue;
    star.collected = true;
    worldView.getStarViews().find((entry) => entry.id === star.id).mesh.visible = false;
    state.score += 1;
  }

  for (const key of state.keysOnMap) {
    if (key.collected || !overlapBounds(state.player, key.bounds)) continue;
    key.collected = true;
    worldView.getKeyViews().find((entry) => entry.id === key.id).mesh.visible = false;
    state.keyCount += 1;
    messages.show('Picked up a key', 1800, 'success');
  }

  for (const heart of state.hearts) {
    if (heart.collected || state.lives >= state.maxLives || !overlapBounds(state.player, heart.bounds)) continue;
    heart.collected = true;
    worldView.getHeartViews().find((entry) => entry.id === heart.id).mesh.visible = false;
    state.lives = Math.min(state.maxLives, state.lives + 1);
    messages.show('Life restored', 1800, 'success');
  }

  for (const boots of state.jumpBootsItems) {
    if (boots.collected || !overlapBounds(state.player, boots.bounds)) continue;
    boots.collected = true;
    worldView.getBootsViews().find((entry) => entry.id === boots.id).mesh.visible = false;
    state.bootsActive = true;
    state.player.jumpMultiplier = config.player.jumpBootsMultiplier;
    messages.show('Jump boots equipped', 2200, 'success');
  }

  for (const door of state.doors) {
    if (door.removed || !overlapBounds(state.player, door.bounds)) continue;
    if (state.keyCount > 0) {
      state.keyCount -= 1;
      door.removed = true;
      worldView.setDoorVisible(door.id, false);
      messages.show('Door unlocked', 1800, 'success');
    }
  }
}

export function updateLava(state, messages) {
  if (state.respawnLockTimer > 0) return false;
  for (const lava of state.lava) {
    if (overlapBounds(state.player, lava.bounds)) {
      state.lives -= 1;
      state.respawnLockTimer = 0.7;
      messages.show('Lava burns — life lost', 1800, 'danger');
      return true;
    }
  }
  return false;
}
