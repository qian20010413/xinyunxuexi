
import { Subject, Difficulty, Question } from "./types";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * 几何图形生成工具：数轴
 */
const createNumberLineSVG = (pointX: number, label: string) => {
  const xPos = 150 + pointX * 25;
  return `
    <svg viewBox="0 0 300 80" class="w-full max-w-sm h-24">
      <line x1="10" y1="40" x2="290" y2="40" stroke="#475569" stroke-width="2" marker-end="url(#arrow)" />
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/></marker></defs>
      ${[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(i => `
        <line x1="${150 + i * 25}" y1="35" x2="${150 + i * 25}" y2="45" stroke="#94a3b8" stroke-width="1" />
        <text x="${150 + i * 25}" y="65" font-size="10" text-anchor="middle" fill="#64748b">${i}</text>
      `).join('')}
      <circle cx="${xPos}" cy="40" r="5" fill="#ef4444" />
      <text x="${xPos}" y="25" font-size="12" font-weight="bold" text-anchor="middle" fill="#ef4444">${label}</text>
    </svg>
  `;
};

/**
 * 几何图形生成工具：线段与中点
 */
const createSegmentSVG = (labelA: string, labelB: string, labelM?: string) => {
  return `
    <svg viewBox="0 0 300 60" class="w-full max-w-sm h-16">
      <line x1="50" y1="30" x2="250" y2="30" stroke="#475569" stroke-width="3" />
      <circle cx="50" cy="30" r="4" fill="#1e293b" />
      <text x="45" y="50" font-size="12" font-weight="bold">${labelA}</text>
      <circle cx="250" cy="30" r="4" fill="#1e293b" />
      <text x="245" y="50" font-size="12" font-weight="bold">${labelB}</text>
      ${labelM ? `
        <circle cx="150" cy="30" r="4" fill="#6366f1" />
        <text x="145" y="50" font-size="12" font-weight="bold" fill="#6366f1">${labelM}</text>
      ` : ''}
    </svg>
  `;
};

/**
 * 几何图形生成工具：角度 (支持多射线)
 */
const createAngleSVG = (angles: number[], labels: string[] = ['O', 'A', 'B', 'C']) => {
  const origin = { x: 100, y: 90 };
  const radius = 80;
  let paths = `<line x1="${origin.x}" y1="${origin.y}" x2="${origin.x + radius}" y2="${origin.y}" stroke="#475569" stroke-width="2" />`;
  let texts = `<text x="${origin.x + radius + 8}" y="${origin.y + 5}" font-size="12" font-weight="bold">${labels[1]}</text>`;
  
  let currentAngle = 0;
  angles.forEach((angle, i) => {
    currentAngle += angle;
    const rad = (currentAngle * Math.PI) / 180;
    const targetX = origin.x + radius * Math.cos(-rad);
    const targetY = origin.y + radius * Math.sin(-rad);
    paths += `<line x1="${origin.x}" y1="${origin.y}" x2="${targetX}" y2="${targetY}" stroke="#475569" stroke-width="2" />`;
    const labelX = origin.x + (radius + 15) * Math.cos(-rad);
    const labelY = origin.y + (radius + 15) * Math.sin(-rad);
    texts += `<text x="${labelX}" y="${labelY}" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#1e293b">${labels[i + 2]}</text>`;
  });

  return `
    <svg viewBox="0 0 220 120" class="w-full max-w-xs h-36">
      <rect width="220" height="120" fill="#f8fafc" rx="8" />
      ${paths}
      <circle cx="${origin.x}" cy="${origin.y}" r="3" fill="#1e293b" />
      <text x="${origin.x - 15}" y="${origin.y + 5}" font-size="12" font-weight="bold">${labels[0]}</text>
      ${texts}
    </svg>
  `;
};

/**
 * 核心数学生成器：涵盖人教版七年级上册全部重点
 */
