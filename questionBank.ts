
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
 * 几何图形生成工具：线段与点
 */
const createSegmentSVG = (points: { pos: number; label: string; color?: string }[]) => {
  const startX = 40;
  const endX = 260;
  const totalLen = 100; // 模拟总长度刻度
  
  const getX = (p: number) => startX + (p / totalLen) * (endX - startX);

  return `
    <svg viewBox="0 0 300 70" class="w-full max-w-sm h-20">
      <rect width="300" height="70" fill="#f8fafc" rx="12" />
      <line x1="${startX}" y1="35" x2="${endX}" y2="35" stroke="#475569" stroke-width="3" stroke-linecap="round" />
      ${points.map(p => `
        <circle cx="${getX(p.pos)}" cy="35" r="5" fill="${p.color || '#1e293b'}" />
        <text x="${getX(p.pos)}" y="58" font-size="12" font-weight="bold" text-anchor="middle" fill="${p.color || '#1e293b'}">${p.label}</text>
      `).join('')}
    </svg>
  `;
};

/**
 * 几何图形生成工具：时钟角度
 */
const createClockSVG = (hour: number, minute: number) => {
  const center = { x: 50, y: 50 };
  const r = 40;
  const hAngle = (hour % 12 + minute / 60) * 30 - 90;
  const mAngle = minute * 6 - 90;
  
  const hX = center.x + 22 * Math.cos(hAngle * Math.PI / 180);
  const hY = center.y + 22 * Math.sin(hAngle * Math.PI / 180);
  const mX = center.x + 35 * Math.cos(mAngle * Math.PI / 180);
  const mY = center.y + 35 * Math.sin(mAngle * Math.PI / 180);

  return `
    <svg viewBox="0 0 100 100" class="w-24 h-24 mx-auto">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#475569" stroke-width="2" />
      ${[...Array(12)].map((_, i) => {
        const ang = i * 30 * Math.PI / 180;
        return `<line x1="${50 + 38 * Math.cos(ang)}" y1="${50 + 38 * Math.sin(ang)}" x2="${50 + 43 * Math.cos(ang)}" y2="${50 + 43 * Math.sin(ang)}" stroke="#94a3b8" stroke-width="1" />`;
      }).join('')}
      <line x1="50" y1="50" x2="${hX}" y2="${hY}" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
      <line x1="50" y1="50" x2="${mX}" y2="${mY}" stroke="#6366f1" stroke-width="2" stroke-linecap="round" />
      <circle cx="50" cy="50" r="3" fill="#1e293b" />
    </svg>
  `;
};

/**
 * 几何图形生成工具：多射线角度
 */
