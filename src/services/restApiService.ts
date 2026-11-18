import { Question, TriviaApiResponse } from '../types/quiz';

// Decode HTML entities commonly returned by Open Trivia DB
function decodeHtmlEntities(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Fetch questions from Open Trivia DB REST API (Category 18 = Computers)
 */
export async function fetchQuestionsFromRestApi(amount: number = 5, difficulty: string = 'all'): Promise<Question[]> {
  try {
    let url = `https://opentdb.com/api.php?amount=${amount}&category=18&type=multiple`;
    if (difficulty !== 'all') {
      url += `&difficulty=${difficulty.toLowerCase()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`REST API HTTP error! status: ${response.status}`);
    }

    const data: TriviaApiResponse = await response.json();
    if (data.response_code !== 0 || !data.results || data.results.length === 0) {
      throw new Error('REST API tidak mengembalikan soal yang valid atau rate limited.');
    }

    return data.results.map((item, idx) => {
      const decodedQuestion = decodeHtmlEntities(item.question);
      const correctAnswer = decodeHtmlEntities(item.correct_answer);
      const incorrectAnswers = item.incorrect_answers.map(decodeHtmlEntities);

      // Randomize option order
      const allOptions = shuffleArray([correctAnswer, ...incorrectAnswers]);
      const correctIndex = allOptions.indexOf(correctAnswer);

      // Map difficulty
      let diff: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
      if (item.difficulty === 'easy') diff = 'Beginner';
      if (item.difficulty === 'hard') diff = 'Advanced';

      return {
        id: `rest_${Date.now()}_${idx}`,
        category: 'javascript', // Closest match
        difficulty: diff,
        question: `[REST API OpenTrivia] ${decodedQuestion}`,
        code: null,
        options: allOptions,
        correctIndex,
        explanation: `Soal ini diambil secara dinamis dari Open Trivia DB REST API. Jawaban yang benar adalah "${correctAnswer}".`,
        author: 'Open Trivia DB API',
        source: 'rest-api'
      };
    });
  } catch (error: any) {
    console.warn('Gagal fetch dari REST API Open Trivia DB, beralih ke fallback internal:', error);
    throw error;
  }
}

/**
 * Fetch from custom JSON REST API endpoint
 */
export async function fetchCustomRestApi(endpointUrl: string): Promise<Question[]> {
  const response = await fetch(endpointUrl);
  if (!response.ok) {
    throw new Error(`Gagal memuat REST API: status ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map((q: any, i: number) => ({
      id: q.id || `custom_rest_${Date.now()}_${i}`,
      category: q.category || 'all',
      difficulty: q.difficulty || 'Intermediate',
      question: q.question,
      code: q.code || null,
      options: q.options || [],
      correctIndex: Number(q.correctIndex || 0),
      explanation: q.explanation || 'Pembahasan belum tersedia.',
      author: q.author || 'Custom REST API',
      source: 'rest-api'
    }));
  }
  throw new Error('Format respon JSON REST API harus berupa array soal.');
}