const generateMathQuestion = (id: string): Question => {
  const types = [
    'num_line_val', 'abs_comparison', 'scientific_notation', 'approx_val',
    'algebra_simplify', 'algebra_eval', 'equation_solve_simple', 'equation_solve_complex',
    'equation_word_problem', 'segment_midpoint', 'angle_calc_complex', 'angle_complementary'
  ];
  const type = pick(types);

  switch(type) {
    case 'num_line_val': {
      const val = Math.floor(Math.random() * 9) - 4;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '有理数·数轴',
        content: `观察数轴，点 A 表示的数是 ${val}，则点 A 到原点的距离是多少？`,
        svgContent: createNumberLineSVG(val, 'A'),
        correctAnswer: Math.abs(val).toString(),
        explanation: `数轴上一个数到原点的距离等于这个数的绝对值。|${val}| = ${Math.abs(val)}。`
      };
    }
    case 'abs_comparison': {
      const a = -Math.floor(Math.random() * 10 + 1);
      const b = -Math.floor(Math.random() * 10 + 1);
      const isGreater = a > b;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '有理数·比较',
        content: `比较有理数的大小：${a} ____ ${b} (填写 > 或 <)`,
        correctAnswer: isGreater ? '>' : (a === b ? '=' : '<'),
        explanation: `两个负数比较大小，绝对值大的反而小。|${a}| = ${Math.abs(a)}，|${b}| = ${Math.abs(b)}。`
      };
    }
    case 'scientific_notation': {
      const base = (Math.random() * 8 + 1).toFixed(2);
      const exp = Math.floor(Math.random() * 4 + 4);
      const original = Math.round(parseFloat(base) * Math.pow(10, exp));
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '有理数·科学记数法',
        content: `将数字 ${original.toLocaleString()} 用科学记数法表示为 a × 10ⁿ 的形式，则 n 的值是？`,
        correctAnswer: exp.toString(),
        explanation: `科学记数法格式为 a × 10ⁿ (1≤|a|<10)。${original} 相当于将小数点向左移动了 ${exp} 位，故 n = ${exp}。`
      };
    }
    case 'algebra_simplify': {
      const a = Math.floor(Math.random() * 5 + 2);
      const b = Math.floor(Math.random() * 5 + 2);
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '整式·化简',
        content: `化简整式：${a}x - (${b}x - 3)的结果是？`,
        correctAnswer: `${a - b}x+3`,
        explanation: `去括号法则：括号前是负号，去掉括号后里面各项都要变号。原式 = ${a}x - ${b}x + 3 = (${a - b})x + 3。`
      };
    }
    case 'equation_solve_simple': {
      const x = Math.floor(Math.random() * 10 + 1);
      const a = Math.floor(Math.random() * 5 + 2);
      const b = Math.floor(Math.random() * 10 + 1);
      const res = a * x + b;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '一元一次方程·解法',
        content: `解方程：${a}x + ${b} = ${res}，则 x = ？`,
        correctAnswer: x.toString(),
        explanation: `1. 移项得 ${a}x = ${res} - ${b} = ${a * x}； 2. 系数化为1得 x = ${x}。`
      };
    }
    case 'equation_word_problem': {
      const price = Math.floor(Math.random() * 20 + 10) * 10;
      const count = Math.floor(Math.random() * 3 + 2);
      const total = price * count;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.HARD, topic: '一元一次方程·应用',
        content: `某商店售出 ${count} 件相同的商品，共收入 ${total} 元。若每件商品的成本价是其售价的 80%，则每件商品的利润是多少元？`,
        correctAnswer: (price * 0.2).toString(),
        explanation: `1. 售价 = ${total} ÷ ${count} = ${price}元； 2. 成本 = ${price} × 80% = ${price * 0.8}元； 3. 利润 = 售价 - 成本 = ${price - price * 0.8}元。`
      };
    }
    case 'segment_midpoint': {
      const ab = (Math.floor(Math.random() * 5) + 5) * 2;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '几何初步·线段中点',
        content: `如图，点 M 是线段 AB 的中点。若 AB = ${ab}cm，则 AM 的长度是多少 cm？`,
        svgContent: createSegmentSVG('A', 'B', 'M'),
        correctAnswer: (ab / 2).toString(),
        explanation: `线段中点将线段平分为两段相等的线段。AM = 1/2 AB = ${ab} ÷ 2 = ${ab / 2}cm。`
      };
    }
    case 'angle_calc_complex': {
      const aoc = 180;
      const boc = Math.floor(Math.random() * 50 + 40);
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '几何初步·角度计算',
        content: `已知 A, O, C 三点在同一直线上（即 ∠AOC = 180°），OB 是一条射线，且 ∠BOC = ${boc}°。则 ∠AOB 的度数是？`,
        svgContent: createAngleSVG([boc], ['O', 'C', 'B', 'A']),
        correctAnswer: (180 - boc).toString(),
        explanation: `平角等于 180°。∠AOB = ∠AOC - ∠BOC = 180° - ${boc}° = ${180 - boc}°。`
      };
    }
    case 'angle_complementary': {
      const ang = Math.floor(Math.random() * 40 + 20);
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '几何初步·余角',
        content: `如果 ∠1 = ${ang}°，且 ∠1 与 ∠2 互为余角（和为90°），那么 ∠2 的度数是多少？`,
        correctAnswer: (90 - ang).toString(),
        explanation: `互余的两个角之和为 90°。∠2 = 90° - ∠1 = 90° - ${ang}° = ${90 - ang}°。`
      };
    }
    default: {
      const val = Math.floor(Math.random() * 10);
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '有理数·绝对值',
        content: `若 |x| = ${val}，且 x < 0，则 x 的值是？`,
        correctAnswer: (-val).toString(),
        explanation: `绝对值等于 ${val} 的数有两个，分别是 ${val} 和 -${val}。因为题目要求 x < 0，所以 x = -${val}。`
      };
    }
  }
};

