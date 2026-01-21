import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import SectAnalyzer from './components/SectAnalyzer';
import ImageGenerator from './components/ImageGenerator';
import QiYuFinder from './components/QiYuFinder';
import SkillDojo from './components/SkillDojo';
import { ScrollText, MessageSquare, Palette, Sword, Compass, Swords } from 'lucide-react';

enum Tab {
  Chat = 'chat',
  Sect = 'sect',
  Image = 'image',
  QiYu = 'qiyu',
  Dojo = 'dojo'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Chat);

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Header */}
      <header className="bg-jx3-ink text-white py-8 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/chinese-style.png')]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sword className="w-8 h-8 text-jx3-gold transform -rotate-45" />
            <h1 className="text-4xl font-serif font-bold tracking-wide">剑网三助手</h1>
            <Sword className="w-8 h-8 text-jx3-gold transform rotate-45" />
          </div>
          <p className="text-gray-300 font-light tracking-wider text-sm md:text-base">
            一剑霜寒十四州 · 洗九月伴你闯江湖
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm mb-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-2 md:space-x-4 flex-wrap">
            <NavButton 
              active={activeTab === Tab.Chat} 
              onClick={() => setActiveTab(Tab.Chat)}
              icon={<MessageSquare className="w-5 h-5" />}
              label="江湖百晓"
            />
            <NavButton 
              active={activeTab === Tab.Sect} 
              onClick={() => setActiveTab(Tab.Sect)}
              icon={<ScrollText className="w-5 h-5" />}
              label="门派风云"
            />
            <NavButton 
              active={activeTab === Tab.Dojo} 
              onClick={() => setActiveTab(Tab.Dojo)}
              icon={<Swords className="w-5 h-5" />}
              label="演武场"
            />
            <NavButton 
              active={activeTab === Tab.QiYu} 
              onClick={() => setActiveTab(Tab.QiYu)}
              icon={<Compass className="w-5 h-5" />}
              label="奇遇天书"
            />
            <NavButton 
              active={activeTab === Tab.Image} 
              onClick={() => setActiveTab(Tab.Image)}
              icon={<Palette className="w-5 h-5" />}
              label="云裳绘影"
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4">
        {activeTab === Tab.Chat && (
          <div className="animate-fade-in">
            <ChatInterface />
          </div>
        )}
        {activeTab === Tab.Sect && (
          <div className="animate-fade-in">
            <SectAnalyzer />
          </div>
        )}
        {activeTab === Tab.QiYu && (
          <div className="animate-fade-in">
            <QiYuFinder />
          </div>
        )}
        {activeTab === Tab.Dojo && (
          <div className="animate-fade-in">
            <SkillDojo />
          </div>
        )}
        {activeTab === Tab.Image && (
          <div className="animate-fade-in">
            <ImageGenerator />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm mt-12">
        <p>Powered by Google Gemini API</p>
        <p className="mt-1">此应用为第三方同人作品，与剑网三官方无关</p>
      </footer>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-3 border-b-2 transition-colors font-medium text-sm md:text-base ${
      active
        ? 'border-jx3-red text-jx3-red'
        : 'border-transparent text-gray-500 hover:text-jx3-ink hover:border-gray-300'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;