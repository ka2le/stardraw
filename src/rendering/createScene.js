import * as THREE from 'three';

export function createScene(config) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.world.backgroundBottom);

  const camera = new THREE.OrthographicCamera(-24, 24, 14, -14, 0.1, 100);
  camera.position.set(0, 0, 20);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.05);
  sunLight.position.set(8, 18, 14);
  scene.add(sunLight);

  const backgroundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 120),
    new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(config.world.backgroundTop) },
        bottomColor: { value: new THREE.Color(config.world.backgroundBottom) },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0); }',
      depthWrite: false,
    })
  );
  backgroundPlane.position.z = -12;
  scene.add(backgroundPlane);

  const worldRoot = new THREE.Group();
  scene.add(worldRoot);

  return { scene, camera, worldRoot };
}
