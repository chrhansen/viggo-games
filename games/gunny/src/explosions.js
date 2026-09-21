import * as THREE from "three";

export const EXPLOSION_LIFETIME = 1.25;
export const IMPACT_LIFETIME = 0.42;

const noise = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
`;

function direction() {
  const z = Math.random() * 2 - 1;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(1 - z * z);
  return new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), z);
}

function createFire(tint, large) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.attributes.position = plane.attributes.position;
  geometry.attributes.uv = plane.attributes.uv;
  const count = large ? 22 : 8;
  const velocities = [];
  const variations = [];
  for (let i = 0; i < count; i++) {
    velocities.push(...direction().multiplyScalar(1.5 + Math.random() * 3.5).toArray());
    variations.push(Math.random(), 0.65 + Math.random() * 0.65);
  }
  geometry.setAttribute("velocity", new THREE.InstancedBufferAttribute(new Float32Array(velocities), 3));
  geometry.setAttribute("variation", new THREE.InstancedBufferAttribute(new Float32Array(variations), 2));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: { age: { value: 0 }, duration: { value: large ? 0.85 : 0.34 }, tint: { value: new THREE.Color(large ? 0xff681c : tint) } },
    vertexShader: `
      attribute vec3 velocity;
      attribute vec2 variation;
      uniform float age;
      uniform float duration;
      varying vec2 vUv;
      varying float vSeed;
      varying float vLife;
      void main() {
        vUv = uv;
        vSeed = variation.x;
        vLife = clamp(age / (duration * (0.7 + variation.x * 0.3)), 0.0, 1.0);
        vec4 center = modelViewMatrix * vec4(velocity * (age + 0.035), 1.0);
        float scale = length(modelMatrix[0].xyz);
        float size = variation.y * (0.8 + vLife * 3.0);
        center.xy += position.xy * size * scale;
        gl_Position = projectionMatrix * center;
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      varying vec2 vUv;
      varying float vSeed;
      varying float vLife;
      ${noise}
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float turbulence = noise(p * 4.0 + vSeed * 30.0 - vLife * 2.0);
        turbulence += noise(p * 9.0 + vSeed * 20.0 + vLife * 3.0) * 0.5;
        float density = 1.0 - length(p) + (turbulence - 0.75) * 0.6;
        float alpha = smoothstep(0.0, 0.45, density) * pow(1.0 - vLife, 1.6);
        float heat = clamp(density * 0.3 + (1.0 - vLife) * 0.75, 0.0, 1.0);
        vec3 cool = tint * vec3(0.5, 0.12, 0.035);
        vec3 hot = mix(tint * 2.5, vec3(4.0, 3.4, 2.5), pow(heat, 6.0));
        gl_FragColor = vec4(mix(cool, hot, heat), alpha * 0.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const fire = new THREE.Mesh(geometry, material);
  fire.frustumCulled = false;
  return fire;
}

function createSparks(tint, large) {
  const positions = [];
  const velocities = [];
  const ends = [];
  for (let i = 0; i < (large ? 44 : 16); i++) {
    const velocity = direction().multiplyScalar(4 + Math.random() * 8);
    positions.push(0, 0, 0, 0, 0, 0);
    velocities.push(...velocity.toArray(), ...velocity.toArray());
    ends.push(0, 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new THREE.Float32BufferAttribute(velocities, 3));
  geometry.setAttribute("end", new THREE.Float32BufferAttribute(ends, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { age: { value: 0 }, duration: { value: large ? EXPLOSION_LIFETIME : IMPACT_LIFETIME }, tint: { value: new THREE.Color(tint) } },
    vertexShader: `
      attribute vec3 velocity;
      attribute float end;
      uniform float age;
      varying float vEnd;
      void main() {
        vEnd = end;
        float travel = max(0.0, age - end * 0.035);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(velocity * travel, 1.0);
      }
    `,
    fragmentShader: `
      uniform float age;
      uniform float duration;
      uniform vec3 tint;
      varying float vEnd;
      void main() {
        float fade = pow(max(0.0, 1.0 - age / duration), 1.5);
        gl_FragColor = vec4(mix(tint * 2.0, vec3(3.0), fade * 0.6), fade * (1.0 - vEnd * 0.8));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparks = new THREE.LineSegments(geometry, material);
  sparks.frustumCulled = false;
  return sparks;
}

export function createExplosion(color, large = true) {
  const explosion = new THREE.Group();
  const fire = createFire(color, large);
  const sparks = createSparks(color, large);
  explosion.add(fire, sparks);
  explosion.userData.fire = fire;
  explosion.userData.sparks = sparks;

  if (large) {
    const debris = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x4d4541, roughness: 0.75, metalness: 0.65,
        emissive: 0xff5a15, emissiveIntensity: 2, transparent: true }),
      14
    );
    debris.frustumCulled = false;
    debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    explosion.add(debris);
    explosion.userData.debris = debris;
    explosion.userData.fragments = Array.from({ length: 14 }, () => ({
      velocity: direction().multiplyScalar(2 + Math.random() * 5),
      spin: direction().multiplyScalar(8),
      size: 0.4 + Math.random() * 1.2,
    }));
  }
  updateExplosion(explosion, 0);
  return explosion;
}

const fragmentTransform = new THREE.Object3D();

export function updateExplosion(explosion, age) {
  const { fire, sparks, debris, fragments } = explosion.userData;
  fire.material.uniforms.age.value = age;
  sparks.material.uniforms.age.value = age;
  if (!debris) return;
  debris.material.emissiveIntensity = 2 * Math.exp(-age * 7);
  debris.material.opacity = 1 - THREE.MathUtils.smoothstep(age, 0.8, EXPLOSION_LIFETIME);
  fragments.forEach((fragment, index) => {
    fragmentTransform.position.copy(fragment.velocity).multiplyScalar(age);
    fragmentTransform.rotation.set(fragment.spin.x * age, fragment.spin.y * age, fragment.spin.z * age);
    fragmentTransform.scale.set(fragment.size, fragment.size * 0.4, fragment.size * 1.7);
    fragmentTransform.updateMatrix();
    debris.setMatrixAt(index, fragmentTransform.matrix);
  });
  debris.instanceMatrix.needsUpdate = true;
}

export function disposeExplosion(explosion) {
  explosion.removeFromParent();
  explosion.traverse((part) => {
    part.geometry?.dispose();
    part.material?.dispose();
    if (part.isInstancedMesh) part.dispose();
  });
}
