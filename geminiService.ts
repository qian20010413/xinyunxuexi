import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Difficulty, Question } from "./types";

/**
 * ✅ 前端环境正确读取 API Key
 * ⚠️ 必须在 Vercel 环境变量中配置：VITE_GEMINI_API_KEY
 */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

/**
 * ✅ 关键：没有 Key 就不初始化
 * 👉 防止页面在浏览器中直接白屏
 */
const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

/**
 * ================== Schema 定义（保持不变） ==================
 */

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    content: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "针对选择题提供4个选项。如果是填空题，此数组为空。"
    },
    correctAnswer: {
      type: Type.STRING,
      description:
        "如果是选择题，必须且只能返回单个大写字母 A/B/C/D。如果是填空题，返回标准答案字符串。"
    },
    explanation: { type: Type.STRING }
  },
  required: ["topic", "content", "correctAnswer", "explanation"]
};

const SESSION_SCHEMA = {
  type: Type.ARRAY,
  items: QUESTION_SCHEMA
};

/**
 * ================== 生成整套题目 ==================
 */

export async function generateSessionQuestions(
  subject: Subject,
  count: number = 20
): Promise<Question[]> {

  /**
   * ✅ 兜底：没配置 Key 时不抛异常
   * 👉 页面不会白屏
   */
  if (!ai) {
    console.warn("Gemini API Key not configured");
    return [];
  }

  const prompt = `
你是一位资深的中国初中老师，正在为七年级学生杜欣芸编写一套专题练习卷。

【核心要求】：
1. 范围限制：必须严格限定在【人教版七年级上册】。绝对不要出现七年级下册或更高年级的内容。
2. 科目：${subject}。
3. 题目数量：${count}道。
4. 难度分布：前5题基础，中间12题简单/进阶，最后3题综合挑战。
5. 题目形式：优先选择题。
6. 【极其重要】：对于选择题，你的 correctAnswer 字段必须只能是 "A", "B", "C" 或 "D" 中的一个，不能包含点号或选项内容。
7. 解析要求：用亲切的姐姐口吻讲解，解析要详细，多鼓励。

返回 JSON 格式的题目数组。
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SESSION_SCHEMA
      }
    });

    const rawQuestions = JSON.parse(response.text.trim());

    return rawQuestions.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`,
      subject,
      difficulty:
        index < 5
          ? Difficulty.CONCEPT
          : index < 17
          ? Difficulty.EASY
          : Difficulty.HARD,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Failed to generate session:", error);
    throw error;
  }
}

/**
 * ================== 生成单题 ==================
 */

export async function generateQuestion(
  subject: Subject,
  difficulty: Difficulty
): Promise<Question> {

  /**
   * ✅ 单题这里选择显式报错（由 UI 捕获）
   */
  if (!ai) {
    throw new Error("Gemini API Key not configured");
  }

  const prompt = `
请针对人教版七年级上册 ${subject}
出 1 道 ${difficulty} 难度的题目。
如果是选择题，答案只给一个字母。
返回 JSON 格式。
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: QUESTION_SCHEMA
    }
  });

  const data = JSON.parse(response.text.trim());

  return {
    ...data,
    id: `q-${Date.now()}`,
    subject,
    difficulty,
    timestamp: Date.now()
  };
}
