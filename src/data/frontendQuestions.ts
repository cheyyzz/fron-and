import { CategoryInfo, Question } from '../types/quiz';

export const FRONTEND_CATEGORIES: CategoryInfo[] = [
  { id: 'all', name: 'Semua Kategori', icon: 'Sparkles', color: '#6366f1' },
  { id: 'html-css', name: 'HTML5 & CSS3', icon: 'Palette', color: '#ec4899' },
  { id: 'javascript', name: 'JavaScript ES6+', icon: 'FileCode2', color: '#f59e0b' },
  { id: 'react', name: 'React.js & Hooks', icon: 'Atom', color: '#06b6d4' },
  { id: 'web-api', name: 'Web APIs & Performance', icon: 'Zap', color: '#10b981' }
];

export const INITIAL_QUESTIONS: Question[] = [
  // --- HTML5 & CSS3 ---
  {
    id: 'fe-01',
    category: 'html-css',
    difficulty: 'Beginner',
    question: 'Tag HTML5 semantik manakah yang paling tepat digunakan untuk membungkus konten artikel utama yang independen dan dapat didistribusikan secara mandiri?',
    code: null,
    options: ['<section>', '<article>', '<main>', '<aside>'],
    correctIndex: 1,
    explanation: '<article> dirancang khusus untuk konten mandiri (seperti postingan blog, berita, atau komentar) yang masuk akal dibaca secara terpisah dari keseluruhan halaman.',
    source: 'built-in'
  },
  {
    id: 'fe-02',
    category: 'html-css',
    difficulty: 'Intermediate',
    question: 'Apa perbedaan mendasar antara box-sizing: content-box dan box-sizing: border-box dalam CSS Box Model?',
    code: `/* Box Model Calculation */
.box {
  width: 200px;
  padding: 20px;
  border: 5px solid black;
}`,
    options: [
      'border-box memasukkan padding dan border ke dalam total width/height, sedangkan content-box menambahkannya di luar width/height',
      'content-box otomatis membuat elemen bertipe inline-block',
      'border-box menghapus margin bawaan elemen',
      'Tidak ada perbedaan, keduanya menghasilkan dimensi render yang identik'
    ],
    correctIndex: 0,
    explanation: 'Pada border-box, total lebar elemen tetap 200px (padding dan border berada di dalam 200px tersebut). Sedangkan pada content-box, lebar total render menjadi 200px + 40px padding + 10px border = 250px.',
    source: 'built-in'
  },
  {
    id: 'fe-03',
    category: 'html-css',
    difficulty: 'Intermediate',
    question: 'Pada CSS Flexbox, properti apa yang mengatur perataan item di sepanjang "cross axis" (sumbu silang)?',
    code: `.container {
  display: flex;
  flex-direction: row;
  /* Properti apa untuk perataan vertikal di sini? */
}`,
    options: ['justify-content', 'align-items', 'align-content', 'flex-basis'],
    correctIndex: 1,
    explanation: 'justify-content mengatur perataan pada main axis (sumbu utama), sedangkan align-items mengatur posisi item sepanjang cross axis (sumbu silang).',
    source: 'built-in'
  },
  {
    id: 'fe-04',
    category: 'html-css',
    difficulty: 'Advanced',
    question: 'Berapakah nilai spesifisitas (specificity) dari selector CSS berikut?',
    code: `div.card#featured-user ul li a:hover`,
    options: [
      '0-1-2-3 (1 ID, 2 Classes/Pseudo-classes, 4 Elements)',
      '1-2-3 (1 ID, 2 Classes/Pseudo-classes, 3 Elements)',
      '1-2-4 (1 ID, 2 Classes/Pseudo-classes, 4 Elements)',
      '0-2-3 (0 ID, 2 Classes, 3 Elements)'
    ],
    correctIndex: 2,
    explanation: 'Perhitungannya: 1 ID (#featured-user) = 1, 2 Classes/Pseudo-classes (.card, :hover) = 2, 4 Elements (div, ul, li, a) = 4. Maka total specificity adalah (1, 2, 4).',
    source: 'built-in'
  },

  // --- JAVASCRIPT ES6+ ---
  {
    id: 'fe-05',
    category: 'javascript',
    difficulty: 'Beginner',
    question: 'Apa output dari potongan kode JavaScript berikut?',
    code: `console.log(typeof null);
console.log(typeof undefined);`,
    options: [
      '"null" dan "undefined"',
      '"object" dan "undefined"',
      '"undefined" dan "undefined"',
      '"object" dan "object"'
    ],
    correctIndex: 1,
    explanation: 'typeof null mengembalikan "object" (ini merupakan bug historis JavaScript sejak versi awal yang dipertahankan demi backward-compatibility), sedangkan typeof undefined mengembalikan "undefined".',
    source: 'built-in'
  },
  {
    id: 'fe-06',
    category: 'javascript',
    difficulty: 'Intermediate',
    question: 'Urutan output konsol apa yang dihasilkan dari Event Loop JavaScript berikut?',
    code: `console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');`,
    options: [
      '1, 4, 3, 2',
      '1, 2, 3, 4',
      '1, 4, 2, 3',
      '3, 1, 4, 2'
    ],
    correctIndex: 0,
    explanation: '1 dan 4 dieksekusi secara synchronous (Call Stack). Promise callback masuk ke Microtask Queue (diproses sebelum Macrotask). setTimeout masuk ke Macrotask Queue (Task Queue). Urutan eksekusi: 1 -> 4 -> 3 -> 2.',
    source: 'built-in'
  },
  {
    id: 'fe-07',
    category: 'javascript',
    difficulty: 'Intermediate',
    question: 'Teknik apa yang terjadi ketika fungsi inner dapat mengakses variabel dari fungsi outer meskipun fungsi outer sudah selesai dieksekusi?',
    code: `function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}`,
    options: ['Hoisting', 'Event Bubbling', 'Closure', 'Memoization'],
    correctIndex: 2,
    explanation: 'Closure adalah kombinasi fungsi dengan lexical environment di mana fungsi tersebut dideklarasikan, memungkinkan fungsi dalam mengingat dan mengakses variabel dari enclosing scope-nya.',
    source: 'built-in'
  },
  {
    id: 'fe-08',
    category: 'javascript',
    difficulty: 'Advanced',
    question: 'Apa hasil evaluasi ekspresi berikut pada JavaScript modern?',
    code: `const user = { profile: { age: 0 } };
const score = user.profile?.age ?? 25;
const height = user.profile?.age || 25;

console.log(score, height);`,
    options: [
      '0 25',
      '25 25',
      '0 0',
      'undefined 25'
    ],
    correctIndex: 0,
    explanation: 'Nullish Coalescing Operator (??) hanya menggantikan nilai jika null atau undefined (karena 0 bukan null/undefined, maka hasilnya 0). Logical OR (||) mengecek falsy value (karena 0 adalah falsy, maka diganti 25). Hasilnya: 0 25.',
    source: 'built-in'
  },

  // --- REACT.JS & HOOKS ---
  {
    id: 'fe-09',
    category: 'react',
    difficulty: 'Beginner',
    question: 'Mengapa kita harus memberikan properti "key" yang unik ketika me-render daftar elemen pada React?',
    code: `const items = ['React', 'Vue', 'Angular'];
return (
  <ul>
    {items.map((item, index) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);`,
    options: [
      'Agar React dapat mengidentifikasi elemen mana yang berubah, ditambah, atau dihapus secara efisien saat rekonsiliasi (Virtual DOM diffing)',
      'Hanya untuk styling CSS agar selector child berfungsi',
      'Untuk mengurutkan array secara otomatis',
      'Merupakan syarat wajib compiler Babel dan akan crash jika tidak ditulis'
    ],
    correctIndex: 0,
    explanation: 'Key membantu algoritma rekonsiliasi React mengidentifikasi secara presisi item mana yang berpindah, berubah, atau dihapus tanpa perlu merender ulang seluruh list.',
    source: 'built-in'
  },
  {
    id: 'fe-10',
    category: 'react',
    difficulty: 'Intermediate',
    question: 'Kapan cleanup function pada hook useEffect akan dijalankan?',
    code: `useEffect(() => {
  const handler = () => console.log('Resized');
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
  };
}, [dep]);`,
    options: [
      'Hanya satu kali saat aplikasi ditutup pengguna',
      'Sebelum effect dijalankan kembali pada re-render berikutnya, dan saat komponen di-unmount',
      'Hanya ketika terjadi error di dalam komponen',
      'Sesaat sebelum Virtual DOM dibuat pertama kali'
    ],
    correctIndex: 1,
    explanation: 'Cleanup function dijalankan saat komponen di-unmount untuk mencegah memory leak, serta sebelum effect dieksekusi ulang saat dependency berubah.',
    source: 'built-in'
  },
  {
    id: 'fe-11',
    category: 'react',
    difficulty: 'Intermediate',
    question: 'Hook apa yang paling tepat digunakan untuk menyimpan referensi ke DOM node langsung atau menyimpan mutable value tanpa memicu re-render komponen?',
    code: null,
    options: ['useState', 'useMemo', 'useRef', 'useCallback'],
    correctIndex: 2,
    explanation: 'useRef mengembalikan object mutable `{ current: ... }` yang bertahan sepanjang lifecycle komponen. Mengubah nilai `.current` TIDAK memicu re-render.',
    source: 'built-in'
  },
  {
    id: 'fe-12',
    category: 'react',
    difficulty: 'Advanced',
    question: 'Apa perbedaan mendasar antara useMemo dan useCallback dalam React?',
    code: `const valA = useMemo(() => computeHeavy(x), [x]);
const valB = useCallback(() => computeHeavy(x), [x]);`,
    options: [
      'useMemo meng-cache hasil return dari sebuah fungsi, sedangkan useCallback meng-cache definisi instance fungsi itu sendiri',
      'useCallback dijalankan secara asinkron, sedangkan useMemo sinkron',
      'useMemo hanya bisa digunakan untuk angka dan string',
      'Tidak ada bedanya, useCallback adalah alias lama dari useMemo'
    ],
    correctIndex: 0,
    explanation: 'useMemo me-memoize nilai hasil kalkulasi (`fn()`), sedangkan useCallback me-memoize fungsi itu sendiri (`useCallback(fn, deps)` identik dengan `useMemo(() => fn, deps)`).',
    source: 'built-in'
  },

  // --- WEB APIS & PERFORMANCE ---
  {
    id: 'fe-13',
    category: 'web-api',
    difficulty: 'Intermediate',
    question: 'Apa perbedaan antara teknik Debouncing dan Throttling pada penanganan event (seperti scroll / search input)?',
    code: null,
    options: [
      'Debounce menunda eksekusi sampai jeda waktu tertentu setelah event terakhir berhenti dipicu; Throttle memastikan eksekusi hanya terjadi maksimal sekali dalam interval waktu tertentu',
      'Throttle membatalkan HTTP request, sedangkan debounce menggandakan request',
      'Debounce hanya bekerja pada form input, sedangkan throttle hanya pada canvas',
      'Keduanya sama persis dan bisa saling menggantikan tanpa perbedaan perilaku'
    ],
    correctIndex: 0,
    explanation: 'Debounce menunda aksi sampai user selesai mengetik (idle period). Throttle menjamin aksi dieksekusi dengan frekuensi teratur (misalnya maksimal 1 kali setiap 200ms saat scrolling).',
    source: 'built-in'
  },
  {
    id: 'fe-14',
    category: 'web-api',
    difficulty: 'Intermediate',
    question: 'Storage browser manakah yang datanya otomatis terhapus saat tab atau browser ditutup?',
    code: null,
    options: ['localStorage', 'sessionStorage', 'IndexedDB', 'Cookies dengan Expires 1 tahun'],
    correctIndex: 1,
    explanation: 'sessionStorage hanya bertahan selama masa sesi tab browsing berlangsung. Begitu tab ditutup, data akan langsung dihapus oleh browser.',
    source: 'built-in'
  },
  {
    id: 'fe-15',
    category: 'web-api',
    difficulty: 'Advanced',
    question: 'Metrik Core Web Vitals (CWV) manakah yang mengukur stabilitas visual halaman dari pergeseran layout tak terduga saat konten dimuat?',
    code: null,
    options: [
      'LCP (Largest Contentful Paint)',
      'INP (Interaction to Next Paint)',
      'CLS (Cumulative Layout Shift)',
      'TTFB (Time to First Byte)'
    ],
    correctIndex: 2,
    explanation: 'CLS (Cumulative Layout Shift) mengukur total semua skor pergeseran layout tak terduga yang terjadi selama masa hidup halaman web.',
    source: 'built-in'
  }
];
