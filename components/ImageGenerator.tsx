import React, { useState } from 'react';
import { generateCharacterImage } from '../services/geminiService';
import { Sparkles, Download, Image as ImageIcon, Loader2 } from 'lucide-react';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setImage(null);
    
    const result = await generateCharacterImage(prompt);
    
    setImage(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-jx3-ink mb-2">云裳绘影</h2>
        <p className="text-gray-600">描述你心中的侠客形象，AI为你绘制丹青</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              外貌描述
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一位身穿白衣的纯阳女弟子，背负长剑，站在雪山之巅，仙气飘飘..."
              className="w-full h-40 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jx3-ink focus:border-transparent resize-none bg-stone-50 text-gray-900"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-4 bg-jx3-ink text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all font-bold flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在泼墨挥毫...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-jx3-gold" />
                生成绘卷
              </>
            )}
          </button>
          
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
             <strong>提示:</strong> 描述越具体（包含门派、服饰颜色、环境、动作），生成的效果越符合剑网三的风格。
          </div>
        </div>

        {/* Display */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 min-h-[400px] flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          {image ? (
            <div className="relative w-full h-full group">
              <img 
                src={image} 
                alt="Generated Character" 
                className="w-full h-auto rounded-lg shadow-md object-contain max-h-[500px]"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={image} 
                  download="jx3-character.png"
                  className="bg-white/90 p-2 rounded-full shadow hover:bg-white text-gray-800 block"
                  title="下载图片"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                 <ImageIcon className="w-8 h-8 opacity-50" />
              </div>
              <p>暂无画卷，请在左侧输入描述</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;