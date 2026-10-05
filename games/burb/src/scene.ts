import {
  Color, DirectionalLight, Fog, HemisphereLight, Matrix4, Mesh, PerspectiveCamera,
  Scene, Texture, Vector3, type Material,
} from 'three';
import { createBurbGame, type BurbGame, type BurbInput } from '../core/engine';
import { createRoute, buildRoadSamples, getSurfaceHeight } from './route';
import {
  createGround, createHandlebars, createMountains, createRoad, createScenery,
  createSky, fitHandlebarRig,
} from './sceneBuilders';
import type { BurbTextureFactory } from './textures';

const EYE_HEIGHT = 1.45;
const UP = new Vector3(0, 1, 0);

export function createBurbScene(options: { aspect: number; textures: BurbTextureFactory; anisotropy?: number; engine?: BurbGame }) {
  const { textures, anisotropy = 1 } = options;
  const scene = new Scene();
  scene.background = new Color('#87bfe8');
  scene.fog = new Fog('#87bfe8', 70, 380);
  const camera = new PerspectiveCamera(74, options.aspect, 0.1, 1200);
  const sun = new DirectionalLight('#fff3d8', 2.2);
  sun.position.set(90, 120, 40);
  scene.add(camera, new HemisphereLight('#d8efff', '#31541f', 1.8), sun, createSky(textures));

  const curve = createRoute();
  const point = curve.getPointAt(0.02);
  const tangent = curve.getTangentAt(0.02).normalize();
  const roadSamples = buildRoadSamples(curve, 720);
  const scenery = createScenery(curve, textures);
  const mountains = createMountains(curve);
  scene.add(createGround(anisotropy, textures), createRoad(curve, anisotropy, textures), scenery.group, mountains.group);
  const colliders = [...scenery.colliders, ...mountains.colliders];
  const engine = options.engine ?? createBurbGame({
    position: { x: point.x, y: point.y, z: point.z },
    heading: Math.atan2(tangent.x, tangent.z),
    colliders,
    surfaceHeight: (position) => getSurfaceHeight(position, roadSamples),
  });
  const handlebars = createHandlebars();
  fitHandlebarRig(handlebars, EYE_HEIGHT);
  camera.add(handlebars.group);
  const lookMatrix = new Matrix4();
  const forward = new Vector3();
  const right = new Vector3();
  const target = new Vector3();

  function sync() {
    const state = engine.state;
    const bobPhase = state.elapsed * state.speed * 1.18;
    const bobLift = Math.sin(bobPhase) * 0.03;
    const bobSide = Math.sin(bobPhase * 0.5) * 0.018;
    forward.set(Math.sin(state.heading), 0, Math.cos(state.heading));
    right.crossVectors(UP, forward).normalize();
    camera.position.set(state.position.x, state.position.y, state.position.z)
      .addScaledVector(right, bobSide).addScaledVector(UP, EYE_HEIGHT + bobLift);
    lookMatrix.lookAt(camera.position, target.copy(camera.position).add(forward), UP);
    camera.quaternion.setFromRotationMatrix(lookMatrix);
    camera.rotateZ(-state.roll);
    handlebars.steerPivot.rotation.set(0, -state.steer * 0.42, 0);
    handlebars.group.position.set(
      handlebars.restPosition.x + bobSide * 0.35,
      handlebars.restPosition.y + bobLift * 0.22,
      handlebars.restPosition.z,
    );
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
  }
  sync();
  let disposed = false;
  return {
    scene, camera, engine, colliders, handlebars,
    step(delta: number, input: BurbInput) {
      if (disposed) return;
      engine.step(delta, input);
      sync();
    },
    resize(width: number, height: number) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      engine.setActive(false);
      const geometries = new Set<Mesh['geometry']>();
      const materials = new Set<Material>();
      const maps = new Set<Texture>();
      scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material);
          for (const value of Object.values(material)) if (value instanceof Texture) maps.add(value);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      maps.forEach((texture) => texture.dispose());
      scene.clear();
    },
  };
}

export type BurbScene = ReturnType<typeof createBurbScene>;
