
import React, { useState, useEffect } from 'react';
import { Subject, Difficulty, Question, Mistake, AiConfig, AiProvider } from './types';
import { generateSessionQuestions } from './geminiService';
import { 
  BookOpen, 
  Calculator, 
  Languages, 
  BookCheck, 
  History, 
  ChevronRight, 
  Settings, 
  AlertCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  WifiOff,
  X,
  Globe,
  Key
} from 'lucide-react';

const SESSION_TOTAL = 20;
const normalize = (str: string) => str.trim().toUpperCase().replace(/[.．。]/g, '');

const Header: React.FC<{ name: string; onOpenSettings: () => void }> = ({ name, onOpenSettings }) => (
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
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
          title="AI 设置"
        >
          <Settings size={20} />
        </button>
        <div className="hidden sm:block text-sm font-medium text-gray-600">
          Hi, <span className="text-indigo-600">{name}</span> 妹妹！
        </div>
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'practice' | 'mistakes' | 'report'>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: 'gemini',
    apiKey: process.env.API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    modelName: 'gemini-3-flash-preview'
  });

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<{isCorrect: boolean}[]>([]);

  useEffect(() => {
    const savedMistakes = localStorage.getItem('xinyun_mistakes');
    if (savedMistakes) setMistakes(JSON.parse(savedMistakes));
    
    const savedConfig = localStorage.getItem('xinyun_ai_config');
    if (savedConfig) setAiConfig(JSON.parse(savedConfig));
  }, []);

  useEffect(() => {
    localStorage.setItem('xinyun_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem('xinyun_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  const startSession = async (subject: Subject) => {
    if (!aiConfig.apiKey) {
      alert("请先点击右上角设置图标配置 AI 的 API Key 喔！");
      setShowSettings(true);
      return;
    }
    setSelectedSubject(subject);
    setIsLoading(true);
    setErrorMsg(null);
    setView('practice');
    setCurrentIndex(0);
    setSessionCorrectCount(0);
    setSessionHistory([]);
    
    try {
      const questions = await generateSessionQuestions(subject, aiConfig, SESSION_TOTAL);
      setSessionQuestions(questions);
      setUserAnswer('');
      setShowResult(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = () => {
    const currentQuestion = sessionQuestions[currentIndex];
    if (!currentQuestion || !userAnswer) return;
    
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

  const SettingsModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="animate-spin-slow" />
            <h3 className="text-xl font-bold">AI 实验室设置</h3>
          </div>
          <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">选择 AI 服务商</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setAiConfig({...aiConfig, provider: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com', modelName: 'gemini-3-flash-preview'})}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${aiConfig.provider === 'gemini' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400'}`}
              >
                Google Gemini
              </button>
              <button 
                onClick={() => setAiConfig({...aiConfig, provider: 'openai-compatible', baseUrl: '', modelName: ''})}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${aiConfig.provider === 'openai-compatible' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400'}`}
              >
                国内/兼容模型
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Key size={14} /> API Key
              </label>
              <input 
                type="password"
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                placeholder="在此输入您的 API 密钥"
                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-indigo-600 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">※ 密钥存储在您的浏览器本地，不会被上传。</p>
            </div>

            {aiConfig.provider === 'openai-compatible' && (
              <>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Globe size={14} /> 接口地址 (Base URL)
                  </label>
                  <input 
                    type="text"
                    value={aiConfig.baseUrl}
                    onChange={(e) => setAiConfig({...aiConfig, baseUrl: e.target.value})}
                    placeholder="例如: https://api.deepseek.com"
                    className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    模型名称 (Model Name)
                  </label>
                  <input 
                    type="text"
                    value={aiConfig.modelName}
                    onChange={(e) => setAiConfig({...aiConfig, modelName: e.target.value})}
                    placeholder="例如: deepseek-chat 或 qwen-plus"
                    className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-indigo-600 outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setShowSettings(false)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            保存并返回
          </button>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">准备好开启 20 题挑战了吗？</h2>
        <p className="text-gray-500">点击下方科目，AI 老师将为你即时编排整套【人教版七年级上册】练习！</p>
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
            <span className="text-sm text-gray-400 mt-2">梯度练习 · 20 题</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button onClick={() => setView('mistakes')} className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 font-bold transition-all">
          <History size={20} className="text-indigo-500" />
          错题本回顾 ({mistakes.length})
        </button>
      </div>
    </div>
  );

  const renderPractice = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <Loader2 size={64} className="text-indigo-600 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AI 老师正在为您出题...</h2>
          <p className="text-gray-400 text-sm">正在检索七年级上册知识点，请稍候</p>
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="bg-red-50 p-10 rounded-[2.5rem] border border-red-100 max-w-md">
            <WifiOff size={64} className="mx-auto text-red-400 mb-6" />
            <h2 className="text-xl font-bold text-red-700 mb-4">连接 AI 失败</h2>
            <p className="text-red-600/80 text-sm mb-6 leading-relaxed">{errorMsg}</p>
            <div className="space-y-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                检查 AI 设置
              </button>
              <button onClick={() => setView('home')} className="w-full text-red-400 text-sm">返回主页</button>
            </div>
          </div>
        </div>
      );
    }

    const currentQuestion = sessionQuestions[currentIndex];
    if (!currentQuestion) return null;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 animate-in fade-in duration-500">
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

        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-50 border border-gray-100 p-6 sm:p-10">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest bg-indigo-50 text-indigo-600`}>
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
                  </button>
                );
              })
            ) : (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="在此输入答案..."
                className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all"
                disabled={showResult}
              />
            )}
          </div>

          {!showResult ? (
            <button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              提交答案
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className={`p-6 rounded-2xl mb-6 ${isCurrentCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                 <p className={`font-bold mb-4 flex items-center gap-2 ${isCurrentCorrect ? 'text-green-700' : 'text-red-700'}`}>
                   {isCurrentCorrect ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                   {isCurrentCorrect ? '欣芸真棒！答对啦！' : '再仔细看一眼解析哦！'}
                 </p>
                <div className="bg-white/80 p-4 rounded-xl border border-gray-100 text-sm">
                  <p className="font-bold text-gray-800 mb-2">正确答案：{currentQuestion.correctAnswer}</p>
                  <p className="text-gray-600 italic leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                {currentIndex + 1 === SESSION_TOTAL ? '查看战报' : '下一题'} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
        <Trophy size={80} className="mx-auto text-yellow-400 mb-6" />
        <h2 className="text-3xl font-black text-gray-900 mb-2">练习完成！</h2>
        <div className="grid grid-cols-2 gap-4 my-8">
          <div className="bg-indigo-50 p-6 rounded-3xl">
            <p className="text-3xl font-black text-indigo-600">{sessionCorrectCount}</p>
            <p className="text-xs font-bold text-indigo-400 mt-1 uppercase">正确</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-3xl">
            <p className="text-3xl font-black text-purple-600">{Math.round((sessionCorrectCount / SESSION_TOTAL) * 100)}%</p>
            <p className="text-xs font-bold text-purple-400 mt-1 uppercase">正确率</p>
          </div>
        </div>
        <button onClick={() => setView('home')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">返回主页</button>
      </div>
    </div>
  );

  const renderMistakes = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">欣芸的错题本 ({mistakes.length})</h2>
        <button onClick={() => setView('home')} className="text-indigo-600 font-bold">返回主页</button>
      </div>
      {mistakes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400">目前还没有错题，继续加油！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mistakes.map((m, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black uppercase rounded-full mb-4 inline-block">{m.subject}</span>
              <p className="text-lg font-bold text-gray-800 mb-4">{m.content}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-red-50 rounded-xl"><p className="text-xs text-red-400 mb-1">错误填写</p><p className="font-bold text-red-700">{m.wrongAnswer}</p></div>
                <div className="p-4 bg-green-50 rounded-xl"><p className="text-xs text-green-400 mb-1">正确答案</p><p className="font-bold text-green-700">{m.correctAnswer}</p></div>
              </div>
              <p className="text-sm text-gray-600 italic bg-gray-50 p-4 rounded-xl">{m.explanation}</p>
            </div>
          ))}
          <button onClick={() => setMistakes([])} className="w-full text-center text-gray-400 text-sm mt-8">清空错题本</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header name="欣芸" onOpenSettings={() => setShowSettings(true)} />
      {showSettings && <SettingsModal />}
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
