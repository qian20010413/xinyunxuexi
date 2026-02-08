
import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Difficulty, Question, Mistake, DailyRecord } from './types';
import { getRandomQuestions } from './questionBank';
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
  SendHorizontal,
  BarChart3,
  CalendarDays
} from 'lucide-react';

const SESSION_TOTAL = 10;

const normalize = (str: string) => {
  if (!str) return '';
  let result = str.trim()
    .replace(/\s+/g, '')
    .replace(/[.．。，,]/g, '')
    .toUpperCase();
  result = result.replace(/\b1([A-Z])\b/g, '$1');
  return result;
};

const Header: React.FC<{ name: string }> = ({ name }) => (
  <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-100">
          <BookCheck size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            提优练习室
          </h1>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">人教版 · 七年级</p>
        </div>
      </div>
      <div className="text-xs font-medium text-gray-500">
        加油，<span className="text-indigo-600 font-bold">{name}</span>！
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [session, setSession] = useState<{
    active: boolean;
    subject: Subject;
    difficulty: Difficulty;
    questions: Question[];
    currentIndex: number;
    answers: string[];
    showExplanation: boolean;
  } | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  useEffect(() => {
    const savedMistakes = localStorage.getItem('mistakes');
    if (savedMistakes) setMistakes(JSON.parse(savedMistakes));
    const savedStats = localStorage.getItem('stats');
    if (savedStats) setStats(JSON.parse(savedStats));
    const savedHistory = localStorage.getItem('exercise_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
    localStorage.setItem('stats', JSON.stringify(stats));
    localStorage.setItem('exercise_history', JSON.stringify(history));
  }, [mistakes, stats, history]);

  const todayDate = new Date().toISOString().split('T')[0];
  
  const todayStats = useMemo(() => {
    return history.find(h => h.date === todayDate) || { count: 0, correct: 0, subjects: {} };
  }, [history, todayDate]);

  const last7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = history.find(h => h.date === dateStr);
      dates.push({
        date: dateStr,
        label: i === 0 ? '今天' : `${d.getMonth()+1}/${d.getDate()}`,
        count: record ? record.count : 0
      });
    }
    return dates;
  }, [history]);

  const maxDailyCount = Math.max(...last7Days.map(d => d.count), 10);

  const startSession = (subject: Subject, difficulty: Difficulty) => {
    setSession({
      active: true, subject, difficulty,
      questions: getRandomQuestions(subject, SESSION_TOTAL),
      currentIndex: 0, answers: [], showExplanation: false
    });
    setInputValue('');
  };

  const handleAnswer = (answer: string) => {
    if (!session || session.showExplanation || !answer.trim()) return;

    const currentQ = session.questions[session.currentIndex];
    const normalizedUser = normalize(answer);
    const normalizedCorrect = normalize(currentQ.correctAnswer);
    const isCorrect = normalizedUser === normalizedCorrect;

    if (!isCorrect) {
      const existing = mistakes.find(m => m.id === currentQ.id);
      if (!existing) {
        setMistakes(prev => [...prev, { ...currentQ, wrongAnswer: answer, retryCount: 0 }]);
      }
    }

    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));

    setSession({
      ...session,
      answers: [...session.answers, answer],
      showExplanation: true
    });
  };

  const nextQuestion = () => {
    if (!session) return;
    if (session.currentIndex + 1 >= session.questions.length) {
      // 完成练习，更新历史记录
      const correctCount = session.answers.filter((ans, idx) => 
        normalize(ans) === normalize(session.questions[idx].correctAnswer)
      ).length;

      setHistory(prev => {
        const existingIdx = prev.findIndex(h => h.date === todayDate);
        const newHistory = [...prev];
        if (existingIdx > -1) {
          newHistory[existingIdx] = {
            ...newHistory[existingIdx],
            count: newHistory[existingIdx].count + SESSION_TOTAL,
            correct: newHistory[existingIdx].correct + correctCount,
            subjects: {
              ...newHistory[existingIdx].subjects,
              [session.subject]: (newHistory[existingIdx].subjects[session.subject] || 0) + SESSION_TOTAL
            }
          };
        } else {
          newHistory.push({
            date: todayDate,
            count: SESSION_TOTAL,
            correct: correctCount,
            subjects: { [session.subject]: SESSION_TOTAL }
          });
        }
        return newHistory;
      });

      setSession(null);
    } else {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
        showExplanation: false
      });
      setInputValue('');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <Header name="欣芸" />
        <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          
          {/* 顶部学习仪表盘 */}
          <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
                <BarChart3 className="text-indigo-600" size={18} />
                学习进度周报
              </h2>
              <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                <CalendarDays size={12} /> Last 7 Days
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-32 mb-4">
              {last7Days.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ${day.date === todayDate ? 'bg-indigo-600' : 'bg-indigo-100'}`}
                    style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                  >
                    {day.count > 0 && (
                      <div className="text-[9px] text-center font-bold text-indigo-700 -mt-5">
                        {day.count}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${day.date === todayDate ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="text-center flex-1 border-r border-gray-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">今日完成</p>
                <p className="text-xl font-black text-indigo-600">{todayStats.count} <span className="text-xs font-medium">题</span></p>
              </div>
              <div className="text-center flex-1 border-r border-gray-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">今日正确率</p>
                <p className="text-xl font-black text-green-600">
                  {todayStats.count > 0 ? Math.round((todayStats.correct / todayStats.count) * 100) : 0}%
                </p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">累计坚持</p>
                <p className="text-xl font-black text-orange-500">{history.length} <span className="text-xs font-medium">天</span></p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-800">
                <BookOpen className="text-indigo-600" size={18} />
                开启新练习
              </h2>
              <div className="space-y-3">
                {[Subject.MATH, Subject.CHINESE, Subject.ENGLISH].map(sub => (
                  <div key={sub} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                        {sub === Subject.MATH ? <Calculator className="text-blue-500" size={20} /> : 
                         sub === Subject.CHINESE ? <BookCheck className="text-orange-500" size={20} /> : 
                         <Languages className="text-green-500" size={20} />}
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 block">{sub}</span>
                        <span className="text-[9px] text-gray-400 font-bold">人教版 · 七年级</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => startSession(sub, Difficulty.EASY)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-100 active:scale-95 transition-all"
                    >
                      开始
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-2xl shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-indigo-100 text-[10px] font-bold mb-1 tracking-wider uppercase">总正确率 (All Time)</h3>
                  <div className="text-3xl font-bold mb-3">
                    {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <div className="bg-white/20 px-2 py-1 rounded-md">√ {stats.correct}</div>
                    <div className="bg-white/20 px-2 py-1 rounded-md">× {stats.total - stats.correct}</div>
                  </div>
                </div>
                <Trophy className="absolute -bottom-2 -right-2 text-white/10 rotate-12" size={80} />
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-base font-bold mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={18} />
                    错题本
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total: {mistakes.length}</span>
                </h2>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {mistakes.length === 0 ? (
                    <p className="text-center py-6 text-xs text-gray-400 font-medium">还没有错题，真棒！</p>
                  ) : (
                    mistakes.map((m, idx) => (
                      <div key={idx} className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex items-center justify-between">
                        <div className="truncate flex-1">
                          <p className="text-[9px] text-red-500 font-bold mb-0.5">{m.topic}</p>
                          <p className="text-xs text-gray-700 truncate font-medium">{m.content}</p>
                        </div>
                        <ChevronRight className="text-red-200" size={14} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQ = session.questions[session.currentIndex];
  const lastUserAnswer = session.answers[session.currentIndex];
  const isCorrect = lastUserAnswer && normalize(lastUserAnswer) === normalize(currentQ.correctAnswer);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header name="欣芸" />
      <main className="max-w-xl mx-auto px-4 mt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                {session.subject}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                进度: {session.currentIndex + 1} / {session.questions.length}
              </span>
            </div>
            <div className="text-[10px] text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
              <AlertCircle size={10} /> 练习中不可退出
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[420px]">
            <div className="mb-6">
              <p className="text-[10px] text-indigo-500 font-black tracking-widest uppercase mb-2">{currentQ.topic}</p>
              <h3 className="text-lg font-bold text-gray-800 leading-relaxed mb-4">
                {currentQ.content}
              </h3>
              {currentQ.svgContent && (
                <div className="my-4 p-4 bg-gray-50 rounded-2xl flex justify-center border border-gray-100" 
                     dangerouslySetInnerHTML={{ __html: currentQ.svgContent }} />
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 mt-auto">
              {currentQ.options ? (
                currentQ.options.map((opt, i) => {
                  const optKey = opt[0].toUpperCase();
                  const isSelected = lastUserAnswer === optKey;
                  const isOptCorrect = normalize(optKey) === normalize(currentQ.correctAnswer);
                  
                  let btnClass = "p-4 rounded-xl text-left font-bold text-sm transition-all border-2 flex items-center justify-between ";
                  if (session.showExplanation) {
                    if (isOptCorrect) btnClass += "bg-green-50 border-green-500 text-green-700";
                    else if (isSelected) btnClass += "bg-red-50 border-red-500 text-red-700";
                    else btnClass += "bg-gray-50 border-transparent text-gray-300 opacity-50";
                  } else {
                    btnClass += "bg-white border-gray-50 active:border-indigo-600 active:bg-indigo-50 text-gray-700 hover:border-indigo-100";
                  }

                  return (
                    <button 
                      key={i} 
                      disabled={session.showExplanation}
                      onClick={() => handleAnswer(optKey)}
                      className={btnClass}
                    >
                      <span className="flex-1">{opt}</span>
                      {session.showExplanation && isOptCorrect && <CheckCircle2 className="text-green-500" size={16} />}
                      {session.showExplanation && isSelected && !isOptCorrect && <XCircle className="text-red-500" size={16} />}
                    </button>
                  );
                })
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="text"
                      autoFocus
                      className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all text-center text-lg font-bold text-indigo-700"
                      placeholder="点击输入答案..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnswer(inputValue)}
                      disabled={session.showExplanation}
                    />
                  </div>
                  {!session.showExplanation && (
                    <button 
                      onClick={() => handleAnswer(inputValue)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                    >
                      <SendHorizontal size={18} /> 确认提交
                    </button>
                  )}
                </div>
              )}
            </div>

            {session.showExplanation && (
              <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                <div className={`flex items-center gap-2 mb-4 p-4 rounded-2xl border-2 font-black ${isCorrect ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  {isCorrect ? (
                    <><CheckCircle2 size={24} /> 回答正确！棒极了！</>
                  ) : (
                    <><XCircle size={24} /> 回答错误，加油哦！</>
                  )}
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <History className="text-indigo-600" size={14} />
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">知识点解析</p>
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed font-medium">{currentQ.explanation}</p>
                  {!isCorrect && <p className="mt-2 text-xs font-bold text-indigo-900">正确答案是：<span className="bg-white px-2 py-0.5 rounded border border-indigo-200">{currentQ.correctAnswer}</span></p>}
                </div>
                <button 
                  onClick={nextQuestion}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  继续下一题 <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
