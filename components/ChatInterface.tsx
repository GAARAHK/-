import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Search, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '侠士好！在下通晓剑网三江湖之事。无论是副本机制、剧情背景还是奇遇攻略，尽管发问。',
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const responseText = await sendChatMessage(history, userMsg.text, useSearch);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="bg-jx3-ink p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-jx3-gold" />
          <h2 className="font-serif font-bold text-lg">江湖百晓生</h2>
        </div>
        <button
          onClick={() => setUseSearch(!useSearch)}
          className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border transition-colors ${
            useSearch ? 'bg-jx3-gold text-jx3-ink border-jx3-gold' : 'bg-transparent text-gray-300 border-gray-500 hover:border-gray-300'
          }`}
          title="启用联网搜索以获取最新资讯"
        >
          <Search className="w-4 h-4" />
          {useSearch ? '联网模式: 开启' : '联网模式: 关闭'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user'
                ? 'bg-jx3-ink text-white rounded-tr-none'
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                <span>{msg.role === 'user' ? '侠士' : '百晓生'}</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-jx3-red" />
              <span className="text-gray-500 text-sm">正在查阅典籍...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-stone-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="询问关于剑网三的问题... (例如: 这一赛季哪个奶妈比较强?)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-jx3-ink focus:border-transparent bg-stone-50 text-gray-900"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-jx3-red text-white rounded-xl hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;