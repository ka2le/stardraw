export function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load background image from ${url}`));
    image.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  });
}
