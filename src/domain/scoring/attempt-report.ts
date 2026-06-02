import type { SampledExam } from '../exam/sampling';
import type { LeafQuestion, CaseQuestion } from '../question/question';
import type { Answer, CaseAnswer, LeafAnswer } from '../question/answer';
import type { AreaCode, SubareaCode } from '../taxonomy/taxonomy';
import type { BankWarning } from '../exam/sampling';
import { scoreQuestion, scoreCaseQuestion } from './scoring-policy';

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
 * Criterial: cada reactivo vale 1 punto; caso vale N puntos (REQ-06).
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
    const answer = answers.get(question.id) ?? null;
    const area = question.officialTag.area;
    const subarea = question.officialTag.subarea;

    if (question.itemType === 'case') {
      const caseQ = question as CaseQuestion;
      const n = caseQ.subQuestions.length;
      const caseAns = answer && answer.kind === 'case' ? (answer as CaseAnswer).answers : Array(n).fill(null);
      const caseAnswersArr = Array.from({ length: n }, (_, i) => caseAns[i] ?? null) as Array<LeafAnswer | null>;
      const correct = scoreCaseQuestion(caseQ, caseAnswersArr);

      globalCorrect += correct;
      globalTotal += n;
      addScore(areaMap, area, correct, n);
      addScore(subareaMap, subarea, correct, n);
    } else {
      const leafQ = question as LeafQuestion;
      const leafAns = answer as LeafAnswer | null;
      const correct = scoreQuestion(leafQ, leafAns);

      globalCorrect += correct;
      globalTotal += 1;
      addScore(areaMap, area, correct, 1);
      addScore(subareaMap, subarea, correct, 1);
    }
  }

  return {
    globalScore: { correct: globalCorrect, total: globalTotal },
    byArea: new Map(areaMap) as ReadonlyMap<AreaCode, ScoreEntry>,
    bySubarea: new Map(subareaMap) as ReadonlyMap<SubareaCode, ScoreEntry>,
    bankWarnings: exam.bankWarnings,
  };
}
