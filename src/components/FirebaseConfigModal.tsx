import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Bot, Key, Sparkles, RefreshCw } from 'lucide-react';
import { getActiveFirebaseConfig } from '../firebase/config';
import { getLLMConfig, saveLLMConfig } from '../services/llmService';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [apiKey, setApiKey] = useState<string>(() => getActiveFirebaseConfig().config?.apiKey || '');
  const [projectId, setProjectId] = useState<string>(() => getActiveFirebaseConfig().config?.projectId || '');
  const [authDomain, setAuthDomain] = useState<string>(() => getActiveFirebaseConfig().config?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState<string>(() => getActiveFirebaseConfig().config?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState<string>(() => getActiveFirebaseConfig().config?.messagingSenderId || '');
  const [appId, setAppId] = useState<string>(() => getActiveFirebaseConfig().config?.appId || '');
  const [jsonInput, setJsonInput] = useState<string>('');

  // LLM Settings state
  const [llmApiKey, setLlmApiKey] = useState<string>(() => getLLMConfig().apiKey || '');
  const [llmModel, setLlmModel] = useState<string>(() => getLLMConfig().model || 'gemini-1.5-flash');
  const [llmProvider, setLlmProvider] = useState<any>(() => getLLMConfig().provider || 'gemini');

  const [statusMsg, setStatusMsg] = useState<{ type: string; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'json' | 'llm' | 'guide'>('llm');

  if (!isOpen) return null;

  const handleJsonPaste = (text: string) => {
    setJsonInput(text);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const cleanJson = match[0]
          .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(cleanJson);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
        if (parsed.appId) setAppId(parsed.appId);
        setStatusMsg({ type: 'success', text: 'Berhasil mengurai JSON Firebase config!' });
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleSaveFirebase = () => {
    if (!apiKey || !projectId) {
      setStatusMsg({ type: 'error', text: 'API Key dan Project ID wajib diisi untuk mengaktifkan Firebase!' });
      return;
    }

    const newConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    localStorage.setItem('frontend_quiz_firebase_config', JSON.stringify(newConfig));
    setStatusMsg({ type: 'success', text: 'Konfigurasi Firebase tersimpan! Halaman memuat ulang koneksi...' });

    setTimeout(() => {
      onConfigUpdated();
      window.location.reload();
    }, 1000);
  };

  const handleSaveLLM = () => {
    saveLLMConfig({
      apiKey: llmApiKey.trim(),
      provider: llmProvider,
      model: llmModel
    });

    setStatusMsg({
      type: 'success',
      text: llmApiKey.trim()
        ? 'Konfigurasi AI LLM Google Gemini tersimpan! Generator & AI Tutor siap digunakan.'
        : 'Mode demo cerdas tersimpan (tanpa API Key).'
    });

    setTimeout(() => {
      setStatusMsg(null);
    }, 2500);
  };

  const handleResetToLocal = () => {
    localStorage.removeItem('frontend_quiz_firebase_config');
    setApiKey('');
    setProjectId('');
    setAuthDomain('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setStatusMsg({ type: 'success', text: 'Kembali ke mode Local Storage bawaan. Halaman dimuat ulang...' });
    setTimeout(() => {
      onConfigUpdated();
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Database className="text-indigo-400" size={22} />
            <h2 className="modal-title">Pengaturan Integrasi & Layanan</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'llm' ? 'active' : ''}`}
            onClick={() => setActiveTab('llm')}
          >
            🤖 AI LLM (Gemini)
          </button>
          <button
            className={`tab-btn ${activeTab === 'fields' ? 'active' : ''}`}
            onClick={() => setActiveTab('fields')}
          >
            🔥 Firebase Form
          </button>
          <button
            className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            📄 Paste Config JSON
          </button>
          <button
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            📖 Panduan Setup
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {statusMsg && (
            <div className={`alert-banner ${statusMsg.type}`}>
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* LLM Tab */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
                <Bot size={22} className="text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-200">
                  Fitur <strong>Large Language Model (LLM)</strong> memungkinkan pembuatan soal kuis otomatis sesuai topik apa pun dan memberikan pembahasan AI mendalam.
                </p>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-1.5">
                  <Key size={14} className="text-indigo-400" />
                  Google Gemini API Key (Opsional):
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... (Kosongkan jika ingin memakai generator cerdas bawaan)"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  className="form-input"
                />
                <p className="help-text">
                  Dapatkan API key gratis di <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Google AI Studio</a>. Jika dikosongkan, aplikasi akan menggunakan AI Simulator bawaan.
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Pilihan Model LLM</label>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="form-select"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Cepat & Responsif)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Generasi Terbaru)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Penalaran Kompleks)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Mode Penyedia</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="gemini">Google Gemini API (Direkomendasikan)</option>
                    <option value="demo-simulated">Simulated AI (Offline Mode)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button type="button" className="btn-primary w-full" onClick={handleSaveLLM}>
                  <Sparkles size={16} />
                  <span>Simpan Pengaturan AI LLM</span>
                </button>
              </div>
            </div>
          )}

          {/* Firebase Fields */}
          {activeTab === 'fields' && (
            <div className="form-grid">
              <div className="form-group">
                <label>API Key <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Project ID <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="devquiz-prod"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Auth Domain</label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Storage Bucket</label>
                <input
                  type="text"
                  placeholder="project-id.appspot.com"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Messaging Sender ID</label>
                <input
                  type="text"
                  placeholder="123456789"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>App ID</label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* JSON Paste Tab */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Salin objek `const firebaseConfig = &#123; ... &#125;;` langsung dari Firebase Console dan tempel di bawah:
              </p>
              <textarea
                rows={6}
                value={jsonInput}
                onChange={(e) => handleJsonPaste(e.target.value)}
                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "projectId": "my-quiz-app"\n}'}
                className="form-textarea font-mono text-xs"
              />
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-3 guide-box">
              <h4 className="guide-title">Langkah Setup Firebase & AI LLM:</h4>
              <ol className="guide-list">
                <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Firebase Console</a> dan buat project baru.</li>
                <li>Aktifkan <strong>Cloud Firestore Database</strong> dalam mode test/development.</li>
                <li>Aktifkan <strong>Anonymous Authentication</strong> pada tab Authentication &gt; Sign-in method.</li>
                <li>Masuk ke Project Settings &gt; General &gt; Your apps &gt; Web App, salin nilai konfigurasinya.</li>
                <li>Untuk fitur <strong>LLM Question Generator</strong>, Anda dapat memasukkan Gemini API Key di tab "AI LLM".</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {activeTab !== 'llm' && (
            <button className="btn-secondary text-xs" onClick={handleResetToLocal}>
              Reset ke Local
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-outline" onClick={onClose}>
              Tutup
            </button>
            {activeTab === 'fields' || activeTab === 'json' ? (
              <button className="btn-primary" onClick={handleSaveFirebase}>
                Simpan Firebase
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
