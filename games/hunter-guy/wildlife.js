import { buildFox, buildDeer, buildBear, animateAnimal } from "./animal-models.js";

export function createWildlifeView(scene, animals) {
  const hitMeshes = [];
  const builders = { fox: buildFox, deer: buildDeer, bear: buildBear };
  const views = animals.map((animal, animalIndex) => {
    const { group, hitMeshes: meshes } = builders[animal.type]();
    scene.add(group);
    for (const mesh of meshes) {
      mesh.userData.animalIndex = animalIndex;
      hitMeshes.push(mesh);
    }
    return { group, gaitTime: 0 };
  });
  function update(delta) {
    animals.forEach((animal, index) => {
      const view = views[index];
      view.group.position.copy(animal.group.position);
      view.group.rotation.y = animal.group.rotation.y;
      view.group.visible = animal.alive;
      if (animal.alive) {
        Object.assign(view, { moving: animal.moving, speed: animal.speed, scaredFor: animal.scaredFor });
        animateAnimal(view, delta);
      }
    });
  }
  update(0);
  return { hitMeshes, update };
}
