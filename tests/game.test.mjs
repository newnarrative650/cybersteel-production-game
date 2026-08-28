import test from 'node:test';
import assert from 'node:assert/strict';
import { tubes, technologyText } from '../app/production.ts';
import { evaluateOrder, gameReducer, initialGame, moveCard, sameOperations, shuffleSteps, swapCards, validInventory } from '../app/game.ts';

function seeded(seed) { let value = seed; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); }

const approvedSources = {
  nuclear: ['Вводная по пункту 1', '1.3', '1.6', '1.7', '3', '5', '6', '11', '13', '17', '19'],
  general: ['Вводная по пункту 1', '1.1', '1.2', '1.3', '2', '3', '5', '6', '7', '8', '12'],
  aviation: ['Вводная по пункту 1', '1.3', '1.4', '3', '11', '12', '14', '16', '24', '25', '28'],
};

for (const tube of tubes) {
  test(`${tube.id}: approved route, 11 unique card instances, consistent duplicate hints`, () => {
    assert.equal(tube.steps.length, 11);
    assert.equal(new Set(tube.steps.map(x => x.id)).size, 11);
    assert.deepEqual(tube.steps.map(x => x.sourceStep), approvedSources[tube.id]);
    const titles = new Map();
    for (const card of tube.steps) {
      if (titles.has(card.operation)) assert.equal(titles.get(card.operation), card.title);
      titles.set(card.operation, card.title);
      assert.equal(technologyText(card.title), `Текст здесь рассказывает про технологию «${card.title}» и зачем она нужна.`);
    }
  });

  test(`${tube.id}: 500 shuffles preserve every card and only fix the first`, () => {
    const original = JSON.stringify(tube.steps);
    const positions = new Map(tube.steps.slice(1).map(step => [step.id, new Set()]));
    for (let seed = 1; seed <= 500; seed++) {
      const cards = shuffleSteps(tube.steps, seeded(seed));
      assert.equal(cards[0], tube.steps[0]);
      assert.ok(validInventory(cards, tube.steps));
      assert.equal(evaluateOrder(cards, tube.steps).complete, false);
      cards.slice(1).forEach((step, i) => positions.get(step.id).add(i + 1));
    }
    for (const indices of positions.values()) assert.ok(indices.size > 1);
    assert.equal(JSON.stringify(tube.steps), original);
    assert.equal(evaluateOrder(shuffleSteps(tube.steps, () => .9999999), tube.steps).complete, false);
  });

  test(`${tube.id}: equal cards are interchangeable but missing or forged cards fail`, () => {
    let equalCards = [...tube.steps];
    for (const operation of new Set(tube.steps.map(x => x.operation))) {
      const copies = tube.steps.filter(x => x.operation === operation);
      if (copies.length > 1) equalCards = swapCards(equalCards, copies[0].id, copies.at(-1).id);
    }
    assert.deepEqual(evaluateOrder(equalCards, tube.steps), { positions: Array(11).fill(true), correct: 10, complete: true });
    assert.equal(evaluateOrder(equalCards.slice(1), tube.steps).complete, false);
    const missing = [...tube.steps]; missing[2] = missing[1];
    assert.equal(evaluateOrder(missing, tube.steps).complete, false);
    const forged = [...tube.steps]; forged[1] = { ...forged[1], operation: 'unknown' };
    assert.equal(evaluateOrder(forged, tube.steps).complete, false);
  });

  test(`${tube.id}: moving and swapping cannot displace the first card`, () => {
    const cards = shuffleSteps(tube.steps, seeded(100));
    assert.equal(moveCard(cards, 'blank', 4), cards);
    assert.equal(moveCard(cards, cards[3].id, 0), cards);
    assert.equal(moveCard(cards, cards[3].id, 99), cards);
    assert.equal(moveCard(cards, 'not-found', 2), cards);
    assert.equal(swapCards(cards, 'blank', cards[2].id), cards);
    const last = cards.at(-1);
    const moved = moveCard(cards, last.id, 1);
    assert.equal(moved[1], last);
    assert.ok(validInventory(moved, tube.steps));
    assert.equal(moveCard(moved, last.id, 10)[10], last);
  });

  test(`${tube.id}: complete round, retry, replay, and route selection`, () => {
    let state = gameReducer(initialGame, { type: 'start', tube, order: shuffleSteps(tube.steps, seeded(44)) });
    assert.equal(state.tube, tube);
    state = gameReducer(state, { type: 'check' });
    assert.equal(state.attempts, 1);
    assert.equal(state.evaluation.complete, false);
    assert.equal(gameReducer(state, { type: 'check' }), state);
    const pick = state.cards[2].id;
    state = gameReducer(state, { type: 'choose', id: pick });
    assert.equal(state.selectedId, pick);
    state = gameReducer(state, { type: 'choose', id: state.cards[3].id });
    assert.equal(state.selectedId, null);
    assert.equal(state.evaluation, null);
    assert.equal(state.moves, 1);
    for (let i = 1; i < tube.steps.length; i++) state = gameReducer(state, { type: 'move', id: tube.steps[i].id, to: i });
    assert.ok(sameOperations(state.cards, tube.steps));
    state = gameReducer(state, { type: 'check' });
    assert.equal(state.evaluation.complete, true);
    assert.equal(state.attempts, 2);
    assert.equal(gameReducer(state, { type: 'move', id: state.cards[2].id, to: 5 }), state);
    state = gameReducer(state, { type: 'restart', order: shuffleSteps(tube.steps, seeded(77)) });
    assert.equal(state.attempts, 0);
    assert.equal(state.moves, 0);
    assert.equal(state.evaluation, null);
    assert.equal(state.selectedId, null);
    assert.equal(state.cards[0].id, 'blank');
    assert.equal(gameReducer(state, { type: 'leave' }), initialGame);
  });
}

test('choosing the same card cancels selection; an invalid restart is ignored', () => {
  const tube = tubes[0];
  let state = gameReducer(initialGame, { type: 'start', tube, order: shuffleSteps(tube.steps, seeded(8)) });
  const id = state.cards[3].id;
  state = gameReducer(state, { type: 'choose', id });
  state = gameReducer(state, { type: 'choose', id });
  assert.equal(state.selectedId, null);
  assert.equal(state.moves, 0);
  assert.equal(gameReducer(state, { type: 'restart', order: [] }), state);
  assert.equal(gameReducer(initialGame, { type: 'start', tube, order: [] }), initialGame);
});
