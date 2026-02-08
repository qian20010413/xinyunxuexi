
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
  Award, 
  AlertCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';

const SESSION_TOTAL = 20;

// Helper to normalize strings for comparison
const normalize = (str: string) => str.trim().toUpperCase().replace(/[.．。]/g, '');

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
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">人教版 · 七年级上册专用</p>
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
  const [sessionHistory, setSessionHistory] = useState<{isCorrect: boolean}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('xinyun_mistakes');
    if (saved) setMistakes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('xinyun_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  const startSession = async (subject: Subject) => {
    setSelectedSubject(subject);
    setIsLoading(true);
    setView('practice');
    setCurrentIndex(0);
    setSessionCorrectCount(0);
    setSessionHistory([]);
    
    try {
      const questions = await generateSessionQuestions(subject, SESSION_TOTAL);
      setSessionQuestions(questions);
      setUserAnswer('');
      setShowResult(false);
    } catch (err) {
      alert("哎呀，姐姐刚才出题走神了，请再试一次哦！");
      setView('home');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = () => {
    const currentQuestion = sessionQuestions[currentIndex];
    if (!currentQuestion || !userAnswer) return;
    
    // Robust comparison: normalize both user answer and correct answer
    const correct = normalize(userAnswer) === normalize(currentQuestion.correctAnswer);
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

  const renderHome = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">准备好开启 20 题挑战了吗？</h2>
        <p className="text-gray-500">点击下方科目，姐姐会为你一次性准备好整套【七年级上册】练习题！</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { s: Subject.CHINESE, icon: <BookOpen size={32} />, color: 'rose' },
          { s: Subject.MATH, icon: <Calculator size={32} />, color: 'blue' },
          { s: Subject.ENGLISH, icon: <Languages size={32} />, color: 'emerald' }
        ].map(({s, icon, color}) => (
          <button 
            key={s}
            onClick={() => startSession(s)}
            className="flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 mb-4 group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <span className="text-xl font-bold text-gray-800">{s}提优挑战</span>
            <span className="text-sm text-gray-400 mt-2">预加载 20 题 (上册)</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button onClick={() => setView('mistakes')} className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 font-bold transition-all">
          <History size={20} className="text-indigo-500" />
          查看错题本 ({mistakes.length})
        </button>
      </div>
    </div>
  );

  const renderPractice = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="relative w-24 h-24 mb-8">
            <Loader2 size={96} className="text-indigo-600 animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookCheck size={40} className="text-indigo-600 animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">姐姐正在为你快速出题中...</h2>
          <div className="max-w-xs mx-auto space-y-2 text-gray-400 text-sm">
             <p className="animate-pulse">正在精选七年级上册核心考点 ✨</p>
             <p className="animate-pulse delay-75">正在为您编排梯度难度 📈</p>
             <p className="animate-pulse delay-150">正在检查解析格式 🧐</p>
          </div>
        </div>
      );
    }

    const currentQuestion = sessionQuestions[currentIndex];
    if (!currentQuestion) return null;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-indigo-600">正在挑战：{selectedSubject}</span>
            <span className="text-sm font-medium text-gray-400">进度：{currentIndex + 1} / {SESSION_TOTAL}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / SESSION_TOTAL) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-50 border border-gray-100 p-6 sm:p-10 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest ${
              currentQuestion.difficulty === Difficulty.HARD ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs font-bold text-gray-500">{currentQuestion.topic}</span>
          </div>
          
          <div className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
            {currentQuestion.content}
          </div>

          <div className="space-y-3 mb-8">
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              currentQuestion.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = userAnswer === letter;
                // Consistent check logic for UI
                const isCorrectOption = normalize(letter) === normalize(currentQuestion.correctAnswer);
                
                let btnClass = "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ";
                if (showResult) {
                  if (isCorrectOption) btnClass += "border-green-500 bg-green-50 text-green-700";
                  else if (isSelected) btnClass += "border-red-500 bg-red-50 text-red-700";
                  else btnClass += "border-gray-50 bg-gray-50 opacity-50";
                } else {
                  btnClass += isSelected ? "border-indigo-600 bg-indigo-50 shadow-inner" : "border-gray-50 hover:border-gray-200 bg-gray-50";
                }

                return (
                  <button key={idx} disabled={showResult} onClick={() => setUserAnswer(letter)} className={btnClass}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
                      {letter}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {showResult && isCorrectOption && <CheckCircle2 size={20} />}
                    {showResult && isSelected && !isCorrectOption && <XCircle size={20} />}
                  </button>
                );
              })
            ) : (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="在此输入答案..."
                className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                disabled={showResult}
              />
            )}
          </div>

          {!showResult ? (
            <button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              提交答案
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className={`p-6 rounded-2xl mb-6 ${isCurrentCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                 <div className="flex items-center gap-2 mb-4">
                  {isCurrentCorrect ? (
                    <p className="text-green-700 font-bold flex items-center gap-2">
                      <CheckCircle2 size={18} /> 欣芸真棒！这道题答对啦！
                    </p>
                  ) : (
                    <p className="text-red-700 font-bold flex items-center gap-2">
                      <AlertCircle size={18} /> 没关系，这题有点陷阱，再看一眼~
                    </p>
                  )}
                </div>
                <div className="bg-white/80 p-4 rounded-xl border border-gray-100 text-sm">
                  <p className="font-bold text-gray-800 mb-2">正确答案：{currentQuestion.correctAnswer}</p>
                  <p className="font-bold text-gray-800 mb-1">姐姐的提优讲解：</p>
                  <p className="text-gray-600 italic leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                {currentIndex + 1 === SESSION_TOTAL ? '查看挑战战报' : '进入下一题'} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <Trophy size={80} className="mx-auto text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-3xl font-black text-gray-900 mb-2">今日挑战报</h2>
        <p className="text-gray-500 mb-8">完成了人教版七年级上册 {selectedSubject} 专题 (共{SESSION_TOTAL}题)</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-50 p-6 rounded-3xl">
            <p className="text-3xl font-black text-indigo-600">{sessionCorrectCount}</p>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">正确题数</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-3xl">
            <p className="text-3xl font-black text-purple-600">{Math.round((sessionCorrectCount / SESSION_TOTAL) * 100)}%</p>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mt-1">正确率</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {sessionHistory.map((h, i) => (
            <div key={i} title={`第${i+1}题`} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${h.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {i + 1}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setView('home')} 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            返回主页
          </button>
          <button 
            onClick={() => startSession(selectedSubject!)} 
            className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> 再挑战一轮新题
          </button>
        </div>
      </div>
    </div>
  );

  const renderMistakes = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">欣芸的错题本</h2>
          <p className="text-sm text-gray-400">所有错题已记录，在这里把漏掉的知识补回来！</p>
        </div>
        <button onClick={() => setView('home')} className="text-indigo-600 font-bold px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all">返回主页</button>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border-4 border-dashed border-gray-50">
          <CheckCircle2 size={64} className="mx-auto text-green-200 mb-4" />
          <p className="text-gray-400 font-medium">目前的错题本空空如也，欣芸太厉害了！</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {mistakes.map((m, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-full">{m.subject}</span>
                <span className="text-[10px] font-bold text-gray-300">{new Date(m.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-lg font-bold text-gray-800 mb-6">{m.content}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-red-50/50 border border-red-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-red-400 uppercase mb-1">当时填错的</p>
                  <p className="text-red-700 font-bold">{m.wrongAnswer}</p>
                </div>
                <div className="p-4 bg-green-50/50 border border-green-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-green-400 uppercase mb-1">正确答案</p>
                  <p className="text-green-700 font-bold">{m.correctAnswer}</p>
                </div>
              </div>
              <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                <p className="text-xs font-bold text-indigo-400 mb-2 underline decoration-2 decoration-indigo-100">姐姐再讲一眼：</p>
                <p className="text-sm text-gray-600 leading-relaxed italic">{m.explanation}</p>
              </div>
            </div>
          ))}
          <button 
            onClick={() => { if(confirm("确定要清空错题吗？建议留着经常看看哦！")) setMistakes([]); }}
            className="w-full py-4 text-gray-400 text-sm font-medium hover:text-red-500 transition-colors"
          >
            清空所有记录
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header name="欣芸" />
      <main className="pb-10">
        {view === 'home' && renderHome()}
        {view === 'practice' && renderPractice()}
        {view === 'mistakes' && renderMistakes()}
        {view === 'report' && renderReport()}
      </main>
    </div>
  );
};

export default App;
