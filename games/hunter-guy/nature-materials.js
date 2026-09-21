import * as THREE from "three";
export { seededRandom } from "./core/world.js";
let loadTexture;
export function configureNatureTextures(loader) { loadTexture = loader; }
export function natureTexture(kind) {
  if (!loadTexture) throw new Error("Hunter Guy textures must be loaded before creating a scene");
  const texture = loadTexture(kind);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (!["needles", "leaves", "sky"].includes(kind)) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function windMaterial(map, strength) {
  const material = new THREE.MeshStandardMaterial({
    map, alphaTest: 0.38, side: THREE.DoubleSide, roughness: 1,
  });
  const time = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.windTime = time;
    shader.vertexShader = `uniform float windTime;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       vec4 root = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
       transformed.x += sin(windTime * 1.5 + root.x * 0.17 + root.z * 0.12) * pow(uv.y, 2.0) * ${strength.toFixed(3)};`
    );
  };
  material.customProgramCacheKey = () => `forest-wind-${strength}`;
  return { material, time };
}
