import * as THREE from "three";

const Y_AXIS = new THREE.Vector3(0, 1, 0);

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function createWeaponEffects(scene, camera) {
  const active = [];
  const origin = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const velocityDir = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();

  let selectedWeapon = "rifle";
  let knifeSlash = 0;
  const KNIFE_SLASH_TIME = 0.18;

  const knifeRig = new THREE.Group();
  knifeRig.position.set(0.44, -0.48, -0.83);
  knifeRig.rotation.set(-0.35, -0.14, 0.18);
  knifeRig.visible = false;
  camera.add(knifeRig);

  const knifeHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.22, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x5e4228, roughness: 0.85 })
  );
  knifeHandle.position.set(0, -0.08, 0);
  knifeRig.add(knifeHandle);

  const knifeBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.34, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xd7ddde, roughness: 0.2, metalness: 0.9 })
  );
  knifeBlade.position.set(0, 0.16, 0);
  knifeRig.add(knifeBlade);

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.03, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x30241a, roughness: 0.75 })
  );
  guard.position.set(0, 0.03, 0);
  knifeRig.add(guard);

  function getMuzzleBasis() {
    camera.getWorldPosition(origin);
    camera.getWorldQuaternion(worldQuat);
    camera.getWorldDirection(forward).normalize();
    right.set(1, 0, 0).applyQuaternion(worldQuat).normalize();
    up.set(0, 1, 0).applyQuaternion(worldQuat).normalize();
    origin
      .addScaledVector(forward, 0.82)
      .addScaledVector(right, 0.26)
      .addScaledVector(up, -0.14);
  }

  function setOpacity(object, value) {
    if (!object.material) {
      return;
    }
    if (Array.isArray(object.material)) {
      object.material.forEach((mat) => {
        mat.opacity = value;
      });
      return;
    }
    object.material.opacity = value;
  }

  function addEffect({ object, velocity, life, gravity = 0, fade = true, alignVelocity = false }) {
    object.position.copy(origin);
    scene.add(object);
    active.push({
      object,
      velocity,
      life,
      maxLife: life,
      gravity,
      fade,
      alignVelocity,
    });
  }

  function spawnRifleEffect() {
    getMuzzleBasis();
    const tracer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffe8a5,
        emissive: 0xffa73b,
        emissiveIntensity: 1.3,
        transparent: true,
        opacity: 0.95,
      })
    );
    addEffect({
      object: tracer,
      velocity: forward.clone().multiplyScalar(130),
      life: 0.3,
      alignVelocity: true,
    });

    for (let i = 0; i < 9; i += 1) {
      velocityDir
        .copy(forward)
        .addScaledVector(right, randomRange(-0.55, 0.55))
        .addScaledVector(up, randomRange(-0.45, 0.45))
        .normalize();
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 7, 7),
        new THREE.MeshStandardMaterial({
          color: 0xffd76d,
          emissive: 0xff9c2e,
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.95,
        })
      );
      addEffect({
        object: spark,
        velocity: velocityDir.clone().multiplyScalar(randomRange(12, 32)),
        life: randomRange(0.08, 0.18),
        gravity: 22,
      });
    }
  }

  function spawnBowArrow() {
    getMuzzleBasis();
    const arrow = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.84, 8),
      new THREE.MeshStandardMaterial({ color: 0x9a6f3f, roughness: 0.75 })
    );
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xc8cbcf, metalness: 0.65, roughness: 0.35 })
    );
    tip.position.y = 0.48;
    arrow.add(shaft);
    arrow.add(tip);
    origin.addScaledVector(right, -0.03).addScaledVector(up, -0.03);
    addEffect({
      object: arrow,
      velocity: forward.clone().multiplyScalar(62).addScaledVector(up, 1.2),
      life: 1.4,
      gravity: 8.5,
      fade: false,
      alignVelocity: true,
    });
  }

  function triggerKnifeSlash() {
    knifeSlash = KNIFE_SLASH_TIME;
  }

  function spawnSquirtSpray() {
    getMuzzleBasis();
    for (let i = 0; i < 12; i += 1) {
      velocityDir
        .copy(forward)
        .addScaledVector(right, randomRange(-0.19, 0.19))
        .addScaledVector(up, randomRange(-0.08, 0.15))
        .normalize();
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(randomRange(0.012, 0.03), 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0x67bcff,
          emissive: 0x1f84d8,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8,
        })
      );
      addEffect({
        object: drop,
        velocity: velocityDir.clone().multiplyScalar(randomRange(14, 24)),
        life: randomRange(0.25, 0.45),
        gravity: 20,
      });
    }
  }

  function fire(weaponName) {
    if (weaponName === "rifle") {
      spawnRifleEffect();
      return;
    }
    if (weaponName === "bow") {
      spawnBowArrow();
      return;
    }
    if (weaponName === "knife") {
      triggerKnifeSlash();
      return;
    }
    spawnSquirtSpray();
  }

  function setWeapon(weaponName) {
    selectedWeapon = weaponName;
    knifeRig.visible = selectedWeapon === "knife";
  }

  function update(delta, elapsed) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const fx = active[i];
      fx.life -= delta;
      if (fx.life <= 0) {
        scene.remove(fx.object);
        active.splice(i, 1);
        continue;
      }
      fx.object.position.addScaledVector(fx.velocity, delta);
      if (fx.gravity > 0) {
        fx.velocity.y -= fx.gravity * delta;
      }
      if (fx.alignVelocity && fx.velocity.lengthSq() > 0.0001) {
        velocityDir.copy(fx.velocity).normalize();
        fx.object.quaternion.setFromUnitVectors(Y_AXIS, velocityDir);
      }
      if (fx.fade) {
        setOpacity(fx.object, Math.max(0, fx.life / fx.maxLife));
      }
    }

    if (selectedWeapon !== "knife") {
      return;
    }

    const idleBob = Math.sin(elapsed * 7.4) * 0.015;
    knifeRig.position.set(0.44, -0.48 + idleBob, -0.83);
    if (knifeSlash > 0) {
      knifeSlash = Math.max(0, knifeSlash - delta);
      const t = 1 - knifeSlash / KNIFE_SLASH_TIME;
      knifeRig.rotation.set(
        -0.75 + t * 0.95,
        -0.56 + t * 1.05,
        0.16 + Math.sin(t * Math.PI) * 0.28
      );
      return;
    }
    knifeRig.rotation.set(-0.35, -0.14, 0.18 + Math.sin(elapsed * 5.6) * 0.02);
  }

  return { fire, setWeapon, update };
}
