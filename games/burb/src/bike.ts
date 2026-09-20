import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

export type HandlebarRig = {
  group: Group;
  restPosition: Vector3;
  referencePoint: Mesh;
  steerPivot: Group;
};

export function createHandlebars(): HandlebarRig {
  const group = new Group();
  group.position.set(0, -0.75, -1.2);
  const steerPivot = new Group();
  const steerPivotOffset = new Vector3(0, -0.1, -0.45);

  const carbonMaterial = new MeshStandardMaterial({
    color: '#1a1c1e',
    metalness: 0.82,
    roughness: 0.3,
  });
  const tapeMaterial = new MeshStandardMaterial({
    color: '#2b2b2b',
    metalness: 0.08,
    roughness: 0.88,
  });
  const alloyMaterial = new MeshStandardMaterial({
    color: '#5b6066',
    metalness: 0.76,
    roughness: 0.34,
  });
  const rubberMaterial = new MeshStandardMaterial({
    color: '#222325',
    roughness: 0.95,
    metalness: 0.02,
  });
  const cableMaterial = new MeshStandardMaterial({
    color: '#111214',
    roughness: 0.72,
    metalness: 0.12,
  });
  const tireMaterial = new MeshStandardMaterial({
    color: '#181818',
    roughness: 0.96,
    metalness: 0.03,
  });
  const rimMaterial = new MeshStandardMaterial({
    color: '#40454b',
    roughness: 0.38,
    metalness: 0.82,
  });

  const leftDrop = createBarSide(-1, carbonMaterial, tapeMaterial, rubberMaterial, alloyMaterial, cableMaterial);
  const rightDrop = createBarSide(1, carbonMaterial, tapeMaterial, rubberMaterial, alloyMaterial, cableMaterial);
  const crossbar = new Mesh(new CylinderGeometry(0.05, 0.05, 0.5, 18), carbonMaterial);
  const stem = new Mesh(new CylinderGeometry(0.07, 0.07, 0.58, 16), alloyMaterial);
  const faceplate = new Mesh(new BoxGeometry(0.24, 0.16, 0.1), alloyMaterial);
  const spacerStack = new Mesh(new CylinderGeometry(0.045, 0.045, 0.08, 14), alloyMaterial);
  const topCap = new Mesh(new CylinderGeometry(0.034, 0.034, 0.016, 14), alloyMaterial);
  const computerMount = new Mesh(new BoxGeometry(0.18, 0.02, 0.09), alloyMaterial);
  const computer = new Mesh(new BoxGeometry(0.14, 0.05, 0.1), rubberMaterial);
  const headTube = new Mesh(new CylinderGeometry(0.095, 0.105, 0.42, 18), carbonMaterial);
  const forkCrown = new Mesh(new BoxGeometry(0.2, 0.08, 0.16), carbonMaterial);
  const leftFork = new Mesh(new CylinderGeometry(0.026, 0.037, 1.08, 12), carbonMaterial);
  const rightFork = new Mesh(new CylinderGeometry(0.026, 0.037, 1.08, 12), carbonMaterial);
  const wheel = new Mesh(new TorusGeometry(0.68, 0.05, 12, 44), tireMaterial);
  const rim = new Mesh(new TorusGeometry(0.61, 0.014, 10, 44), rimMaterial);
  const hub = new Mesh(new CylinderGeometry(0.03, 0.03, 0.18, 12), alloyMaterial);

  crossbar.rotation.z = Math.PI * 0.5;
  crossbar.position.set(0, 0.14, -0.55);

  stem.position.set(0, -0.12, -0.26);
  stem.rotation.x = Math.PI * 0.4;

  faceplate.position.set(0, 0.08, -0.52);
  spacerStack.position.set(0, -0.28, -0.18);
  spacerStack.rotation.x = Math.PI * 0.4;

  topCap.position.set(0, -0.05, -0.43);
  topCap.rotation.x = Math.PI * 0.4;

  computerMount.position.set(0, 0.16, -0.62);
  computer.position.set(0, 0.2, -0.7);

  headTube.position.set(0, -0.5, -0.98);
  headTube.rotation.x = Math.PI * 0.22;

  forkCrown.position.set(0, -0.74, -1.16);
  leftFork.position.set(-0.18, -1.2, -1.7);
  rightFork.position.set(0.18, -1.2, -1.7);
  leftFork.rotation.x = Math.PI * 0.16;
  rightFork.rotation.x = Math.PI * 0.16;

  wheel.position.set(0, -1.52, -2.25);
  wheel.rotation.y = Math.PI * 0.5;
  rim.position.copy(wheel.position);
  rim.rotation.copy(wheel.rotation);

  hub.position.set(0, -1.52, -2.25);
  hub.rotation.z = Math.PI * 0.5;

  steerPivot.position.copy(steerPivotOffset);

  for (const part of [
    leftDrop,
    rightDrop,
    crossbar,
    stem,
    faceplate,
    spacerStack,
    topCap,
    computerMount,
    computer,
    headTube,
    forkCrown,
    leftFork,
    rightFork,
    wheel,
    rim,
    hub,
  ]) {
    part.position.sub(steerPivotOffset);
    steerPivot.add(part);
  }

  group.add(headTube, steerPivot);

  return {
    group,
    restPosition: group.position.clone(),
    referencePoint: crossbar,
    steerPivot,
  };
}

