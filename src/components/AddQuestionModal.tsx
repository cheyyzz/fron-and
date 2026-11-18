import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveCustomQuestion } from '../firebase/quizService';
import { FRONTEND_CATEGORIES } from '../data/frontendQuestions';
import { sound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionAdded: () => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ isOpen, onClose, onQuestionAdded }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>('react');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [question, setQuestion] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');
  const [author, setAuthor] = useState<string>(() => user?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (user?.displayName && !author) {
      setAuthor(user.displayName);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setStatusMessage({ type: 'error', text: 'Teks pertanyaan wajib diisi!' });
      return;
    }

    const emptyOption = options.some(opt => !opt.trim());
    if (emptyOption) {
      setStatusMessage({ type: 'error', text: 'Semua 4 pilihan jawaban harus diisi!' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const result = await saveCustomQuestion({
        category,
        difficulty,
        question: question.trim(),
        code: code.trim() || null,
        options: options.map(o => o.trim()),
        correctIndex: Number(correctIndex),
        explanation: explanation.trim(),
        author: author.trim() || 'Contributor'
      });

      sound.playCorrect();
      setStatusMessage({
        type: 'success',
        text: result.syncedToFirebase
          ? 'Soal berhasil disimpan ke Firebase Cloud & Database lokal!'
          : 'Soal berhasil disimpan ke penyimpanan lokal!'
      });

      setTimeout(() => {
        onQuestionAdded();
        // Reset form
        setQuestion('');
        setCode('');
        setOptions(['', '', '', '']);
        setExplanation('');
        onClose();
      }, 1200);
    } catch (err: any) {
      sound.playWrong();
      setStatusMessage({ type: 'error', text: 'Gagal menyimpan soal: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <PlusCircle className="text-emerald-400" size={22} />
            <h2 className="modal-title">Tambah Soal Kuis Front-End</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4">
          {statusMessage && (
            <div className={`alert-banner ${statusMessage.type}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label>Kategori Materi</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
              >
                {FRONTEND_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tingkat Kesulitan</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="form-select"
              >
                <option value="Beginner">Beginner (Pemula)</option>
                <option value="Intermediate">Intermediate (Menengah)</option>
                <option value="Advanced">Advanced (Mahir)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Teks Pertanyaan</label>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Tuliskan pertanyaan kuis di sini..."
              className="form-textarea"
              required
            />
          </div>

          <div className="form-group">
            <label>Snippet Kode (Opsional)</label>
            <textarea
              rows={3}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: const [val, setVal] = useState(0);"
              className="form-textarea font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Pilihan Jawaban (Pilih radio untuk jawaban yang benar):
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctIndex === idx}
                  onChange={() => setCorrectIndex(idx)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  title="Tandai sebagai jawaban yang benar"
                />
                <span className="font-mono text-xs w-6 font-bold text-slate-400">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Teks pilihan jawaban ${String.fromCharCode(65 + idx)}...`}
                  className={`form-input flex-1 ${correctIndex === idx ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}
                  required
                />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Pembahasan & Penjelasan Konsep</label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Jelaskan mengapa jawaban tersebut benar..."
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label>Nama Pembuat Soal (Kontributor)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nama Anda atau alias developer..."
              className="form-input"
            />
          </div>

          <div className="modal-footer -mx-6 -mb-6 mt-6">
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pertanyaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
