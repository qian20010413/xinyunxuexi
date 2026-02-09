
import { Subject, Difficulty, Question, Mistake, DailyRecord } from './types';
import { getRandomQuestions, getSubjectTotal } from './questionBank';
import { 
  BookOpen, Calculator, Languages, BookCheck, ChevronRight, 
  AlertCircle, CheckCircle2, XCircle, BarChart3, CalendarDays, RefreshCw, Trash2, Trophy, Star
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

const SESSION_TOTAL = 10;

const getCleanValue = (str: string) => {
  if (!str) return '';
  // 统一转为小写，去除前缀 A. 或 A、
  return str.replace(/^[A-Da-d][.\s、]*/, '').trim().toLowerCase();
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
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] text-gray-400 font-bold uppercase">Learning Path</span>
          <span className="text-xs font-medium text-gray-500">加油，<span className="text-indigo-600 font-bold">{name}</span>！</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Trophy size={16} />
        </div>
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [session, setSession] = useState<{
    active: boolean; subject: Subject; difficulty: Difficulty;
    questions: Question[]; currentIndex: number; answers: string[]; showExplanation: boolean;
    isMistakePractice?: boolean;
  } | null>(null);

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  useEffect(() => {
    try {
      setMistakes(JSON.parse(localStorage.getItem('mistakes') || '[]'));
      setHistory(JSON.parse(localStorage.getItem('exercise_history') || '[]'));
      setUsedIds(JSON.parse(localStorage.getItem('used_ids') || '[]'));
      setStats(JSON.parse(localStorage.getItem('stats') || '{"total":0,"correct":0}'));
    } catch (e) { console.error("Data load error", e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
    localStorage.setItem('exercise_history', JSON.stringify(history));
    localStorage.setItem('used_ids', JSON.stringify(usedIds));
    localStorage.setItem('stats', JSON.stringify(stats));
  }, [mistakes, history, usedIds, stats]);

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayStats = useMemo(() => history.find(h => h.date === todayDate) || { count: 0, correct: 0 }, [history, todayDate]);

  const last7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const r = history.find(h => h.date === ds);
      dates.push({ date: ds, label: i === 0 ? '今天' : `${d.getMonth()+1}/${d.getDate()}`, count: r ? r.count : 0 });
    }
    return dates;
  }, [history]);

  const maxDailyCount = Math.max(...last7Days.map(d => d.count), 10);

  const startSession = (subject: Subject) => {
    const qs = getRandomQuestions(subject, SESSION_TOTAL, usedIds);
    
    if (qs.length === 0) {
      if (window.confirm(`【解锁成就】你已经做完了${subject}的所有题目！是否清空记录重新开始？`)) {
        const prefix = subject === Subject.MATH ? 'M_' : subject === Subject.CHINESE ? 'C_' : 'E_';
        setUsedIds(prev => prev.filter(id => !id.startsWith(prefix)));
        setTimeout(() => startSession(subject), 100);
      }
      return;
    }

    setSession({
      active: true, subject, difficulty: Difficulty.MEDIUM,
      questions: qs,
      currentIndex: 0, answers: [], showExplanation: false,
      isMistakePractice: false
    });
  };

  const startMistakePractice = () => {
    if (mistakes.length === 0) return;
    setSession({
      active: true, subject: Subject.MATH, difficulty: Difficulty.MEDIUM,
      questions: mistakes.map(m => ({ ...m })),
      currentIndex: 0, answers: [], showExplanation: false,
      isMistakePractice: true
    });
  };

  const clearMistakes = () => {
    if (window.confirm('确定要清空所有错题吗？')) setMistakes([]);
  };

  const handleAnswer = (answer: string) => {
    if (!session || session.showExplanation) return;
    const currentQ = session.questions[session.currentIndex];
    const isCorrect = getCleanValue(answer) === getCleanValue(currentQ.correctAnswer);

    if (!session.isMistakePractice) {
      setUsedIds(prev => Array.from(new Set([...prev, currentQ.id])));
    }

    if (session.isMistakePractice) {
      if (isCorrect) setMistakes(prev => prev.filter(m => m.id !== currentQ.id));
    } else {
      if (!isCorrect) {
        setMistakes(prev => {
          if (prev.find(m => m.id === currentQ.id)) return prev;
          return [...prev, { ...currentQ, wrongAnswer: answer, retryCount: 0 }];
        });
      }
    }

    setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }));
    setSession({ ...session, answers: [...session.answers, answer], showExplanation: true });
  };

  const nextQuestion = () => {
    if (!session) return;
    if (session.currentIndex + 1 >= session.questions.length) {
      const correctCount = session.answers.reduce((acc, ans, idx) => 
        acc + (getCleanValue(ans) === getCleanValue(session.questions[idx].correctAnswer) ? 1 : 0), 0);
      
      if (!session.isMistakePractice) {
        setHistory(prev => {
          const existing = prev.find(h => h.date === todayDate);
          if (existing) return prev.map(h => h.date === todayDate ? { ...h, count: h.count + session.questions.length, correct: h.correct + correctCount } : h);
          return [...prev, { date: todayDate, count: session.questions.length, correct: correctCount, subjects: { [session.subject]: session.questions.length } }];
        });
      }
      setSession(null);
    } else {
      setSession({ ...session, currentIndex: session.currentIndex + 1, showExplanation: false });
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <Header name="欣芸" />
        <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
                <BarChart3 className="text-indigo-600" size={18} /> 学习动力舱
              </h2>
              <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-full"><Star size={12} className="text-yellow-500 fill-yellow-500" /> Unlock Progress</div>
            </div>
            <div className="grid grid-cols-7 gap-3 items-end h-32 mb-6">
              {last7Days.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded mb-1">{day.count}题</div>
                  <div className={`w-full rounded-t-xl transition-all duration-500 ${day.date === todayDate ? 'bg-indigo-600 shadow-lg' : 'bg-indigo-100 group-hover:bg-indigo-200'}`} style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: day.count > 0 ? '8px' : '4px' }}></div>
                  <span className={`text-[10px] font-bold ${day.date === todayDate ? 'text-indigo-600' : 'text-gray-400'}`}>{day.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
              <div className="text-center flex-1 border-r border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">今日挑战</p><p className="text-2xl font-black text-indigo-600">{todayStats.count}</p></div>
              <div className="text-center flex-1 border-r border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">本周正确率</p><p className="text-2xl font-black text-green-600">{todayStats.count > 0 ? Math.round((todayStats.correct / todayStats.count) * 100) : 0}%</p></div>
              <div className="text-center flex-1"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">总计解锁</p><p className="text-2xl font-black text-orange-500">{usedIds.length}</p></div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100">
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-gray-800"><BookOpen className="text-indigo-600" size={18} /> 精选科目练习</h2>
              <div className="space-y-4">
                {[Subject.MATH, Subject.CHINESE, Subject.ENGLISH].map(sub => {
                  const prefix = sub === Subject.MATH ? 'M_' : sub === Subject.CHINESE ? 'C_' : 'E_';
                  const used = usedIds.filter(id => id.startsWith(prefix)).length;
                  const total = getSubjectTotal(sub);
                  const percent = Math.round((used / total) * 100);
                  
                  return (
                    <div key={sub} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col gap-3 hover:border-indigo-200 transition-all group hover:shadow-md hover:shadow-indigo-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl transition-colors ${sub === Subject.MATH ? 'bg-blue-50 text-blue-500' : sub === Subject.CHINESE ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                            {sub === Subject.MATH ? <Calculator size={22} /> : sub === Subject.CHINESE ? <BookCheck size={22} /> : <Languages size={22} />}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 text-sm block">{sub}</span>
                            <span className="text-[10px] text-gray-400 font-bold">已击破: {used} / {total} 关</span>
                          </div>
                        </div>
                        <button onClick={() => startSession(sub)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all">开启挑战</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow bg-gray-100 h-2 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${sub === Subject.MATH ? 'bg-blue-500' : sub === Subject.CHINESE ? 'bg-orange-500' : 'bg-green-500'}`} style={{width: `${percent}%`}}></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 flex flex-col h-full relative">
                <h2 className="text-base font-bold mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600"><AlertCircle size={18} /> 错题收纳箱</div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 bg-red-50 text-red-500 px-2 py-1 rounded-full">{mistakes.length} 待修复</span>
                    {mistakes.length > 0 && <button onClick={clearMistakes} className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-colors"><Trash2 size={14}/></button>}
                  </div>
                </h2>
                <div className="space-y-3 flex-grow max-h-[180px] overflow-y-auto pr-1 mb-5 custom-scrollbar">
                  {mistakes.length === 0 ? <div className="flex flex-col items-center justify-center py-10 opacity-30"><Trophy size={40} className="mb-2" /><p className="text-xs italic font-bold">暂无顽固错题</p></div> : mistakes.slice(-5).reverse().map((m, i) => (
                    <div key={i} className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-red-700 truncate text-[11px] font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></div>
                      <span className="flex-grow truncate">[{m.topic}] {m.content}</span>
                    </div>
                  ))}
                </div>
                {mistakes.length > 0 && (
                  <button onClick={startMistakePractice} className="w-full mt-auto py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95 transition-all text-sm">
                    <RefreshCw size={16} /> 重温错题 · 巩固提升
                  </button>
                )}
            </section>
          </div>
        </main>
      </div>
    );
  }

  const currentQ = session.questions[session.currentIndex];
  const lastUserAnswer = session.answers[session.currentIndex];
  const isCorrect = lastUserAnswer && getCleanValue(lastUserAnswer) === getCleanValue(currentQ.correctAnswer);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header name="欣芸" />
      <main className="max-w-xl mx-auto px-4 mt-4">
        <div className="bg-white p-7 rounded-[40px] shadow-sm border border-gray-100 min-h-[520px] flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 ${session.isMistakePractice ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'} text-[10px] font-black rounded-full uppercase tracking-widest`}>
                {session.isMistakePractice ? '重点攻坚' : currentQ.topic}
              </span>
              {!session.isMistakePractice && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> 精选库题</span>}
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 font-bold">PROGRESS</span>
                <span className="text-xs text-indigo-600 font-black">{session.currentIndex + 1} / {session.questions.length}</span>
            </div>
          </div>
          
          <div className="mb-8 flex-grow">
            <h3 className="text-xl font-bold text-gray-800 leading-relaxed whitespace-pre-wrap">{session.currentIndex + 1}. {currentQ.content}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            {currentQ.options?.map((opt, i) => {
              const isOptionCorrect = getCleanValue(opt) === getCleanValue(currentQ.correctAnswer);
              const isOptionSelected = lastUserAnswer && getCleanValue(lastUserAnswer) === getCleanValue(opt);
              
              let btnClass = "p-5 rounded-2xl text-left font-bold text-sm transition-all border-2 flex items-center justify-between ";
              if (session.showExplanation) {
                if (isOptionCorrect) btnClass += "bg-green-50 border-green-500 text-green-700";
                else if (isOptionSelected) btnClass += "bg-red-50 border-red-500 text-red-700";
                else btnClass += "bg-gray-50 border-transparent text-gray-300 opacity-50";
              } else btnClass += "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md active:bg-indigo-50 text-gray-700";

              return (
                <button key={i} disabled={session.showExplanation} onClick={() => handleAnswer(opt)} className={btnClass}>
                  <span>{opt}</span>
                  {session.showExplanation && isOptionCorrect && <CheckCircle2 className="text-green-500" size={20} />}
                  {session.showExplanation && isOptionSelected && !isOptionCorrect && <XCircle className="text-red-500" size={20} />}
                </button>
              );
            })}
          </div>

          {session.showExplanation && (
            <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-6">
              <div className={`flex items-center gap-2 mb-5 p-4 rounded-2xl font-black text-sm ${isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {isCorrect ? "挑战成功！完美命中" : `挑战失败。正确答案是：${currentQ.correctAnswer}`}
              </div>
              <div className="p-5 bg-gray-50 rounded-[24px] text-xs text-gray-600 leading-relaxed mb-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                    <strong className="text-gray-900 font-bold uppercase tracking-wider">思路点拨</strong>
                </div>
                {currentQ.explanation}
              </div>
              <button onClick={nextQuestion} className={`w-full py-4.5 ${session.isMistakePractice ? 'bg-red-600 shadow-red-100' : 'bg-indigo-600 shadow-indigo-100'} text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all text-base`}>
                {session.currentIndex + 1 === session.questions.length ? '完成本轮挑战' : '解锁下一关'} <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
