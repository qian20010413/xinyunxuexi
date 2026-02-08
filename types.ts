
export enum Subject {
  MATH = '数学',
  CHINESE = '语文',
  ENGLISH = '英语'
}

export enum Difficulty {
  CONCEPT = '基础概念',
  EASY = '简单应用',
  MEDIUM = '进阶练习',
  HARD = '综合挑战'
}

export interface Question {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  topic: string;
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timestamp: number;
}

export interface Mistake extends Question {
  wrongAnswer: string;
  retryCount: number;
}

export interface Progress {
  completed: number;
  correct: number;
  subjectStats: Record<Subject, { completed: number; correct: number }>;
}
