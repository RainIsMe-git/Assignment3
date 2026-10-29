import test from 'node:test';
import assert from 'node:assert/strict';
import { SpellGame, GestureFilter } from '../dist/core.mjs';

function charge(game) { for (let i = 0; i < 15; i++) game.tick(0.08, 'open'); }
test('one open-to-fist transition fires once; holding a fist never repeats', () => {
  const game = new SpellGame();
  charge(game);
  assert.equal(game.tick(0.02, 'fist').type, 'cast');
  for (let i = 0; i < 100; i++) assert.equal(game.tick(0.02, 'fist'), null);
  assert.equal(game.shots, 1);
});
test('an interrupted charge cannot fire when tracking returns as a fist', () => {
  const game = new SpellGame();
  charge(game);
  game.tick(0.02, 'none');
  assert.equal(game.tick(0.02, 'fist'), null);
  assert.equal(game.shots, 0);
});
test('pause freezes clock, clears charge, and requires a new open hand', () => {
  const game = new SpellGame();
  game.reset('challenge'); charge(game);
  game.pause('lost-hand');
  const remaining = game.remaining;
  for (let i = 0; i < 20; i++) game.tick(0.1, 'open');
  assert.equal(game.remaining, remaining);
  game.resume();
  assert.equal(game.tick(0.01, 'fist'), null);
  assert.equal(game.charge, 0);
});
test('brief accidental open hand cannot cast', () => {
  const game = new SpellGame();
  game.tick(0.1, 'open');
  assert.equal(game.tick(0.01, 'fist').type, 'weak');
  assert.equal(game.shots, 0);
});
test('challenge finishes and rejects late hit events', () => {
  const game = new SpellGame(); game.reset('challenge');
  game.remaining = 0.02;
  assert.equal(game.tick(0.03, 'none').type, 'finish');
  assert.equal(game.hit(1), 0);
  assert.equal(game.score, 0);
});
test('gesture debounce rejects isolated false detections and low confidence', () => {
  const filter = new GestureFilter();
  assert.equal(filter.sample('open', 0.9, 0), 'none');
  assert.equal(filter.sample('open', 0.9, 150), 'open');
  assert.equal(filter.sample('fist', 0.9, 160), 'open');
  assert.equal(filter.sample('open', 0.9, 200), 'open');
  filter.sample('fist', 0.2, 210);
  assert.equal(filter.sample('fist', 0.2, 460), 'none');
});
