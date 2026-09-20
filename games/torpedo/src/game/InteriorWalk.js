const ROOMS = [
  { title: 'Control Room', meter: 'Helm Station', view: 'front', kind: 'steering', action: 'steer', actionLabel: 'Hold Course' },
  { title: 'Sonar Room', meter: 'Hydrophones', view: 'port', kind: 'sonar', action: 'sonar', actionLabel: 'Ping Sonar' },
  { title: 'Crew Quarters', meter: 'Bunks Secure', view: 'starboard', kind: 'bunks', action: 'rest', actionLabel: 'Rest' },
  { title: 'Galley', meter: 'Mess Deck', view: 'port', kind: 'galley', action: 'eat', actionLabel: 'Eat Meal' },
  { title: 'Engine Room', meter: 'Motor Room', view: 'front', kind: 'engine', action: 'repair', actionLabel: 'Repair' }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
    this.dragState = {
      active: false,
      moved: false,
      startX: 0,
      startScrollLeft: 0
    };
    this.suppressRoomTap = false;
    this.actionButton.addEventListener('click', () => this.performAction());
    this.planButton.addEventListener('click', () => this.showPlan());
    this.cutaway.addEventListener('pointerdown', (event) => this.startMapDrag(event));
    this.cutaway.addEventListener('pointermove', (event) => this.dragMap(event));
    this.cutaway.addEventListener('pointerup', () => this.endMapDrag());
    this.cutaway.addEventListener('pointercancel', () => this.endMapDrag());
    this.cutaway.addEventListener('lostpointercapture', () => this.endMapDrag());
    for (const roomEl of this.rooms) {
      roomEl.addEventListener('click', () => this.enterRoom(Number(roomEl.dataset.room)));
    }
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
      this.back();
      return;
    }

    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.moveRoom(-1);
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.moveRoom(1);
    }

    if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') {
      this.confirm();
    }
  }

  handleRoomKey(event) {
    if (event.code === 'KeyV' || event.code === 'Escape' || event.code === 'Backspace') {
      this.back();
      return;
    }

    if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') {
      this.confirm();
    }
  }

  moveRoom(step) {
    const nextIndex = clamp(this.roomIndex + step, 0, ROOMS.length - 1);
    if (nextIndex === this.roomIndex) return;
    this.roomIndex = nextIndex;
    if (this.mode === 'room') {
      this.status.textContent = 'Ready';
    }
    this.update();
  }

  enterRoom(index) {
    if (this.mode !== 'plan') return;
    if (this.suppressRoomTap) {
      this.suppressRoomTap = false;
      return;
    }

    this.roomIndex = clamp(index, 0, ROOMS.length - 1);
    this.showRoom();
  }

  confirm() {
    if (this.mode === 'plan') {
      this.showRoom();
      return;
    }
    this.performAction();
  }

  back() {
    if (this.mode === 'room') {
      this.showPlan();
      return;
    }
    this.callbacks.onExit?.(ROOMS[this.roomIndex].view);
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

  startMapDrag(event) {
    if (this.mode !== 'plan') return;
    this.dragState.active = true;
    this.dragState.moved = false;
    this.dragState.startX = event.clientX;
    this.dragState.startScrollLeft = this.cutaway.scrollLeft;
    this.cutaway.setPointerCapture?.(event.pointerId);
  }

  dragMap(event) {
    if (!this.dragState.active) return;

    const deltaX = event.clientX - this.dragState.startX;
    if (Math.abs(deltaX) > 6) {
      this.dragState.moved = true;
      event.preventDefault();
    }
    this.cutaway.scrollLeft = this.dragState.startScrollLeft - deltaX;
  }

  endMapDrag() {
    if (!this.dragState.active) return;

    if (this.dragState.moved) {
      this.suppressRoomTap = true;
      setTimeout(() => {
        this.suppressRoomTap = false;
      }, 0);
    }

    this.dragState.active = false;
    this.dragState.moved = false;
  }

  scrollActiveRoomIntoView() {
    if (this.mode !== 'plan') return;
    const activeRoom = this.rooms[this.roomIndex];
    requestAnimationFrame(() => {
      activeRoom.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
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
    this.scrollActiveRoomIntoView();
  }
}
