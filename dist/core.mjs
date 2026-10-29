// Pure interaction rules. Rendering and the camera do not own game state.
export const DURATION = 60;
export const MIN_CHARGE = 0.32;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export class GestureFilter {
  constructor() { this.reset(); }
  reset() { this.candidate = 'none'; this.since = 0; this.stable = 'none'; }
  sample(name, confidence, time) {
    const next = confidence >= 0.65 && ['open', 'fist'].includes(name) ? name : 'none';
    if (next !== this.candidate) { this.candidate = next; this.since = time; }
    if (time - this.since >= (next === 'none' ? 240 : 130)) this.stable = next;
    return this.stable;
  }
}

export class SpellGame {
  constructor() { this.reset('practice'); }
  reset(mode = 'practice') {
    this.mode = mode;
    this.remaining = DURATION;
    this.score = 0;
    this.hits = 0;
    this.shots = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.practiceComplete = false;
    this.finished = false;
    this.pauseReason = '';
    this.cancelCharge();
    this.cooldown = 0;
  }
  cancelCharge() { this.charge = 0; this.gesture = 'none'; this.armed = false; }
  pause(reason) { this.pauseReason = reason; this.cancelCharge(); }
  resume() { this.pauseReason = ''; this.cancelCharge(); }
  tick(dt, gesture) {
    if (this.finished || this.pauseReason) return null;
    dt = clamp(dt, 0, 0.1);
    if (this.mode === 'challenge') {
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining <= 0) { this.finished = true; this.cancelCharge(); return { type: 'finish' }; }
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    let event = null;
    if (gesture === 'open' && this.cooldown === 0) {
      this.charge = clamp(this.charge + dt / 1.1);
      this.armed = this.charge >= MIN_CHARGE;
    } else if (gesture === 'fist' && this.gesture === 'open') {
      if (this.armed && this.cooldown === 0) {
        this.shots++;
        event = { type: 'cast', power: this.charge };
        this.cooldown = 0.38;
      } else event = { type: 'weak' };
      this.charge = 0;
      this.armed = false;
    } else if (gesture === 'none') {
      this.charge = 0;
      this.armed = false;
    }
    this.gesture = gesture;
    return event;
  }
  hit(power) {
    if (this.finished || this.pauseReason) return 0;
    this.hits++;
    this.combo++;
    this.bestCombo = Math.max(this.combo, this.bestCombo);
    const points = Math.round(50 + 50 * power) + Math.min(this.combo - 1, 5) * 10;
    this.score += points;
    if (this.mode === 'practice') this.practiceComplete = true;
    return points;
  }
  miss() { this.combo = 0; }
}
