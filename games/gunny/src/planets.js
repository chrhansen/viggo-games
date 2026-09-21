import * as THREE from "three";

export const SUN_DIRECTION = new THREE.Vector3(-0.65, 0.5, 0.65).normalize();
const textures = {};

function loadMap(name, url, color = false) {
  if (!textures[name]) {
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    textures[name] = texture;
  }
  return textures[name];
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const lighting = `
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
`;

function material(uniforms, fragmentShader, options = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { sunDirection: { value: SUN_DIRECTION }, ...uniforms },
    vertexShader,
    fragmentShader: lighting + fragmentShader,
    ...options,
  });
}

function sphere(radius, shader) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), shader);
}

export function createPlanet(radius, kind) {
  const planet = new THREE.Group();
  if (kind === "moon") {
    const body = sphere(radius, material({
      surface: { value: loadMap("moon", new URL("../assets/moon.jpg", import.meta.url).href, true) },
    }, `
      uniform sampler2D surface;
      void main() {
        float light = max(0.0, dot(normalize(vNormal), sunDirection));
        vec3 rock = texture2D(surface, vUv).rgb;
        gl_FragColor = vec4(rock * (0.025 + light * 1.7), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `));
    planet.add(body);
    planet.userData.body = body;
    return planet;
  }

  const cloudsMap = loadMap("clouds", new URL("../assets/earth-clouds.jpg", import.meta.url).href);
  const body = sphere(radius, material({
    surface: { value: loadMap("day", new URL("../assets/earth-day.jpg", import.meta.url).href, true) },
    night: { value: loadMap("night", new URL("../assets/earth-night.jpg", import.meta.url).href, true) },
    ocean: { value: loadMap("ocean", new URL("../assets/earth-ocean.jpg", import.meta.url).href) },
    clouds: { value: cloudsMap },
    cloudOffset: { value: 0 },
  }, `
    uniform sampler2D surface;
    uniform sampler2D night;
    uniform sampler2D ocean;
    uniform sampler2D clouds;
    uniform float cloudOffset;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 view = normalize(cameraPosition - vPosition);
      float sunlight = dot(normal, sunDirection);
      float daylight = smoothstep(-0.12, 0.22, sunlight);
      float cloudShadow = texture2D(clouds, vUv + vec2(cloudOffset + 0.0015, 0.001)).r;
      vec3 land = texture2D(surface, vUv).rgb;
      vec3 color = land * (0.012 + max(sunlight, 0.0) * 1.75) * (1.0 - cloudShadow * 0.23);
      color += texture2D(night, vUv).rgb * (1.0 - daylight) * 1.2;
      float glint = pow(max(dot(reflect(-sunDirection, normal), view), 0.0), 48.0);
      color += vec3(0.95, 0.85, 0.65) * glint * texture2D(ocean, vUv).r * daylight * 0.55;
      float rim = pow(1.0 - max(dot(normal, view), 0.0), 3.0);
      color += vec3(0.06, 0.25, 0.65) * rim * daylight * 0.5;
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `));
  const clouds = sphere(radius * 1.006, material({ map: { value: cloudsMap } }, `
    uniform sampler2D map;
    void main() {
      float density = texture2D(map, vUv).r;
      float light = max(dot(normalize(vNormal), sunDirection), 0.0);
      gl_FragColor = vec4(vec3(0.035, 0.045, 0.065) + vec3(light * 1.8), density * 0.92);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `, { transparent: true, depthWrite: false }));
  const atmosphere = sphere(radius * 1.025, material({}, `
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 view = normalize(cameraPosition - vPosition);
      float edge = pow(1.0 - abs(dot(normal, view)), 4.0);
      float light = smoothstep(-0.25, 0.5, dot(normal, sunDirection));
      gl_FragColor = vec4(vec3(0.12, 0.4, 0.95), edge * light * 0.5);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `, { transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  planet.rotation.z = THREE.MathUtils.degToRad(-23.4);
  planet.add(body, clouds, atmosphere);
  planet.userData.body = body;
  planet.userData.clouds = clouds;
  return planet;
}
