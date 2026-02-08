import React, { useState, useEffect } from 'react';
import { Subject, Difficulty, Question, Mistake } from './types';
import { generateSessionQuestions } from './geminiService';
import { 
  BookOpen, 
  Calculator, 
  Languages, 
  BookCheck, 
  History, 
  ChevronRight, 
  AlertCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';

const SESSION_TOTAL = 20;

// Helper to normalize strings for comparison
const normalize = (str: string) =>
  str.trim().toUpperCase().replace(/[.．。]/g, '');

// ====== 是否配置了 API Key（关键兜底） ======
const hasApiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

const Header: React.FC<{ name: string }> = ({ name }) => (
  <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-100">
          <BookCheck size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            欣芸的提优练习室
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            人教版 · 七年级上册专用
          </p>
        </div>
      </div>
      <div className="hidden sm:block text-sm font-medium text-gray-600">
        Hi, <span className="text-indigo-600">{name}</span> 妹妹！加油 ✨
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'practice' | 'mistakes' | 'report'>('home');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);

  // Session States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<{ isCorrect: boolean }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('xinyun_mistakes');
    if (saved) setMistakes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('xinyun_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  // ====== 开始练习（加 API Key 兜底） ======
  const startSession = async (subject: Subject) => {
    if (!hasApiKey) {
      alert('当前未配置 Gemini API Key，暂时无法生成题目。');
      return;
    }

    setSelectedSubject(subject);
    setIsLoading(true);
    setView('practice');
    setCurrentIndex(0);
    setSessionCorrectCount(0);
    setSessionHistory([]);

    try {
      const questions = await generateSessionQuestions(subject, SESSION_TOTAL);

      // ⭐ 二次保险：防止返回空数组导致白屏
      if (!questions || questions.length === 0) {
        alert('题目生成失败，请稍后再试一次哦～');
        setView('home');
        return;
      }

      setSessionQuestions(questions);
      setUserAnswer('');
      setShowResult(false);
    } catch (err) {
      alert('哎呀，姐姐刚才出题走神了，请再试一次哦！');
      setView('home');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = () => {
    const currentQuestion = sessionQuestions[currentIndex];
    if (!currentQuestion || !userAnswer) return;

    const correct =
      normalize(userAnswer) === normalize(currentQuestion.correctAnswer);
    setIsCurrentCorrect(correct);
    setShowResult(true);

    if (correct) {
      setSessionCorrectCount(prev => prev + 1);
    } else {
      const newMistake: Mistake = {
        ...currentQuestion,
        wrongAnswer: userAnswer,
        retryCount: 0
      };
      setMistakes(prev => [newMistake, ...prev]);
    }

    setSessionHistory(prev => [...prev, { isCorrect: correct }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= SESSION_TOTAL) {
      setView('report');
    } else {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setShowResult(false);
      setIsCurrentCorrect(false);
    }
  };

  // ====== 首页 ======
  const renderHome = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {!hasApiKey && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm text-yellow-700">
          ⚠️ 当前未配置 Gemini API Key，题目生成功能不可用。
          <br />
          请在 <strong>Vercel → Environment Variables</strong> 中配置：
          <pre className="mt-2 bg-white/80 p-2 rounded">
            VITE_GEMINI_API_KEY=你的Key
          </pre>
        </div>
      )}

      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          准备好开启 20 题挑战了吗？
        </h2>
        <p className="text-gray-500">
          点击下方科目，姐姐会为你准备整套七年级上册练习题！
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { s: Subject.CHINESE, icon: <BookOpen size={32} />, color: 'rose' },
          { s: Subject.MATH, icon: <Calculator size={32} />, color: 'blue' },
          { s: Subject.ENGLISH, icon: <Languages size={32} />, color: 'emerald' }
        ].map(({ s, icon, color }) => (
          <button
            key={s}
            onClick={() => startSession(s)}
            disabled={!hasApiKey}
            className="flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group disabled:opacity-40"
          >
            <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 mb-4`}>
              {icon}
            </div>
            <span className="text-xl font-bold text-gray-800">
              {s} 提优挑战
            </span>
            <span className="text-sm text-gray-400 mt-2">
              预加载 20 题（上册）
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setView('mistakes')}
        className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 font-bold transition-all mx-auto"
      >
        <History size={20} className="text-indigo-500" />
        查看错题本 ({mistakes.length})
      </button>
    </div>
  );

  // ====== 下面 renderPractice / renderReport / renderMistakes
  // ====== 你原来的代码【完全不需要改】
  // ======（为节省篇幅，这里不重复贴，保持你原样即可）

  return (
    <div className="min-h-screen bg-slate-50">
      <Header name="欣芸" />
      <main className="pb-10">
        {view === 'home' && renderHome()}
        {view === 'practice' && /* 原 renderPractice */ null}
        {view === 'mistakes' && /* 原 renderMistakes */ null}
        {view === 'report' && /* 原 renderReport */ null}
      </main>
    </div>
  );
};

export default App;
