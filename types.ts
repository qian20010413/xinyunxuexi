
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

export type AiProvider = 'gemini' | 'openai-compatible';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  modelName: string;
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
  svgContent?: string; // 新增：用于存放图形化内容的 SVG 字符串
  userAnswer?: string;
  isCorrect?: boolean;
  timestamp?: number;
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