const createAngleSVG = (angles: number[], labels: string[] = ['O', 'A', 'B', 'C', 'D']) => {
  const origin = { x: 110, y: 90 };
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
 * 核心数学练习生成器
 */
const generateMathQuestion = (id: string): Question => {
  const types = [
    'clock_angle', 'segment_addition', 'angle_sum_around', 'segment_midpoint_complex',
    'angle_bisector_triple', 'num_line_range', 'algebra_geometric_area', 'equation_balance',
    'vertical_angle_graph', 'complementary_graph'
  ];
  const type = pick(types);

  switch(type) {
    case 'clock_angle': {
      const hours = pick([3, 4, 9, 10]);
      const angle = (hours === 3 || hours === 9) ? 90 : (hours === 4 ? 120 : 60);
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '几何·时钟角度',
        content: `当闹钟指向 ${hours}:00 整时，时针与分针构成的较小角度是多少度？`,
        svgContent: createClockSVG(hours, 0),
        correctAnswer: angle.toString(),
        explanation: `时钟一圈 360°，分为 12 个大格，每大格 360÷12 = 30°。${hours} 点整时针分针跨越 ${hours > 6 ? 12-hours : hours} 个大格，角度为 ${angle}°。`
      };
    }
    case 'segment_addition': {
      const ab = 8, bc = 5;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '几何·线段计算',
        content: `如图，点 B 在线段 AC 上，已知 AB = ${ab}cm，BC = ${bc}cm。求线段 AC 的长度。`,
        svgContent: createSegmentSVG([{pos: 0, label: 'A'}, {pos: 60, label: 'B'}, {pos: 100, label: 'C'}]),
        correctAnswer: (ab + bc).toString(),
        explanation: `根据线段的和差关系，AC = AB + BC = ${ab} + ${bc} = ${ab + bc}cm。`
      };
    }
    case 'segment_midpoint_complex': {
      const am = 6;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '几何·线段中点',
        content: `点 M 是线段 AB 的中点，点 N 是线段 MB 的中点。若 AM = ${am}cm，求线段 AN 的长度。`,
        svgContent: createSegmentSVG([{pos: 0, label: 'A'}, {pos: 50, label: 'M', color: '#6366f1'}, {pos: 75, label: 'N', color: '#ef4444'}, {pos: 100, label: 'B'}]),
        correctAnswer: (am * 1.5).toString(),
        explanation: `1. M 是 AB 中点，则 MB = AM = ${am}cm； 2. N 是 MB 中点，则 MN = 1/2 MB = ${am/2}cm； 3. AN = AM + MN = ${am} + ${am/2} = ${am*1.5}cm。`
      };
    }
    case 'angle_bisector_triple': {
      const aob = 120;
      const boc = 40;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.HARD, topic: '几何·多射线计算',
        content: `如图，∠AOC = ${aob}°，∠BOC = ${boc}°，且 OB 在 ∠AOC 内部。若 OD 平分 ∠AOB，求 ∠COD 的度数。`,
        svgContent: createAngleSVG([boc, (aob-boc)/2, (aob-boc)/2], ['O', 'C', 'B', 'D', 'A']),
        correctAnswer: (boc + (aob - boc) / 2).toString(),
        explanation: `1. ∠AOB = ∠AOC - ∠BOC = ${aob} - ${boc} = ${aob-boc}°； 2. OD 平分 ∠AOB，则 ∠BOD = 1/2 ∠AOB = ${(aob-boc)/2}°； 3. ∠COD = ∠COB + ∠BOD = ${boc} + ${(aob-boc)/2} = ${boc + (aob-boc)/2}°。`
      };
    }
    case 'num_line_range': {
      const val = -2;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '有理数·数轴',
        content: `在数轴上，到原点距离等于 3 的点所表示的数中，位于点 A（图中红点）左侧的是哪个数？`,
        svgContent: createNumberLineSVG(val, 'A'),
        correctAnswer: '-3',
        explanation: `到原点距离为 3 的数有 3 和 -3。图中点 A 表示 -2。位于 -2 左侧的数比 -2 小，故为 -3。`
      };
    }
    case 'vertical_angle_graph': {
      const ang = 55;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '几何·对顶角',
        content: `两条直线相交，已知 ∠1 = ${ang}°，则它的对顶角 ∠3 = ？`,
        correctAnswer: ang.toString(),
        explanation: `对顶角相等。由于 ∠1 和 ∠3 是对顶角，所以 ∠3 = ∠1 = ${ang}°。`
      };
    }
    case 'complementary_graph': {
      const ang = 35;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '几何·余角性质',
        content: `如图 ∠AOB = 90°，若 ∠1 = ${ang}°，求 ∠2 的度数。`,
        svgContent: createAngleSVG([ang, 90-ang], ['O', 'A', 'M', 'B']),
        correctAnswer: (90 - ang).toString(),
        explanation: `∠AOB 是直角（90°），∠1 与 ∠2 互余。∠2 = 90° - ${ang}° = ${90-ang}°。`
      };
    }
    case 'angle_sum_around': {
      const a = 120, b = 130;
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.HARD, topic: '几何·周角性质',
        content: `从点 O 引出三条射线 OA, OB, OC。已知 ∠AOB = ${a}°，∠BOC = ${b}°，求 ∠AOC 的度数（小于180°的部分）。`,
        correctAnswer: (360 - a - b).toString(),
        explanation: `周角为 360°。∠AOC = 360° - ∠AOB - ∠BOC = 360 - ${a} - ${b} = ${360-a-b}°。`
      };
    }
    case 'algebra_geometric_area': {
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '整式·几何应用',
        content: `一个长方形的长为 2a，宽为 a+3，则这个长方形的面积可以表示为？`,
        correctAnswer: `2a^2+6a`,
        explanation: `面积 = 长 × 宽 = 2a(a + 3) = 2a² + 6a。`
      };
    }
    case 'equation_balance': {
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.MEDIUM, topic: '方程·等式性质',
        content: `天平左边放 2 个相同的球和 5g 砝码，右边放 15g 砝码，天平平衡。设球重 x 克，列方程得？`,
        correctAnswer: `2x+5=15`,
        explanation: `左边重量 2x + 5，右边重量 15。平衡意味着两边相等。`
      };
    }
    default: {
      return {
        id, subject: Subject.MATH, difficulty: Difficulty.EASY, topic: '有理数·相反数',
        content: `若 a = -8，则 a 的相反数与 -3 的和是？`,
        correctAnswer: '5',
        explanation: `-8 的相反数是 8。8 + (-3) = 5。`
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
  ],
  [Subject.MATH]: [], 
  [Subject.ENGLISH]: [
    { id: 'e1', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '人称代词', content: '____ am a girl. ____ name is Lucy.', options: ['A. I; My', 'B. I; Me', 'C. My; I', 'D. Me; My'], correctAnswer: 'A', explanation: '第一空做主语用主格I，第二空做定语用物主代词My。' },
    { id: 'e2', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '冠词用法', content: 'This is ____ apple. It is ____ red apple.', options: ['A. a; a', 'B. an; an', 'C. an; a', 'D. a; an'], correctAnswer: 'C', explanation: 'apple是以元音音素开头，用an；red是以辅音音素开头，用a。' },
    { id: 'e3', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '单复数转换', content: 'What are those? They are ____.', options: ['A. box', 'B. boxs', 'C. boxes', 'D. boxing'], correctAnswer: 'C', explanation: '以x结尾的名词变复数加es。' },
    { id: 'e4', subject: Subject.ENGLISH, difficulty: Difficulty.CONCEPT, topic: '日常用语', content: '—How do you spell "pen"? —____.', options: ['A. It is a pen', 'B. P-E-N', 'C. Yes, I can', 'D. No, thanks'], correctAnswer: 'B', explanation: '询问如何拼写，需要按字母顺序读出。' },
  ]
};

export function getRandomQuestions(subject: Subject, count: number): Question[] {
  let results: Question[] = [];
  if (subject === Subject.MATH) {
    for (let i = 0; i < count; i++) {
      results.push(generateMathQuestion(`math-${Date.now()}-${i}-${Math.random()}`));
    }
  } else {
    const bank = OFFLINE_BANK[subject];
    const shuffled = [...bank].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count; i++) {
      const q = shuffled[i % shuffled.length];
      results.push({ ...q, id: `${q.id}-${Date.now()}-${i}` });
    }
  }
  return results;
}
