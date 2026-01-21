import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { SectName, SectAnalysis } from '../types';
import { SECT_LIST } from '../constants';
import { analyzeSect } from '../services/geminiService';
import { Sparkles, ScrollText, RefreshCw } from 'lucide-react';

const SectAnalyzer: React.FC = () => {
  const [selectedSect, setSelectedSect] = useState<string>(SECT_LIST[0]);
  const [data, setData] = useState<SectAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (sect: string) => {
    setLoading(true);
    const result = await analyzeSect(sect);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(selectedSect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSect]);

  const chartData = data ? [
    { subject: '攻击 (ATK)', A: data.stats.attack, fullMark: 100 },
    { subject: '防御 (DEF)', A: data.stats.defense, fullMark: 100 },
    { subject: '辅助 (SUP)', A: data.stats.support, fullMark: 100 },
    { subject: '机动 (MOB)', A: data.stats.mobility, fullMark: 100 },
    { subject: '上手难度 (DIFF)', A: data.stats.difficulty, fullMark: 100 },
  ] : [];

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-serif font-bold text-jx3-ink mb-2">门派风云录</h2>
        <p className="text-gray-600">选择门派，查看AI分析的综合能力值</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {SECT_LIST.map((sect) => (
          <button
            key={sect}
            onClick={() => setSelectedSect(sect)}
            disabled={loading && selectedSect === sect}
            className={`px-4 py-2 rounded-full border transition-all duration-300 ${
              selectedSect === sect
                ? 'bg-jx3-red text-white border-jx3-red shadow-lg transform scale-105'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {sect}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 h-[400px] flex flex-col relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-jx3-red animate-spin" />
            </div>
          )}
          <h3 className="text-lg font-bold text-center text-gray-700 mb-4">{selectedSect} - 五维图</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={selectedSect}
                dataKey="A"
                stroke="#8B0000"
                fill="#8B0000"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 min-h-[400px] relative">
           {loading ? (
             <div className="h-full flex flex-col gap-4 animate-pulse">
               <div className="h-8 bg-gray-200 rounded w-1/3"></div>
               <div className="h-4 bg-gray-200 rounded w-full"></div>
               <div className="h-4 bg-gray-200 rounded w-full"></div>
               <div className="h-4 bg-gray-200 rounded w-2/3"></div>
             </div>
           ) : data ? (
             <>
               <div className="flex items-center gap-2 mb-4 border-b pb-2 border-stone-100">
                 <ScrollText className="w-6 h-6 text-jx3-gold" />
                 <h3 className="text-2xl font-serif font-bold text-jx3-ink">{data.name}</h3>
               </div>
               
               {data.poem && (
                 <div className="mb-6 pl-4 border-l-4 border-jx3-red italic text-gray-600 bg-stone-50 py-2 rounded-r-md">
                   "{data.poem}"
                 </div>
               )}

               <div className="prose prose-stone max-w-none text-gray-700 leading-relaxed">
                 <p>{data.description}</p>
               </div>

               <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className="bg-stone-50 p-3 rounded text-center">
                    <span className="block text-xs text-gray-500 uppercase tracking-wider">定位</span>
                    <span className="font-bold text-jx3-ink">
                      {data.stats.support > 70 ? '辅助/治疗' : data.stats.defense > 70 ? '防御/坦克' : '输出/伤害'}
                    </span>
                 </div>
                 <div className="bg-stone-50 p-3 rounded text-center">
                    <span className="block text-xs text-gray-500 uppercase tracking-wider">上手难度</span>
                    <span className={`font-bold ${data.stats.difficulty > 70 ? 'text-red-600' : 'text-green-600'}`}>
                      {data.stats.difficulty > 70 ? '困难' : data.stats.difficulty > 40 ? '中等' : '简单'}
                    </span>
                 </div>
               </div>
             </>
           ) : (
             <div className="flex items-center justify-center h-full text-gray-400">
               请选择门派查看详情
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SectAnalyzer;
