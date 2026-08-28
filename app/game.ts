import type { Step, Tube } from "./production.ts";

export type Evaluation = { positions: boolean[]; correct: number; complete: boolean };

export function sameOperations(a: readonly Step[], b: readonly Step[]): boolean {
  return a.length === b.length && a.every((step, index) => step.operation === b[index].operation);
}

export function validInventory(cards: readonly Step[], expected: readonly Step[]): boolean {
  const byId = new Map(expected.map(step => [step.id, step.operation]));
  return cards.length === expected.length && new Set(cards.map(step => step.id)).size === expected.length
    && cards.every(step => byId.get(step.id) === step.operation)
    && cards[0]?.id === expected[0]?.id;
}

export function evaluateOrder(cards: readonly Step[], expected: readonly Step[]): Evaluation {
  const valid = validInventory(cards, expected);
  const positions = expected.map((step, index) => valid && cards[index]?.operation === step.operation);
  return { positions, correct: positions.slice(1).filter(Boolean).length, complete: valid && positions.every(Boolean) };
}

export function shuffleSteps(expected: readonly Step[], random: () => number = Math.random): Step[] {
  if (expected.length < 3) return [...expected];
  const tail = expected.slice(1);
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
    [tail[i], tail[j]] = [tail[j], tail[i]];
  }
  let result = [expected[0], ...tail];
  // A fresh round must not already be solved, even when equal cards change IDs.
  if (sameOperations(result, expected)) {
    const different = tail.findIndex(step => step.operation !== tail[0].operation);
    if (different > 0) [tail[0], tail[different]] = [tail[different], tail[0]];
    result = [expected[0], ...tail];
  }
  return result;
}

export function moveCard(cards: readonly Step[], id: string, to: number): Step[] {
  const from = cards.findIndex(step => step.id === id);
  if (from <= 0 || !Number.isInteger(to) || to <= 0 || to >= cards.length || from === to) return cards as Step[];
  const next = [...cards];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function swapCards(cards: readonly Step[], first: string, second: string): Step[] {
  const a = cards.findIndex(step => step.id === first);
  const b = cards.findIndex(step => step.id === second);
  if (a <= 0 || b <= 0 || a === b) return cards as Step[];
  const next = [...cards];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export type GameState = {
  tube: Tube | null;
  cards: Step[];
  selectedId: string | null;
  evaluation: Evaluation | null;
  attempts: number;
  moves: number;
};
export const initialGame: GameState = { tube: null, cards: [], selectedId: null, evaluation: null, attempts: 0, moves: 0 };
export type GameAction =
  | { type: "start"; tube: Tube; order: Step[] }
  | { type: "restart"; order: Step[] }
  | { type: "choose"; id: string }
  | { type: "move"; id: string; to: number }
  | { type: "check" }
  | { type: "cancel-selection" }
  | { type: "leave" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === "leave") return initialGame;
  if (action.type === "start") {
    if (!validInventory(action.order, action.tube.steps)) return state;
    return { ...initialGame, tube: action.tube, cards: [...action.order] };
  }
  if (!state.tube) return state;
  if (action.type === "restart") {
    if (!validInventory(action.order, state.tube.steps)) return state;
    return { ...initialGame, tube: state.tube, cards: [...action.order] };
  }
  if (action.type === "cancel-selection") return { ...state, selectedId: null };
  if (state.evaluation?.complete) return state;
  if (action.type === "check") {
    if (state.evaluation) return state;
    return { ...state, selectedId: null, evaluation: evaluateOrder(state.cards, state.tube.steps), attempts: state.attempts + 1 };
  }
  if (action.type === "choose") {
    if (state.cards.findIndex(step => step.id === action.id) <= 0) return state;
    if (!state.selectedId) return { ...state, selectedId: action.id };
    if (state.selectedId === action.id) return { ...state, selectedId: null };
    const cards = swapCards(state.cards, state.selectedId, action.id);
    return { ...state, cards, selectedId: null, evaluation: null, moves: state.moves + 1 };
  }
  if (action.type === "move") {
    const cards = moveCard(state.cards, action.id, action.to);
    if (cards === state.cards) return state;
    return { ...state, cards, selectedId: null, evaluation: null, moves: state.moves + 1 };
  }
  return state;
}