export function fitHandlebarRig(rig: HandlebarRig, eyeHeight: number) {
  const bounds = new Box3();
  const referencePosition = new Vector3();
  const targetBottomY = -eyeHeight + 0.02;
  const targetReferenceY = -0.38;
  const targetReferenceZ = -1.08;

  rig.group.updateMatrixWorld(true);
  bounds.setFromObject(rig.group);
  rig.referencePoint.getWorldPosition(referencePosition);

  const currentVerticalSpan = referencePosition.y - bounds.min.y;
  const targetVerticalSpan = targetReferenceY - targetBottomY;

  if (currentVerticalSpan > 0.001) {
    const scale = targetVerticalSpan / currentVerticalSpan;
    rig.group.scale.setScalar(scale);
    rig.group.updateMatrixWorld(true);
    bounds.setFromObject(rig.group);
    rig.referencePoint.getWorldPosition(referencePosition);
  }

  rig.group.position.y += targetBottomY - bounds.min.y;
  rig.group.position.z += targetReferenceZ - referencePosition.z;
  rig.restPosition.copy(rig.group.position);
}

function createBarSide(
  direction: number,
  barMaterial: MeshStandardMaterial,
  tapeMaterial: MeshStandardMaterial,
  rubberMaterial: MeshStandardMaterial,
  alloyMaterial: MeshStandardMaterial,
  cableMaterial: MeshStandardMaterial,
) {
  const path = new CatmullRomCurve3([
    new Vector3(direction * 0.08, 0.14, -0.54),
    new Vector3(direction * 0.42, 0.15, -0.6),
    new Vector3(direction * 0.67, 0.1, -0.73),
    new Vector3(direction * 0.82, -0.03, -0.94),
  ]);
  const cablePath = new CatmullRomCurve3([
    new Vector3(direction * 0.69, 0.02, -0.83),
    new Vector3(direction * 0.54, -0.18, -0.84),
    new Vector3(direction * 0.24, -0.54, -0.84),
    new Vector3(direction * 0.1, -0.86, -1.06),
  ]);
  const group = new Group();
  const bar = new Mesh(new TubeGeometry(path, 28, 0.044, 12, false), barMaterial);
  const grip = new Mesh(new CylinderGeometry(0.048, 0.048, 0.26, 12), tapeMaterial);
  const hood = new Mesh(new BoxGeometry(0.12, 0.22, 0.18), rubberMaterial);
  const hoodNose = new Mesh(new CylinderGeometry(0.045, 0.055, 0.16, 10), rubberMaterial);
  const lever = new Mesh(new CylinderGeometry(0.012, 0.016, 0.28, 8), alloyMaterial);
  const cable = new Mesh(new TubeGeometry(cablePath, 18, 0.008, 6, false), cableMaterial);

  grip.rotation.x = Math.PI * 0.55;
  grip.position.set(direction * 0.82, -0.04, -0.98);

  hood.position.set(direction * 0.66, 0.13, -0.77);
  hood.rotation.set(-0.28, 0, direction * -0.08);

  hoodNose.position.set(direction * 0.69, 0.01, -0.83);
  hoodNose.rotation.set(0.94, 0, direction * 0.15);

  lever.position.set(direction * 0.72, -0.03, -0.92);
  lever.rotation.set(0.55, 0, direction * 0.05);

  group.add(bar, grip, hood, hoodNose, lever, cable);
  return group;
}
