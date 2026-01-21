import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Zap, Swords, User, Bot, Play, RotateCcw, Clock, Target, 
  Settings, Check, Gamepad2, Timer, Flame, Wind, ArrowUp, 
  OctagonAlert, MoveHorizontal, Sparkles, Trophy, Skull
} from 'lucide-react';
import { SECT_LIST, DOJO_SYSTEM_INSTRUCTION, DOJO_SCENARIOS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cooldown definition (seconds)
const SKILL_COOLDOWNS: Record<string, number> = {
  '后跳': 3,
  '小轻功': 3,
  '打断': 12,
  '剑飞': 12,
  '厥阴': 10,
  '聂云': 20,
  '扶摇': 30,
  '解控': 45,
  '献祭': 30,
  '无敌': 300,
  '减伤': 40,
  '泉凝月': 40,
  '春泥': 45,
  '爆发': 60,
  '紫气': 90,
  '乱洒': 90,
  '风车': 90,
  '突': 20,
  '撼如雷': 30
};
const DEFAULT_GCD = 1.5;

// Helper to get icon based on skill name
const getSkillIcon = (name: string) => {
  if (name.includes('打断') || name.includes('剑飞') || name.includes('厥阴')) return OctagonAlert;
  if (name.includes('后跳') || name.includes('小轻功')) return MoveHorizontal;
  if (name.includes('聂云') || name.includes('突')) return Wind;
  if (name.includes('扶摇')) return ArrowUp;
  if (name.includes('解控') || name.includes('献祭')) return Sparkles;
  if (name.includes('爆发') || name.includes('紫气') || name.includes('风车') || name.includes('乱洒')) return Flame;
  if (name.includes('减伤') || name.includes('无敌') || name.includes('山') || name.includes('春泥') || name.includes('泉')) return Shield;
  return Zap;
};

interface DojoMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Types for Local Game
type ThreatType = 'interrupt' | 'dodge' | 'defend' | 'burst';
interface Threat {
  type: ThreatType;
  name: string;
  description: string;
  duration: number; // ms to react
}

const LOCAL_THREATS: Threat[] = [
  // Interrupts (Need to Interrupt)
  { type: 'interrupt', name: '七星拱瑞', description: '气纯读条控制，快打断！', duration: 1500 },
  { type: 'interrupt', name: '兰摧玉折', description: '万花读条上毒，不可不防', duration: 1500 },
  { type: 'interrupt', name: '吞日月', description: '剑纯插旗封轻功，必须打断', duration: 1200 },
  { type: 'interrupt', name: '玳弦急曲', description: '冰心持续封内，打断它', duration: 1500 },
  { type: 'interrupt', name: '恐怖读条', description: 'BOSS释放全屏秒杀技', duration: 1800 },
  
  // Dodges (Need Backstep/Qinggong)
  { type: 'dodge', name: '断魂刺', description: '天策骑马踩过来了！后跳！', duration: 1000 },
  { type: 'dodge', name: '醉月', description: '藏剑贴脸，预判眩晕！', duration: 800 },
  { type: 'dodge', name: '五方行尽', description: '气纯捉影定身，快躲开', duration: 1200 },
  { type: 'dodge', name: '生死劫', description: '明教隐身突进，满魂控制', duration: 900 },
  { type: 'dodge', name: '红圈点名', description: '脚下出现岩浆，快走位！', duration: 1200 },

  // Defends (Need Damage Reduction)
  { type: 'defend', name: '风来吴山', description: '藏剑大风车！伤害爆炸！', duration: 2000 },
  { type: 'defend', name: '追命箭', description: '唐门百里之外读条大招', duration: 1500 },
  { type: 'defend', name: '坚壁清野', description: '霸刀铺地毯，持续高伤', duration: 1500 },
  { type: 'defend', name: '乱洒青荷', description: '万花爆发全开，玉石俱焚', duration: 1200 },
  { type: 'defend', name: '全屏AOE', description: 'BOSS狂暴，准备承伤', duration: 2000 },

  // Bursts (Need to Attack)
  { type: 'burst', name: '免控结束', description: '对方无解控，抓紧输出！', duration: 2500 },
  { type: 'burst', name: '坐忘无我破', description: '气纯蛋壳破了，集火！', duration: 2000 },
  { type: 'burst', name: '虚弱状态', description: 'BOSS护盾破碎，全力爆发', duration: 3000 },
  { type: 'burst', name: '听雷空了', description: '对方技能真空期，反打', duration: 2000 },
];

const DIFFICULTIES = [
  { id: 'easy', name: '新兵 (简单)', speed: 1.5, scoreMult: 1 },
  { id: 'normal', name: '老手 (普通)', speed: 1.0, scoreMult: 2 },
  { id: 'hard', name: '大侠 (困难)', speed: 0.7, scoreMult: 3 },
  { id: 'hell', name: '修罗 (炼狱)', speed: 0.5, scoreMult: 5 },
];

const SkillDojo: React.FC = () => {
  // Mode Selection: 'ai' or 'local'
  const [mode, setMode] = useState<'ai' | 'local'>('ai');

  // Common State
  const [userSect, setUserSect] = useState<string>(SECT_LIST[0]);
  
  // --- AI Mode State ---
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DOJO_SCENARIOS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<DojoMessage[]>([]);
  const [shortcuts, setShortcuts] = useState<string[]>(['后跳', '打断', '聂云', '扶摇', '解控', '爆发']);
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Local Game State ---
  const [localGameState, setLocalGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentThreat, setCurrentThreat] = useState<Threat | null>(null);
  const [gameFeedback, setGameFeedback] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTIES[1]);
  const timerRef = useRef<NodeJS.Timeout>(null);

  // Scroll to bottom for AI chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer loop for AI UI updates
  useEffect(() => {
    let animationFrameId: number;
    const updateTime = () => {
      setNow(Date.now());
      animationFrameId = requestAnimationFrame(updateTime);
    };
    if (isPlaying) {
      updateTime();
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // --- AI Mode Logic ---

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getCooldownDuration = (skillName: string) => {
    for (const [key, duration] of Object.entries(SKILL_COOLDOWNS)) {
      if (skillName.includes(key)) return duration;
    }
    return DEFAULT_GCD;
  };

  const startAiTraining = async () => {
    setIsPlaying(true);
    setLoading(true);
    setMessages([]);
    setCooldowns({});

    try {
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: DOJO_SYSTEM_INSTRUCTION,
        },
      });

      const scenario = DOJO_SCENARIOS.find(s => s.id === selectedScenarioId) || DOJO_SCENARIOS[0];
      
      const startPrompt = `我是${userSect}弟子。请开始模拟训练。
场景设定：${scenario.prompt}
要求：请直接描述第一轮战斗情境（包含对手动作），不要过多的开场白。`;
      
      const result = await chatSessionRef.current.sendMessage({ message: startPrompt });
      
      setMessages([
        { 
          id: 'init', 
          role: 'model', 
          text: result.text || '训练开始...',
          timestamp: getCurrentTime()
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages([{ 
        id: 'err', 
        role: 'model', 
        text: '教官暂时缺席（连接失败），请重试。',
        timestamp: getCurrentTime()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAction = async (actionText?: string) => {
    const textToSend = typeof actionText === 'string' ? actionText : input;
    if (!textToSend.trim() || loading || !chatSessionRef.current) return;

    if (actionText) {
      const readyTime = cooldowns[actionText] || 0;
      if (now < readyTime) return; 
      
      const duration = getCooldownDuration(actionText);
      setCooldowns(prev => ({
        ...prev,
        [actionText]: Date.now() + duration * 1000
      }));
    }

    if (textToSend === input) setInput('');
    setLoading(true);

    const newMessages: DojoMessage[] = [...messages, { 
      id: Date.now().toString(), 
      role: 'user', 
      text: textToSend,
      timestamp: getCurrentTime()
    }];
    setMessages(newMessages);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: textToSend });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text || '...',
        timestamp: getCurrentTime()
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetAiParams = () => {
    setIsPlaying(false);
    setMessages([]);
    setCooldowns({});
    chatSessionRef.current = null;
  };

  // --- Local Game Logic ---

  const startLocalGame = () => {
    setLocalGameState('playing');
    setScore(0);
    setGameFeedback('准备战斗！');
    nextLocalRound(1000);
  };

  const stopLocalGame = () => {
    setLocalGameState('idle');
    setCurrentThreat(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const gameOver = () => {
    setLocalGameState('gameover');
    setGameFeedback('反应过慢，挑战失败！');
    if (score > highScore) setHighScore(score);
    setCurrentThreat(null);
  };

  const nextLocalRound = (delay: number) => {
    setCurrentThreat(null);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Pick random threat
      const threat = LOCAL_THREATS[Math.floor(Math.random() * LOCAL_THREATS.length)];
      // Speed up calculation: Base speed * Difficulty modifier * Progressive speed
      const progressiveMult = Math.max(0.6, 1 - score * 0.02);
      const actualDuration = threat.duration * selectedDifficulty.speed * progressiveMult;

      setCurrentThreat(threat);
      
      // Set fail timer
      timerRef.current = setTimeout(() => {
        gameOver();
      }, actualDuration);

    }, delay);
  };

  const handleLocalAction = (actionType: ThreatType) => {
    if (localGameState !== 'playing' || !currentThreat) return;

    if (actionType === currentThreat.type) {
      // Success
      const newScore = score + (1 * selectedDifficulty.scoreMult);
      setScore(newScore);
      setGameFeedback(`完美应对！(+${selectedDifficulty.scoreMult})`);
      // Clear fail timer
      if (timerRef.current) clearTimeout(timerRef.current);
      // Next round
      nextLocalRound(800);
    } else {
      // Wrong skill
      gameOver();
      setGameFeedback(`操作失误！被${currentThreat.name}击败。`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[750px] flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-serif font-bold text-jx3-ink mb-2 flex items-center justify-center gap-3">
          <Swords className="w-8 h-8 text-jx3-red" />
          演武场
        </h2>
        <div className="flex justify-center gap-4 text-sm font-medium">
          <button 
            onClick={() => setMode('ai')}
            className={`px-4 py-1 rounded-full transition-colors flex items-center gap-2 ${mode === 'ai' ? 'bg-jx3-ink text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Bot className="w-4 h-4" />
            AI 实战模拟
          </button>
          <button 
            onClick={() => setMode('local')}
            className={`px-4 py-1 rounded-full transition-colors flex items-center gap-2 ${mode === 'local' ? 'bg-jx3-ink text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Gamepad2 className="w-4 h-4" />
            DBM 反应训练
          </button>
        </div>
      </div>

      {mode === 'ai' && (
        !isPlaying ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-stone-200 p-8">
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-2">
                <Shield className="w-16 h-16 text-jx3-ink mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800">准备开始训练</h3>
                <p className="text-gray-500">AI教官将模拟真实战斗情境（如天策踩、气纯八卦、BOSS读条），请你做出正确的应对。</p>
              </div>

              <div className="space-y-4 bg-stone-50 p-6 rounded-lg border border-stone-200">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">选择你的心法/门派</label>
                  <select 
                    value={userSect}
                    onChange={(e) => setUserSect(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jx3-red focus:outline-none bg-white text-gray-900"
                  >
                    {SECT_LIST.map(sect => (
                      <option key={sect} value={sect} className="text-gray-900">{sect}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                     <Target className="w-4 h-4" />
                     选择训练课题 (对手/场景)
                  </label>
                  <select 
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jx3-red focus:outline-none bg-white text-gray-900"
                  >
                    {DOJO_SCENARIOS.map(scenario => (
                      <option key={scenario.id} value={scenario.id} className="text-gray-900">{scenario.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={startAiTraining}
                disabled={loading}
                className="w-full py-4 bg-jx3-red text-white rounded-xl font-bold text-lg hover:bg-red-900 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? '正在准备场地...' : (
                  <>
                    <Play className="w-5 h-5" />
                    开始演练
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            {/* AI Mode Header */}
            <div className="bg-stone-100 p-4 flex justify-between items-center border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-jx3-ink bg-white px-3 py-1 rounded-full text-sm border border-stone-300 shadow-sm">
                  我方: {userSect}
                </span>
                <span className="text-gray-400 font-serif italic">vs</span>
                <span className="font-bold text-red-800 bg-red-50 px-3 py-1 rounded-full text-sm border border-red-100 shadow-sm">
                   {DOJO_SCENARIOS.find(s => s.id === selectedScenarioId)?.name.split(' ')[0] || 'AI教官'}
                </span>
              </div>
              <button 
                onClick={resetAiParams}
                className="text-gray-500 hover:text-jx3-red flex items-center gap-1 text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                结束训练
              </button>
            </div>

            {/* Combat Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]" ref={scrollRef}>
              {messages.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-20">等待教官指令...</div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                    <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                        msg.role === 'user' ? 'bg-jx3-ink text-white' : 'bg-red-800 text-white'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {msg.role === 'user' ? '玩家应对' : '战场情境'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.timestamp}
                      </span>
                    </div>
                    
                    <div className={`p-4 rounded-xl shadow-sm border ${
                      msg.role === 'user'
                        ? 'bg-white border-gray-200 text-gray-800'
                        : 'bg-red-50 border-red-100 text-jx3-ink'
                    }`}>
                      <div className="prose prose-sm max-w-none prose-p:my-1">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                    <Zap className="w-4 h-4 text-jx3-red" />
                    <span className="text-gray-500 text-sm">对方正在出招...</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Control Area */}
            <div className="p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {/* Shortcut Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2 px-1">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">快捷指令 (CD中无法使用)</span>
                   <button 
                     onClick={() => setIsEditingShortcuts(!isEditingShortcuts)} 
                     className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors ${
                        isEditingShortcuts ? 'bg-jx3-ink text-white' : 'text-gray-400 hover:text-jx3-ink bg-stone-100'
                     }`}
                     title="编辑快捷键"
                   >
                      {isEditingShortcuts ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>完成</span>
                        </>
                      ) : (
                        <>
                          <Settings className="w-3 h-3" />
                          <span>自定义</span>
                        </>
                      )}
                   </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {shortcuts.map((sc, idx) => {
                        const readyTime = cooldowns[sc] || 0;
                        const remainingMs = Math.max(0, readyTime - now);
                        const totalDurationMs = getCooldownDuration(sc) * 1000;
                        const isCd = remainingMs > 0;
                        const Icon = getSkillIcon(sc);
                        
                        return isEditingShortcuts ? (
                            <input 
                                key={idx} 
                                value={sc} 
                                onChange={(e) => {
                                    const newSc = [...shortcuts];
                                    newSc[idx] = e.target.value;
                                    setShortcuts(newSc);
                                }}
                                className="w-full text-center text-xs py-2.5 border border-jx3-gold/50 rounded bg-stone-50 focus:outline-none focus:ring-1 focus:ring-jx3-red text-jx3-ink"
                            />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => handleAiAction(sc)}
                                disabled={loading || isCd}
                                className={`relative overflow-hidden text-xs font-bold py-2.5 px-1 rounded-lg transition-colors truncate border shadow-sm flex flex-col items-center gap-1 ${
                                  isCd 
                                    ? 'bg-stone-200 text-gray-400 border-stone-300 cursor-not-allowed'
                                    : 'bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-jx3-ink border-stone-200 hover:shadow active:shadow-none'
                                }`}
                                title={sc}
                            >
                                {isCd && (
                                  <>
                                    <div 
                                      className="absolute bottom-0 left-0 right-0 bg-black/10 transition-[height] duration-100 ease-linear pointer-events-none"
                                      style={{ height: `${(remainingMs / totalDurationMs) * 100}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-gray-600 z-10 font-mono text-lg font-black bg-white/50">
                                      {(remainingMs / 1000).toFixed(1)}
                                    </span>
                                  </>
                                )}
                                <Icon className={`w-5 h-5 ${isCd ? 'opacity-20' : 'text-jx3-ink'}`} />
                                <span className={isCd ? 'opacity-20' : ''}>{sc}</span>
                            </button>
                        );
                    })}
                </div>
              </div>

              {/* Text Input */}
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiAction()}
                  placeholder="输入操作..."
                  className="w-full pl-4 pr-20 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-jx3-red focus:outline-none shadow-sm text-lg text-gray-900"
                />
                <button
                  onClick={() => handleAiAction()}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-jx3-ink text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  出手
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {mode === 'local' && (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
           {localGameState === 'idle' && (
             <div className="absolute inset-0 z-10 bg-white/90 flex flex-col items-center justify-center p-8 text-center">
                <Gamepad2 className="w-20 h-20 text-jx3-ink mb-4" />
                <h3 className="text-2xl font-bold mb-2">DBM 反应训练</h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  无需AI，纯粹的速度挑战。<br/>
                  应对【七星】、【风车】、【断魂刺】等技能，快速做出正确反应。
                </p>
                
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-500 mb-2">难度选择</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(diff => (
                      <button
                        key={diff.id}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                          selectedDifficulty.id === diff.id 
                            ? 'bg-jx3-ink text-white border-jx3-ink' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {diff.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 text-xs text-gray-400">
                   最高连击: <span className="font-bold text-jx3-red">{highScore}</span>
                </div>

                <button 
                  onClick={startLocalGame}
                  className="px-8 py-3 bg-jx3-red text-white text-xl font-bold rounded-xl hover:bg-red-900 transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  开始挑战
                </button>
             </div>
           )}

           {localGameState === 'gameover' && (
             <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-8 text-center text-white animate-fade-in">
                <Skull className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-4xl font-bold mb-2 text-red-500">挑战结束</h3>
                <p className="text-2xl mb-2">{score} 分</p>
                <p className="text-gray-400 text-sm mb-8">({selectedDifficulty.name})</p>
                <p className="text-gray-300 mb-8 max-w-sm">{gameFeedback}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={startLocalGame}
                    className="px-6 py-2 bg-jx3-red rounded-lg font-bold hover:bg-red-700"
                  >
                    再来一次
                  </button>
                  <button 
                    onClick={stopLocalGame}
                    className="px-6 py-2 bg-stone-700 rounded-lg font-bold hover:bg-stone-600"
                  >
                    返回
                  </button>
                </div>
             </div>
           )}

           {/* Game Display Area */}
           <div className="flex-1 bg-stone-900 relative flex flex-col items-center justify-center p-4">
              <div className="absolute top-4 right-4 flex items-center gap-2 text-white font-mono text-xl">
                 <Trophy className="w-5 h-5 text-yellow-500" />
                 {score}
              </div>

              {currentThreat ? (
                <div className="animate-bounce-short text-center">
                   {/* Visual Indicator based on threat type */}
                   <div className={`w-40 h-40 rounded-full mx-auto mb-6 flex items-center justify-center border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-colors duration-300 ${
                     currentThreat.type === 'interrupt' ? 'border-yellow-400 bg-yellow-900/50 text-yellow-400' :
                     currentThreat.type === 'dodge' ? 'border-red-500 bg-red-900/50 text-red-500' :
                     currentThreat.type === 'defend' ? 'border-purple-500 bg-purple-900/50 text-purple-500' :
                     'border-green-500 bg-green-900/50 text-green-500'
                   }`}>
                      {currentThreat.type === 'interrupt' && <OctagonAlert className="w-20 h-20 animate-pulse" />}
                      {currentThreat.type === 'dodge' && <MoveHorizontal className="w-20 h-20 animate-pulse" />}
                      {currentThreat.type === 'defend' && <Shield className="w-20 h-20 animate-pulse" />}
                      {currentThreat.type === 'burst' && <Flame className="w-20 h-20 animate-pulse" />}
                   </div>
                   
                   <h2 className="text-3xl font-bold text-white mb-2">{currentThreat.name}</h2>
                   <p className="text-gray-300 text-lg mb-4">{currentThreat.description}</p>
                   
                   {/* Countdown Bar */}
                   <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
                      <div 
                        className="h-full bg-white animate-shrink"
                        style={{ animationDuration: `${currentThreat.duration * selectedDifficulty.speed * (Math.max(0.6, 1 - score * 0.02))}ms` }}
                      />
                   </div>
                </div>
              ) : (
                <div className="text-gray-500 font-mono">等待技能...</div>
              )}
              
              <div className="mt-8 h-8 text-green-400 font-bold">{localGameState === 'playing' && gameFeedback}</div>
           </div>

           {/* Game Controls */}
           <div className="bg-stone-800 p-4 border-t border-stone-700">
             <div className="grid grid-cols-4 gap-4 h-24">
               <button 
                 onClick={() => handleLocalAction('interrupt')}
                 className={`bg-yellow-900/80 border-2 border-yellow-600 hover:bg-yellow-800 text-yellow-100 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                   currentThreat?.type === 'interrupt' ? 'ring-4 ring-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''
                 }`}
               >
                 <OctagonAlert className="w-8 h-8" />
                 <span className="font-bold text-xs md:text-base">打断/剑飞</span>
               </button>
               <button 
                 onClick={() => handleLocalAction('dodge')}
                 className={`bg-red-900/80 border-2 border-red-600 hover:bg-red-800 text-red-100 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                    currentThreat?.type === 'dodge' ? 'ring-4 ring-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : ''
                 }`}
               >
                 <MoveHorizontal className="w-8 h-8" />
                 <span className="font-bold text-xs md:text-base">后跳/小轻功</span>
               </button>
               <button 
                 onClick={() => handleLocalAction('defend')}
                 className={`bg-purple-900/80 border-2 border-purple-600 hover:bg-purple-800 text-purple-100 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                    currentThreat?.type === 'defend' ? 'ring-4 ring-purple-500 scale-105 shadow-[0_0_20px_rgba(168,85,247,0.6)]' : ''
                 }`}
               >
                 <Shield className="w-8 h-8" />
                 <span className="font-bold text-xs md:text-base">减伤/御</span>
               </button>
               <button 
                 onClick={() => handleLocalAction('burst')}
                 className={`bg-green-900/80 border-2 border-green-600 hover:bg-green-800 text-green-100 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                    currentThreat?.type === 'burst' ? 'ring-4 ring-green-500 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''
                 }`}
               >
                 <Flame className="w-8 h-8" />
                 <span className="font-bold text-xs md:text-base">爆发/紫气</span>
               </button>
             </div>
             <p className="text-center text-gray-500 text-xs mt-2">点击发光按钮应对敌方招式</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default SkillDojo;