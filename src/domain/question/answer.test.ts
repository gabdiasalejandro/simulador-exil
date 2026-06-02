import { describe, it, expect } from 'vitest';
import { isAnswered } from './answer';
import type { Answer } from './answer';

describe('answer — isAnswered', () => {
  it('isAnswered(null) devuelve false', () => {
    expect(isAnswered(null)).toBe(false);
  });

  it('isAnswered con ChoiceAnswer devuelve true', () => {
    const a: Answer = { kind: 'choice', index: 0 };
    expect(isAnswered(a)).toBe(true);
  });

  it('isAnswered con OrderAnswer devuelve true', () => {
    const a: Answer = { kind: 'order', sequence: [1, 0, 2] };
    expect(isAnswered(a)).toBe(true);
  });

  it('isAnswered con MatchAnswer devuelve true', () => {
    const a: Answer = { kind: 'match', pairs: [[0, 1]] };
    expect(isAnswered(a)).toBe(true);
  });

  it('isAnswered con CaseAnswer devuelve true si al menos una sub-respuesta no es null', () => {
    const a: Answer = { kind: 'case', answers: [{ kind: 'choice', index: 0 }, null] };
    expect(isAnswered(a)).toBe(true);
  });

  it('isAnswered con CaseAnswer de todas null devuelve false', () => {
    const a: Answer = { kind: 'case', answers: [null, null] };
    expect(isAnswered(a)).toBe(false);
  });
});
