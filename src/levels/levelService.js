import { getImageDataFromImage, loadImageFromFile, loadLevelFromImageUrl, parseImageDataToLevel } from './levelLoader.js';
import { loadTexture } from './backgroundLoader.js';

export async function loadDefaultLevel() {
  const level = await loadLevelFromImageUrl('./levels/world-1.png');
  try {
    level.backgroundImage = await loadTexture('./levels/background-1.png');
  } catch {
    level.backgroundImage = null;
  }
  return level;
}

export async function loadLevelFromFile(file, backgroundFile = null) {
  const image = await loadImageFromFile(file);
  const level = parseImageDataToLevel(getImageDataFromImage(image));
  if (backgroundFile) {
    level.backgroundImage = await loadImageFromFile(backgroundFile);
  }
  return level;
}
