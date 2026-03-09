/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, Leaf, AlertTriangle, CheckCircle2, Info, Loader2, History, Trash2, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzePlantImage, PlantAnalysis, generateHealthyPlantImage } from './services/gemini';

interface ScanHistoryItem extends PlantAnalysis {
  id: string;
  timestamp: number;
  image: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PlantAnalysis | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    const saved = localStorage.getItem('plant_scan_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [genPlantName, setGenPlantName] = useState('');
  const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [genRatio, setGenRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzePlantImage(image);
      setResult(analysis);
      
      const newHistoryItem: ScanHistoryItem = {
        ...analysis,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        image: image
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('plant_scan_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("عذراً، فشل تحليل الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('plant_scan_history', JSON.stringify(updated));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'diseased': return 'text-red-600 bg-red-50 border-red-200';
      case 'pest_infestation': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'nutrient_deficiency': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'سليم';
      case 'diseased': return 'مصاب بمرض';
      case 'pest_infestation': return 'إصابة حشرية';
      case 'nutrient_deficiency': return 'نقص مغذيات';
      default: return 'غير معروف';
    }
  };

  const handleGenerate = async () => {
    if (!genPlantName) return;
    setIsGenerating(true);
    try {
      const img = await generateHealthyPlantImage(genPlantName, genSize, genRatio);
      setGeneratedImage(img);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("فشل توليد الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 arabic-text" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Sprout size={24} />
            </div>
            <h1 className="text-xl font-bold text-stone-800">طبيبي الزراعي</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setShowVisualizer(!showVisualizer);
                setShowHistory(false);
              }}
              className={`p-2 rounded-full transition-colors ${showVisualizer ? 'bg-emerald-100 text-emerald-700' : 'text-stone-600 hover:bg-stone-100'}`}
              title="تخيل نباتاً سليماً"
            >
              <Camera size={24} />
            </button>
            <button 
              onClick={() => {
                setShowHistory(!showHistory);
                setShowVisualizer(false);
              }}
              className={`p-2 rounded-full transition-colors relative ${showHistory ? 'bg-emerald-100 text-emerald-700' : 'text-stone-600 hover:bg-stone-100'}`}
              title="السجل"
            >
              <History size={24} />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showVisualizer ? (
            <motion.div 
              key="visualizer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-800">تخيل نباتاً سليماً</h2>
                <button onClick={() => setShowVisualizer(false)} className="text-emerald-600 font-semibold">العودة</button>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">اسم النبات</label>
                    <input 
                      type="text" 
                      value={genPlantName}
                      onChange={(e) => setGenPlantName(e.target.value)}
                      placeholder="مثال: شجرة زيتون، طماطم..."
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">الحجم</label>
                      <select 
                        value={genSize}
                        onChange={(e) => setGenSize(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none"
                      >
                        <option value="1K">1K (عادي)</option>
                        <option value="2K">2K (عالي)</option>
                        <option value="4K">4K (فائق)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">الأبعاد</label>
                      <select 
                        value={genRatio}
                        onChange={(e) => setGenRatio(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 outline-none"
                      >
                        <option value="1:1">1:1 (مربع)</option>
                        <option value="16:9">16:9 (عريض)</option>
                        <option value="9:16">9:16 (طولي)</option>
                        <option value="4:3">4:3</option>
                        <option value="3:4">3:4</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !genPlantName}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sprout size={20} />}
                    توليد الصورة المرجعية
                  </button>
                </div>

                <div className="bg-stone-50 rounded-2xl aspect-square flex items-center justify-center overflow-hidden border border-stone-100 relative">
                  {generatedImage ? (
                    <img src={generatedImage} alt="Generated plant" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8">
                      <Camera size={48} className="mx-auto text-stone-200 mb-4" />
                      <p className="text-stone-400 text-sm">سيظهر النبات المتخيل هنا للمقارنة</p>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="animate-spin text-emerald-600 mx-auto mb-2" size={32} />
                        <p className="text-emerald-800 font-medium">جاري التخيل...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : !showHistory ? (
            <motion.div 
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Upload Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 text-center">
                {!image ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 rounded-2xl p-12 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="text-stone-400 group-hover:text-emerald-500" size={32} />
                    </div>
                    <h2 className="text-lg font-semibold text-stone-700 mb-2">ارفع صورة للنبات أو الورقة</h2>
                    <p className="text-stone-500 text-sm">التقط صورة واضحة للأجزاء المصابة للحصول على أفضل تشخيص</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative max-w-md mx-auto aspect-square rounded-2xl overflow-hidden shadow-inner bg-stone-100">
                      <img src={image} alt="Uploaded plant" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-sm hover:bg-white"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <button 
                        onClick={startAnalysis}
                        disabled={isAnalyzing}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            جاري التحليل...
                          </>
                        ) : (
                          <>
                            <Leaf size={20} />
                            ابدأ الفحص الذكي
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3 bg-stone-100 text-stone-700 rounded-xl font-semibold hover:bg-stone-200 transition-all"
                      >
                        تغيير الصورة
                      </button>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </section>

              {/* Result Section */}
              {result && (
                <motion.section 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200"
                >
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-100">
                        {result.healthStatus === 'healthy' ? (
                          <CheckCircle2 className="text-emerald-500" size={28} />
                        ) : (
                          <AlertTriangle className="text-amber-500" size={28} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-stone-800">{result.plantName}</h3>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getStatusColor(result.healthStatus)}`}>
                          {getStatusLabel(result.healthStatus)}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-stone-400 uppercase tracking-wider">دقة التشخيص</div>
                      <div className="text-lg font-bold text-emerald-600">{(result.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-stone-800 font-bold">
                          <Info size={20} className="text-emerald-600" />
                          <h4>التشخيص</h4>
                        </div>
                        <p className="text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl">
                          {result.diagnosis}
                        </p>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-bold text-stone-500">الأعراض الملاحظة:</h5>
                          <ul className="grid grid-cols-1 gap-2">
                            {result.symptoms.map((symptom, i) => (
                              <li key={i} className="flex items-center gap-2 text-stone-600 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                {symptom}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                            <CheckCircle2 size={20} />
                            <h4>العلاج والحلول</h4>
                          </div>
                          <p className="text-emerald-700 text-sm leading-relaxed">
                            {result.treatment}
                          </p>
                        </div>

                        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                          <div className="flex items-center gap-2 text-stone-800 font-bold mb-3">
                            <AlertTriangle size={20} className="text-amber-500" />
                            <h4>طرق الوقاية</h4>
                          </div>
                          <p className="text-stone-600 text-sm leading-relaxed">
                            {result.prevention}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800">سجل الفحوصات</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  العودة للفحص
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
                  <History size={48} className="mx-auto text-stone-200 mb-4" />
                  <p className="text-stone-500">لا يوجد سجل فحوصات حتى الآن</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setResult(item);
                        setImage(item.image);
                        setShowHistory(false);
                      }}
                      className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-4 hover:border-emerald-300 transition-all cursor-pointer group"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.plantName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-stone-800">{item.plantName}</h4>
                          <span className="text-xs text-stone-400">
                            {new Date(item.timestamp).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border mt-1 ${getStatusColor(item.healthStatus)}`}>
                          {getStatusLabel(item.healthStatus)}
                        </div>
                        <p className="text-stone-500 text-xs mt-2 line-clamp-1">{item.diagnosis}</p>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-400 text-sm">
        <p>© {new Date().getFullYear()} طبيبي الزراعي - مدعوم بالذكاء الاصطناعي</p>
      </footer>
    </div>
  );
}
