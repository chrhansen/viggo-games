import * as THREE from 'three';

export class CombatEffects {
  constructor(world) {
    this.world = world;
    this.bubbles = [];
    this.bursts = [];
    this.bubbleGeometry = new THREE.SphereGeometry(1, 7, 7);
    this.burstGeometry = new THREE.SphereGeometry(1, 18, 12);
    this.trailMaterial = new THREE.MeshBasicMaterial({ color: '#d5fbff', transparent: true, opacity: 0.58 });
  }

  leaveTrail(torpedo) {
    if (Math.random() > 0.45) return;
    const bubble = new THREE.Mesh(this.bubbleGeometry, this.trailMaterial);
    bubble.scale.setScalar(0.04 + Math.random() * 0.07);
    bubble.position.copy(torpedo.mesh.position).addScaledVector(torpedo.velocity.clone().normalize(), -0.9);
    bubble.userData.life = 0.75;
    this.bubbles.push(bubble);
    this.world.add(bubble);
  }

  createBurst(position, color) {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 });
    const mesh = new THREE.Mesh(this.burstGeometry, material);
    mesh.position.copy(position);
    this.world.add(mesh);
    this.bursts.push({ mesh, age: 0 });
  }

  update(delta) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      bubble.userData.life -= delta;
      bubble.position.y += delta * 1.4;
      bubble.scale.multiplyScalar(1 + delta * 1.6);
      if (bubble.userData.life <= 0) {
        this.world.remove(bubble);
        this.bubbles.splice(i, 1);
      }
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const burst = this.bursts[i];
      burst.age += delta / 0.36;
      burst.mesh.scale.setScalar(1 + burst.age * 4.6);
      burst.mesh.material.opacity = Math.max(0, 0.72 - burst.age);
      if (burst.age >= 0.72) {
        this.world.remove(burst.mesh);
        burst.mesh.material.dispose();
        this.bursts.splice(i, 1);
      }
    }
  }

  clear() {
    for (const bubble of this.bubbles) this.world.remove(bubble);
    for (const { mesh } of this.bursts) { this.world.remove(mesh); mesh.material.dispose(); }
    this.bubbles.length = this.bursts.length = 0;
  }

  dispose() {
    this.clear();
    this.bubbleGeometry.dispose();
    this.burstGeometry.dispose();
    this.trailMaterial.dispose();
  }
}
