import type { SampledExam } from '../exam/sampling';
import type { Reactivo } from '../question/question';
import type { Answer } from '../question/answer';
import type { AreaCode, SubareaCode } from '../taxonomy/taxonomy';
import type { BankWarning } from '../exam/sampling';
import { scoreQuestion } from './scoring-policy';

export interface ScoreEntry {
  readonly correct: number;
  readonly total: number;
}

export interface AttemptReport {
  readonly globalScore: ScoreEntry;
  readonly byArea: ReadonlyMap<AreaCode, ScoreEntry>;
  readonly bySubarea: ReadonlyMap<SubareaCode, ScoreEntry>;
  readonly bankWarnings: ReadonlyArray<BankWarning>;
}

function addScore(map: Map<string, { correct: number; total: number }>, key: string, correct: number, total: number): void {
  const existing = map.get(key);
  if (existing) {
    existing.correct += correct;
    existing.total += total;
  } else {
    map.set(key, { correct, total });
  }
}

/**
 * Construye el reporte de un intento.
 * Modelo v2: cada reactivo vale 1 punto (casos aplanados).
 * Sin respuesta = incorrecto (REQ-06.4).
 */
export function buildReport(
  exam: SampledExam,
  answers: ReadonlyMap<string, Answer | null>,
): AttemptReport {
  const areaMap = new Map<string, { correct: number; total: number }>();
  const subareaMap = new Map<string, { correct: number; total: number }>();
  let globalCorrect = 0;
  let globalTotal = 0;

  for (const question of exam.questions) {
    const reactivo = question as Reactivo;
    const answer = answers.get(reactivo.id) ?? null;
    const area = reactivo.area;
    const subarea = reactivo.subarea;

    const correct = scoreQuestion(reactivo, answer);
    globalCorrect += correct;
    globalTotal += 1;
    addScore(areaMap, area, correct, 1);
    addScore(subareaMap, subarea, correct, 1);
  }

  return {
    globalScore: { correct: globalCorrect, total: globalTotal },
    byArea: new Map(areaMap) as ReadonlyMap<AreaCode, ScoreEntry>,
    bySubarea: new Map(subareaMap) as ReadonlyMap<SubareaCode, ScoreEntry>,
    bankWarnings: exam.bankWarnings,
  };
}
