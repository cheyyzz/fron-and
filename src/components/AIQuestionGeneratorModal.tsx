import React, { useState } from 'react';
import { X, Bot, Sparkles, CheckCircle2, AlertCircle, Play, Plus, RefreshCw, Code } from 'lucide-react';
import { generateQuestionsWithLLM } from '../services/llmService';
import { saveCustomQuestion } from '../firebase/quizService';
import { Question } from '../types/quiz';
import { sound } from '../utils/sound';

interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsGenerated: (questions: Question[]) => void;
}

export const AIQuestionGeneratorModal: React.FC<AIQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onQuestionsGenerated
}) => {
  const [topic, setTopic] = useState('React 19 & TypeScript Modern');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [count, setCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedList, setGeneratedList] = useState<Question[]>([]);

  if (!isOpen) return null;

  const quickTopics = [
    'React 19 & Server Components',
    'TypeScript Generics & Utility Types',
    'CSS Grid vs Flexbox Layouts',
    'JavaScript Async/Await & Event Loop',
    'Web Performance & Core Web Vitals',
    'REST API & Fetch Best Practices'
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Harap masukkan topik kuis yang ingin digenerate oleh AI.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setGeneratedList([]);

    try {
      const questions = await generateQuestionsWithLLM(topic.trim(), count, difficulty);
      setGeneratedList(questions);
      sound.playCorrect();
    } catch (err: any) {
      sound.playWrong();
      setErrorMsg(`Gagal menghasilkan soal: ${err.message || 'Error komunikasi LLM'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToBank = async () => {
    if (generatedList.length === 0) return;

    sound.playClick();
    for (const q of generatedList) {
      await saveCustomQuestion(q);
    }

    onQuestionsGenerated(generatedList);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="cat-icon-box" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              <Bot size={22} />
            </div>
            <div>
              <h2 className="modal-title flex items-center gap-2">
                AI Question Generator <span className="hero-badge" style={{ margin: 0, padding: '2px 8px', fontSize: '0.7rem' }}>LLM Powered</span>
              </h2>
              <p className="text-xs text-slate-400">
                Buat bank soal kuis otomatis menggunakan Large Language Model (Google Gemini AI)
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-4">
          {errorMsg && (
            <div className="alert-banner error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="form-group">
              <label className="text-sm font-semibold text-slate-200">
                Topik Kuis Front-End:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: React 19 Hooks, TypeScript Advanced, CSS Architecture..."
                className="form-input"
                required
              />
            </div>

            {/* Quick Topic Chips */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Saran Topik Cepat:</label>
              <div className="flex flex-wrap gap-1.5">
                {quickTopics.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTopic(t)}
                    className="chip-btn"
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-sm font-semibold text-slate-200">Tingkat Kesulitan:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="form-select"
                >
                  <option value="Beginner">Beginner (Pemula)</option>
                  <option value="Intermediate">Intermediate (Menengah)</option>
                  <option value="Advanced">Advanced (Mahir / Arsitek)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-sm font-semibold text-slate-200">Jumlah Soal:</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={1}>1 Soal Kilat</option>
                  <option value={3}>3 Soal (Rekomendasi)</option>
                  <option value={5}>5 Soal Lengkap</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-start-quiz"
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Sedang Berpikir & Mengenerate Soal dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Soal dengan LLM</span>
                </>
              )}
            </button>
          </form>

          {/* Results Preview */}
          {generatedList.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Berhasil Menghasilkan {generatedList.length} Soal AI
                </h3>
              </div>

              <div className="space-y-3">
                {generatedList.map((q, idx) => (
                  <div key={q.id} className="review-item correct" style={{ borderLeftColor: '#6366f1' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="question-badge">Soal #{idx + 1}</span>
                      <span className={`difficulty-badge ${q.difficulty.toLowerCase()}`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-100 text-sm mb-2">{q.question}</p>

                    {q.code && (
                      <pre className="code-content text-xs p-2 mb-2 rounded bg-slate-950">
                        <code>{q.code}</code>
                      </pre>
                    )}

                    <div className="space-y-1 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="text-xs p-1.5 rounded flex items-center gap-2"
                          style={{
                            background: oIdx === q.correctIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 22, 38, 0.6)',
                            color: oIdx === q.correctIndex ? '#34d399' : '#94a3b8',
                            border: oIdx === q.correctIndex ? '1px solid #10b981' : '1px solid transparent'
                          }}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                          {oIdx === q.correctIndex && <span className="ml-auto font-bold">(Kunci Benar)</span>}
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-indigo-300 italic">
                      💡 {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {generatedList.length > 0 ? (
            <>
              <button className="btn-secondary" onClick={() => setGeneratedList([])}>
                Bersihkan
              </button>
              <button className="btn-primary" onClick={handleSaveToBank}>
                <Plus size={16} />
                <span>Simpan ke Bank Soal & Mainkan</span>
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                Didukung arsitektur LLM Google Gemini & Intelligent Fallback.
              </p>
              <button className="btn-outline" onClick={onClose}>
                Tutup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
