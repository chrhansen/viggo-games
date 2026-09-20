import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';
import { GROUND_LEVEL, ROAD_SURFACE_LIFT } from './track';

const ROAD_WIDTH = 14;
type RoadSample = {
  position: Vector3;
  surfaceHeight: number;
};

export function createRoute() {
const roadPoints = [
  [0, 0],
  [20, 28],
  [58, 64],
  [108, 54],
  [146, 6],
  [136, -52],
  [92, -92],
  [28, -86],
  [-22, -54],
  [-72, -70],
  [-128, -36],
  [-146, 30],
  [-116, 92],
  [-56, 118],
  [8, 96],
  [54, 132],
  [112, 162],
  [170, 126],
  [192, 58],
  [170, -16],
  [118, -82],
  [42, -126],
  [-42, -118],
  [-118, -88],
  [-188, -12],
  [-174, 82],
  [-100, 150],
  [-6, 176],
  [88, 154],
].map(([x, z]) => new Vector3(x, GROUND_LEVEL, z));

return new CatmullRomCurve3(roadPoints, true, 'centripetal', 0.45);
}

export function buildRoadSamples(curvePath: CatmullRomCurve3, sampleCount: number) {
  const samples: RoadSample[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const point = curvePath.getPointAt(index / sampleCount);
    samples.push({
      position: point,
      surfaceHeight: point.y + ROAD_SURFACE_LIFT,
    });
  }

  return samples;
}

export function getSurfaceHeight(worldPosition: Vector3, roadSamplePoints: RoadSample[]) {
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;
  let nearestRoadHeight = 0;

  for (const sample of roadSamplePoints) {
    const dx = worldPosition.x - sample.position.x;
    const dz = worldPosition.z - sample.position.z;
    const distanceSquared = dx * dx + dz * dz;

    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestRoadHeight = sample.surfaceHeight;
    }
  }

  const nearestDistance = Math.sqrt(nearestDistanceSquared);
  const roadBlend = 1 - MathUtils.smoothstep(nearestDistance, ROAD_WIDTH * 0.45, ROAD_WIDTH * 0.95);
  return MathUtils.lerp(GROUND_LEVEL, nearestRoadHeight, roadBlend);
}
