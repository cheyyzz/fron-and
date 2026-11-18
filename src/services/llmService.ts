import { Question, LLMConfig } from '../types/quiz';

const LLM_STORAGE_KEY = 'frontend_quiz_llm_config';

export function getLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return {
    apiKey: '',
    provider: 'gemini',
    model: 'gemini-1.5-flash'
  };
}

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Call Google Gemini LLM API via REST
 */
async function callGeminiApi(prompt: string, apiKey: string, model: string = 'gemini-1.5-flash'): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini LLM Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error('LLM tidak mengembalikan teks jawaban yang valid.');
  }
  return candidate;
}

/**
 * High-quality built-in simulated LLM generation when API Key is not yet set
 */
function generateSimulatedQuestions(topic: string, count: number, difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): Question[] {
  const templates = [
    {
      q: `Dalam ekosistem modern ${topic}, manakah praktik terbaik yang direkomendasikan untuk optimalisasi performa?`,
      code: `// Contoh implementasi ${topic}\nconst memoizedValue = useMemo(() => computeHeavyTask(data), [data]);`,
      options: [
        'Menghindari re-render yang tidak perlu dengan teknik memoization yang tepat',
        'Memindahkan seluruh state lokal ke dalam Global Window Object',
        'Menggunakan sinkronus blocking while loop pada event listener',
        'Menonaktifkan tree-shaking pada konfigurasi bundler'
      ],
      correctIndex: 0,
      explanation: `Pada ${topic}, menjaga efisiensi siklus render melalui memoization atau lazy loading mencegah kalkulasi berat berulang tanpa kompromi kebersihan arsitektur.`
    },
    {
      q: `Bagaimanakah penanganan error yang andal pada operasi async/await terkait fitur ${topic}?`,
      code: `async function loadData() {\n  try {\n    const res = await fetch('/api/${topic.toLowerCase().replace(/\\s+/g, '-')}');\n    return await res.json();\n  } catch (err) {\n    console.error(err);\n  }\n}`,
      options: [
        'Membungkus eksekusi async dalam blok try...catch dan menangani rejection secara terpusat',
        'Menghapus blok catch agar runtime otomatis melakukan restart pada browser',
        'Mengubah fungsi menjadi synchronous dengan memblokir Main Thread',
        'Hanya mengandalkan callback setTimeout tanpa exception handling'
      ],
      correctIndex: 0,
      explanation: 'Penggunaan try-catch pada asynchronous function memastikan setiap network rejection atau parse error dapat di-handle secara graceful tanpa membuat aplikasi crash.'
    },
    {
      q: `Manakah dari pernyataan berikut yang paling tepat mengenai immutability pada state management ${topic}?`,
      code: `// Update state ${topic}\nsetUser(prev => ({ ...prev, updated: true }));`,
      options: [
        'Membuat objek/array salinan baru (shallow copy) daripada melakukan mutasi langsung pada state lama',
        'Mengubah properti object asli secara in-place dengan operator delete',
        'Menggunakan mutable global variable agar semua komponen sinkron secara instan',
        'Menyimpan seluruh state pada DOM innerHTML'
      ],
      correctIndex: 0,
      explanation: 'Prinsip immutability sangat krusial dalam library seperti React agar change detection (shallow equality check) dapat mendeteksi perubahan state dan melakukan re-render secara akurat.'
    }
  ];

  const results: Question[] = [];
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    results.push({
      id: `llm_${Date.now()}_${i}`,
      category: topic.toLowerCase().includes('css') ? 'css' : topic.toLowerCase().includes('react') ? 'react' : 'javascript',
      difficulty,
      question: `[AI Generator: ${topic}] ${t.q}`,
      code: t.code,
      options: t.options,
      correctIndex: t.correctIndex,
      explanation: `[Dianalisis oleh AI]: ${t.explanation}`,
      author: 'AI Question Generator (LLM)',
      source: 'llm-generated'
    });
  }
  return results;
}

/**
 * Generate quiz questions using Large Language Model
 */
