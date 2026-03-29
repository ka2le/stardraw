export function updateGoal(state, goalMesh, config, elapsedTime) {
  if (!goalMesh || !state.level) return false;
  goalMesh.rotation.z += 0.01;
  goalMesh.position.y = state.level.goal.y + Math.sin(elapsedTime * config.goal.bobSpeed) * config.goal.bobHeight;

  const dx = state.player.position.x - state.level.goal.x;
  const dy = state.player.position.y - goalMesh.position.y;
  const goalRadius = config.goal.radius * 0.9 + state.player.width * 0.35;
  return dx * dx + dy * dy < goalRadius * goalRadius;
}
