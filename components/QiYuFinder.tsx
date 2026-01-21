import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, MapPin, Loader2, Compass } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { POPULAR_QIYUS } from '../constants';

interface SimpleMessage {
  role: 'user' | 'model';
  text: string;
}

const QiYuFinder: React.FC = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async (searchTerm: string, displayQuery?: string) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    // If it's a new topic (not a follow-up), we might want to reset history or keep context?
    // For a "Finder", usually each search is fresh, but follow-ups are nice.
    // To keep it simple and distinct from ChatInterface, we will treat this as "One Query + Result" 
    // but append to local history to show the 'thread' of the current session.
    
    // However, to ensure best results for specific lookups, we construct the prompt specifically.
    const isFollowUp = history.length > 0;
    const finalPrompt = isFollowUp 
      ? searchTerm 
      : `查询剑网三奇遇攻略：${searchTerm}。请提供触发条件、前置任务和简要流程。`;

    // Construct API history format
    const apiHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    try {
      // Force useSearch = true for Qi Yu as it requires up-to-date data
      const responseText = await sendChatMessage(apiHistory, finalPrompt, true);

      const newHistory: SimpleMessage[] = [
        ...history,
        { role: 'user', text: displayQuery || searchTerm },
        { role: 'model', text: responseText }
      ];
      setHistory(newHistory);
      setQuery(''); // Clear input after search
    } catch (err) {
      setError("查询失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    executeSearch(query);
  };

  const handleQuickTag = (tag: string) => {
    // Reset history for a fresh quick tag search to avoid context pollution
    setHistory([]);
    executeSearch(tag, `查询奇遇：${tag}`);
  };

  const handleDailyLuck = () => {
    setHistory([]);
    executeSearch("请随机推荐一个剑网三的绝世或者普通奇遇，并告诉我它的名字、触发方式和玄学地点。语气要像算命先生一样神秘。", "🔮 今日机缘运势");
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[700px]">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif font-bold text-jx3-ink mb-2 flex items-center justify-center gap-3">
          <Compass className="w-8 h-8 text-jx3-gold animate-pulse" />
          奇遇天书
        </h2>
        <p className="text-gray-600">联网探寻江湖机缘，攻略资讯实时掌握</p>
      </div>

      {/* Search Bar Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-6">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="输入奇遇名称 (如: 阴阳两界) 或 相关问题..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-jx3-ink focus:outline-none bg-stone-50 text-gray-900"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={handleManualSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-jx3-ink text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            查询
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleDailyLuck}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-jx3-gold/10 text-jx3-ink rounded-lg border border-jx3-gold/30 hover:bg-jx3-gold/20 text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4 text-jx3-gold" />
            <span>今日运势</span>
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2"></div>
          <span className="text-xs text-gray-400 mr-1">热门奇遇:</span>
          {POPULAR_QIYUS.map(tag => (
            <button
              key={tag}
              onClick={() => handleQuickTag(tag)}
              disabled={loading}
              className="px-3 py-1 bg-stone-100 text-gray-600 rounded-full text-sm hover:bg-stone-200 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results / History Area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-stone-200 p-6 scroll-smooth">
        {history.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
            <BookOpen className="w-16 h-16 mb-4 text-stone-300" />
            <p>请在上方输入奇遇名称查询攻略</p>
          </div>
        ) : (
          <div className="space-y-8">
            {history.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl p-5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-stone-100 text-gray-800 rounded-tr-none'
                    : 'bg-jx3-paper text-jx3-ink border border-stone-200 rounded-tl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-black/5 opacity-70 text-xs font-bold uppercase tracking-wider">
                    {msg.role === 'user' ? (
                      <>
                        <span>侠士查询</span>
                        <Search className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>天书攻略</span>
                      </>
                    )}
                  </div>
                  <div className="prose prose-stone max-w-none prose-p:leading-relaxed prose-headings:text-jx3-red">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start mt-4">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-jx3-red" />
              <span className="text-gray-500 text-sm">正在检索江湖传闻...</span>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-center text-sm">
                {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default QiYuFinder;