export async function generateQuestionsWithLLM(
  topic: string,
  count: number = 3,
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate'
): Promise<Question[]> {
  const config = getLLMConfig();

  // If no API key provided, use the high-fidelity smart generator
  if (!config.apiKey || config.provider === 'demo-simulated') {
    // Artificial small delay to simulate LLM thinking
    await new Promise(r => setTimeout(r, 1200));
    return generateSimulatedQuestions(topic, count, difficulty);
  }

  const prompt = `Anda adalah seorang Senior Front-End Architect dan AI Quiz Master.
Buatlah tepat ${count} soal kuis pilihan ganda berbahasa Indonesia tentang topik: "${topic}" dengan tingkat kesulitan: "${difficulty}".
Format output HARUS berupa JSON array murni tanpa markdown fence backticks atau teks pengantar apapun.
Format tiap objek di dalam array:
[
  {
    "question": "Kalimat pertanyaan yang jelas dan menguji pemahaman konsep",
    "code": "Opsional snippet kode singkat atau null jika tidak perlu kode",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctIndex": 0,
    "explanation": "Penjelasan detail mengapa opsi tersebut benar dan konsep di baliknya"
  }
]
Peraturan:
1. "correctIndex" harus berupa angka 0, 1, 2, atau 3 (indeks 0=A, 1=B, 2=C, 3=D).
2. "options" harus berisi tepat 4 pilihan string yang masuk akal.
3. Berikan code snippet yang realistis bila relevan.`;

  const rawText = await callGeminiApi(prompt, config.apiKey, config.model || 'gemini-1.5-flash');

  // Clean JSON response
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('Hasil respon LLM tidak berformat JSON Array.');
  }

  return parsed.map((item: any, idx: number) => ({
    id: `llm_${Date.now()}_${idx}`,
    category: topic.toLowerCase().includes('css') ? 'css' : topic.toLowerCase().includes('react') ? 'react' : 'javascript',
    difficulty,
    question: `[AI: ${topic}] ${item.question}`,
    code: item.code || null,
    options: item.options || [],
    correctIndex: Number(item.correctIndex || 0),
    explanation: item.explanation || 'Pembahasan dibuat oleh AI.',
    author: 'AI Gemini LLM',
    source: 'llm-generated'
  }));
}

/**
 * Get AI In-Depth Explanation for a question
 */
export async function getAIInDepthExplanation(
  question: string,
  code: string | null | undefined,
  options: string[],
  correctIndex: number,
  userChoiceIndex?: number
): Promise<string> {
  const config = getLLMConfig();
  const correctAnswer = options[correctIndex];
  const userChoice = typeof userChoiceIndex === 'number' && userChoiceIndex >= 0 ? options[userChoiceIndex] : null;

  if (!config.apiKey || config.provider === 'demo-simulated') {
    await new Promise(r => setTimeout(r, 900));
    return `🤖 [AI Tutor Analisis]:\n\n` +
      `Kunci yang benar adalah "${correctAnswer}".\n\n` +
      (userChoice && userChoice !== correctAnswer
        ? `Anda memilih "${userChoice}". Pilihan ini kurang tepat karena seringkali merupakan misconception umum.\n\n`
        : `Pilihan Anda sudah tepat!\n\n`) +
      `💡 Prinsip Kunci:\nDalam arsitektur modern front-end, konsep ini memastikan kejelasan alur data, performa rendering yang optimal, dan meminimalisir efek samping (side effects) yang sulit di-debug. Selalu pastikan memperhatikan lifecycle, immutable updates, dan pemisahan concerns.`;
  }

  const prompt = `Sebagai seorang AI Senior Front-End Mentor, berikan pembahasan mendalam dan edukatif dalam bahasa Indonesia untuk soal kuis berikut:
Pertanyaan: ${question}
${code ? `Kode:\n${code}\n` : ''}
Pilihan Jawaban:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}
Kunci Jawaban yang Benar: ${String.fromCharCode(65 + correctIndex)}. ${correctAnswer}
${userChoice ? `Pilihan Pengguna: ${userChoice}` : ''}

Jelaskan secara ringkas namun tajam (2-3 paragraf):
1. Mengapa jawaban tersebut benar.
2. Mengapa pilihan lainnya keliru / sering membingungkan developer.
3. Tips praktis di dunia kerja nyata.`;

  return await callGeminiApi(prompt, config.apiKey, config.model || 'gemini-1.5-flash');
}

/**
 * Get pedagogical AI hint during quiz without giving away the direct answer
 */
export async function getAIHint(question: string, code?: string | null): Promise<string> {
  const config = getLLMConfig();

  if (!config.apiKey || config.provider === 'demo-simulated') {
    await new Promise(r => setTimeout(r, 600));
    return `💡 [Petunjuk AI]: Fokuslah pada kata kunci utama dalam pertanyaan. Perhatikan bagaimana eksekusi kode menangani asynchronous flow, atau ingat kembali aturan dasar immutability dan spesifisitas CSS!`;
  }

  const prompt = `Sebagai asisten kuis yang ramah, berikan petunjuk singkat (maksimal 2 kalimat) dalam bahasa Indonesia untuk soal ini TANPA menyebutkan secara langsung huruf atau teks jawaban yang benar.
Pertanyaan: ${question}
${code ? `Kode:\n${code}` : ''}
Petunjuk:`;

  return await callGeminiApi(prompt, config.apiKey, config.model || 'gemini-1.5-flash');
}