export const OFFLINE_BANK: Record<Subject, Question[]> = {
  [Subject.CHINESE]: [
    { id: 'c1', subject: Subject.CHINESE, difficulty: Difficulty.CONCEPT, topic: '文学常识', content: '《论语》是记录____及其弟子言行的书？', options: ['A. 孔子', 'B. 孟子', 'C. 老子', 'D. 墨子'], correctAnswer: 'A', explanation: '《论语》是儒家经典之一，由孔子的弟子及再传弟子编写。' },
    { id: 'c2', subject: Subject.CHINESE, difficulty: Difficulty.CONCEPT, topic: '字义辨析', content: '“不求甚解”中“甚”的意思是？', options: ['A. 甚至', 'B. 过分', 'C. 很多', 'D. 厉害'], correctAnswer: 'B', explanation: '原意是不在字句上过分推敲。' },
    { id: 'c3', subject: Subject.CHINESE, difficulty: Difficulty.CONCEPT, topic: '修辞手法', content: '“盼望着，盼望着，东风来了，春天的脚步近了”运用了什么修辞？', options: ['A. 比喻、拟人', 'B. 反复、拟人', 'C. 夸张、排比', 'D. 对偶、反复'], correctAnswer: 'B', explanation: '“盼望着”重复出现是反复，“脚步近了”赋予春天人的行为，是拟人。' },
    { id: 'c4', subject: Subject.CHINESE, difficulty: Difficulty.CONCEPT, topic: '古诗名句', content: '“海日生残夜，江春入旧年”体现了时序更替的自然理趣。这句诗出自？', options: ['A. 《次北固山下》', 'B. 《天净沙·秋思》', 'C. 《闻王昌龄左迁龙标遥有此寄》', 'D. 《夜雨寄北》'], correctAnswer: 'A', explanation: '这是唐代诗人王湾《次北固山下》的名句。' },
    { id: 'c5', subject: Subject.CHINESE, difficulty: Difficulty.MEDIUM, topic: '词语运用', content: '下列句子中加点成语使用不恰当的一项是？', options: ['A. 老师煞有介事地讲起了这个故事。', 'B. 他说话总是咄咄逼人，让人不舒服。', 'C. 听完这段演讲，大家都恍然大悟。', 'D. 这件事办得可谓是各得其所。'], correctAnswer: 'A', explanation: '“煞有介事”指像真有那么回事似的，多指装模作样，用在这里褒贬不当。' },
  ],
  [Subject.MATH]: [], 
  [Subject.ENGLISH]: [
    { id: 'e1', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '人称代词', content: '____ am a girl. ____ name is Lucy.', options: ['A. I; My', 'B. I; Me', 'C. My; I', 'D. Me; My'], correctAnswer: 'A', explanation: '第一空做主语用主格I，第二空做定语用物主代词My。' },
    { id: 'e2', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '冠词用法', content: 'This is ____ apple. It is ____ red apple.', options: ['A. a; a', 'B. an; an', 'C. an; a', 'D. a; an'], correctAnswer: 'C', explanation: 'apple是以元音音素开头，用an；red是以辅音音素开头，用a。' },
    { id: 'e3', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '单复数转换', content: 'What are those? They are ____.', options: ['A. box', 'B. boxs', 'C. boxes', 'D. boxing'], correctAnswer: 'C', explanation: '以x结尾的名词变复数加es。' },
    { id: 'e4', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '日常用语', content: '—How do you spell "pen"? —____.', options: ['A. It is a pen', 'B. P-E-N', 'C. Yes, I can', 'D. No, thanks'], correctAnswer: 'B', explanation: '询问如何拼写，需要按字母顺序读出。' },
    { id: 'e5', subject: Subject.ENGLISH, difficulty: Difficulty.MEDIUM, topic: '介词搭配', content: 'My birthday is ____ October 1st.', options: ['A. in', 'B. on', 'C. at', 'D. to'], correctAnswer: 'B', explanation: '在具体的某一天或具体日期的上午、下午用介词on。' },
  ]
};

export function getRandomQuestions(subject: Subject, count: number): Question[] {
  let results: Question[] = [];
  if (subject === Subject.MATH) {
    // 动态生成数学题目，确保覆盖多种知识点
    for (let i = 0; i < count; i++) {
      results.push(generateMathQuestion(`math-${Date.now()}-${i}-${Math.random()}`));
    }
  } else {
    const bank = OFFLINE_BANK[subject];
    // 随机打乱题库并选取
    const shuffled = [...bank].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count; i++) {
      const q = shuffled[i % shuffled.length];
      results.push({ ...q, id: `${q.id}-${Date.now()}-${i}` });
    }
  }
  return results;
}
