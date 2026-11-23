import { fixtureQuiz, isFixtureMode, type FixtureQuizQuestion } from './fixtures';

/** In-memory handoff between the quiz player and the results screen in the
 *  pages phase (no backend yet). The wiring phase replaces this with the
 *  attempt APIs (/api/v1/quiz-attempts). */
export type EssayReview={feedback:string;scorePercent:number;stagesMet:number;stagesTotal:number;stageNotes:string[]};
export interface QuizResultItem {
  essayReview?:EssayReview|null;
  question: FixtureQuizQuestion;
  chosen?: string;
  isCorrect: boolean;
}

export interface QuizResult {
  paperId: string;
  source?:'paper'|'lecture';
  localOnly?:boolean;
  title: string;
  createdAt?:string;
  focusLossCount?:number;
  attemptId?:string;
  score: number;
  correct: number;
  total: number;
  timeTaken: number; // seconds
  items: QuizResultItem[];
}

let lastResult: QuizResult | null = null;

export function clearQuizResult(){lastResult=null;}
export function setQuizResult(r: QuizResult) { lastResult = r; }

/** Web-preview seed (same pattern as the preview session token): lets the
 *  static web export render the results screen for screenshots. Never
 *  triggers on native (no localStorage). */
function previewSeed(): QuizResult | null {
  try {
    if(!isFixtureMode())return null;
    if (typeof localStorage === 'undefined') return null;
    if (localStorage.getItem('previewQuizResult') !== '1') return null;
    const quiz = fixtureQuiz('demo');
    const chosen: Record<string, string | undefined> = {
      q1: 'A', q2: 'B', q3: 'B', q4: 'A', q5: 'D', q6: 'C', q7: 'B', q8: undefined,
    };
    const items = quiz.questions.map((question) => ({
      question,
      chosen: chosen[question.id],
      isCorrect: chosen[question.id] === question.answer,
    }));
    const correct = items.filter((i) => i.isCorrect).length;
    return {
      localOnly: true,
      paperId: quiz.id,
      title: quiz.title,
      score: Math.round((correct / quiz.questions.length) * 100),
      correct,
      total: quiz.questions.length,
      timeTaken: 754,
      items,
    };
  } catch {
    return null;
  }
}

export function getQuizResult(): QuizResult | null { return lastResult ?? previewSeed(); }
