export type {
  OfficialTag,
  BaseReactivo,
  ReactivoDirecto,
  ReactivoCompletamiento,
  ReactivoOrdenamiento,
  ReactivoRelacion,
  Reactivo,
  Question,
  // Aliases de compatibilidad
  DirectQuestion,
  CompletionQuestion,
  OrderingQuestion,
  ColumnMatchQuestion,
} from './question';
export { assertNever, getItemCount } from './question';

export type {
  ChoiceAnswer,
  OrderAnswer,
  MatchAnswer,
  Answer,
} from './answer';
export { isAnswered } from './answer';

export type { ValidationError, ValidationErrorCode, Result } from './validation';
export { validateQuestion } from './validation';
