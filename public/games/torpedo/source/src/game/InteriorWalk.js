const ROOMS = [
  { title: 'Steering Room', meter: 'Front Window', view: 'front', kind: 'steering', action: 'steer', actionLabel: 'Steer' },
  { title: 'Sonar Room', meter: 'Port Windows', view: 'port', kind: 'sonar', action: 'sonar', actionLabel: 'Ping' },
  { title: 'Bunk Room', meter: 'Starboard Windows', view: 'starboard', kind: 'bunks', action: 'rest', actionLabel: 'Nap' },
  { title: 'Galley', meter: 'Side Windows', view: 'port', kind: 'galley', action: 'eat', actionLabel: 'Eat' },
  { title: 'Engine Room', meter: 'Engine Warm', view: 'front', kind: 'engine', action: 'repair', actionLabel: 'Repair' }
];

export class InteriorWalk {
  constructor(root, hud, callbacks = {}) {
    this.root = root;
    this.hud = hud;
    this.callbacks = callbacks;
    this.roomIndex = 0;
    this.mode = 'plan';
    this.kid = root.querySelector('#crew-kid');
    this.rooms = [...root.querySelectorAll('.room')];
    this.cutaway = root.querySelector('.submarine-cutaway');
    this.scene = root.querySelector('#room-scene');
    this.actionButton = root.querySelector('#room-action');
    this.planButton = root.querySelector('#room-plan');
    this.status = root.querySelector('#room-status');
    this.actionButton.addEventListener('click', () => this.performAction());
    this.planButton.addEventListener('click', () => this.showPlan());
    this.update();
  }

  focus() {
    this.showPlan();
    this.update();
  }

  handleKeyDown(event) {
    if (this.mode === 'room') {
      this.handleRoomKey(event);
      return;
    }

    if (event.code === 'KeyV' || event.code === 'Escape') {
      this.callbacks.onExit?.(ROOMS[this.roomIndex].view);
      return;
    }

    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.roomIndex = Math.max(0, this.roomIndex - 1);
      this.update();
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.roomIndex = Math.min(ROOMS.length - 1, this.roomIndex + 1);
      this.update();
    }

    if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') {
      this.showRoom();
    }
  }

  handleRoomKey(event) {
    if (event.code === 'KeyV' || event.code === 'Escape' || event.code === 'Backspace') {
      this.showPlan();
      return;
    }

    if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') {
      this.performAction();
    }
  }

  showPlan() {
    this.mode = 'plan';
    this.cutaway.classList.remove('hidden');
    this.scene.classList.add('hidden');
    this.update();
  }

  showRoom() {
    this.mode = 'room';
    this.cutaway.classList.add('hidden');
    this.scene.classList.remove('hidden');
    this.status.textContent = 'Ready';
    this.update();
  }

  performAction() {
    const room = ROOMS[this.roomIndex];
    const result = this.callbacks.onAction?.(room.action) || 'Ready';
    this.status.textContent = result;
    this.scene.classList.remove('acted');
    void this.scene.offsetWidth;
    this.scene.classList.add('acted');
    this.update();
  }

  update() {
    const room = ROOMS[this.roomIndex];
    this.hud.title.textContent = room.title;
    this.hud.meter.textContent = this.mode === 'plan' ? 'Paused' : room.meter;
    this.root.style.setProperty('--crew-room', this.roomIndex);
    this.scene.dataset.roomKind = room.kind;
    this.actionButton.textContent = room.actionLabel;

    for (const roomEl of this.rooms) {
      roomEl.classList.toggle('active', Number(roomEl.dataset.room) === this.roomIndex);
    }
  }
}
