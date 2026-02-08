
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Difficulty, Question, AiConfig } from "./types";

// Default config for Gemini if none provided
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

async function callOpenAiCompatible(config: AiConfig, prompt: string): Promise<any> {
  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        { role: 'system', content: '你是一位资深的中国初中老师。请严格按照JSON格式返回题目。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "AI 接口请求失败");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generateSessionQuestions(
  subject: Subject, 
  config: AiConfig,
  count: number = 20
): Promise<Question[]> {
  const prompt = `
    你正在为七年级学生杜欣芸编写一套专题练习卷。
    科目：${subject}。数量：${count}。
    范围：【人教版七年级上册】。
    
    返回JSON数组，每个对象包含：
    - topic: 知识点
    - content: 题目内容
    - options: 如果是选择题则提供4个选项数组，填空题为空数组
    - correctAnswer: 选择题仅给字母 A/B/C/D，填空题给文本
    - explanation: 亲切详细的解析
    
    难度分布：前5题基础，中间12题简单/进阶，最后3题综合挑战。
  `;

  try {
    // Fix: Use 'any' type and initialize with an empty array to prevent type mismatch errors
    // when assigning results from different AI providers that might return nested objects.
    let result: any = [];
    
    if (config.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const response = await ai.models.generateContent({
        model: config.modelName || DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      // Fix: Safely handle response.text property (not a method)
      const responseText = response.text || "[]";
      result = JSON.parse(responseText.trim());
    } else {
      result = await callOpenAiCompatible(config, prompt);
      // If the domestic AI returns an object with a field like 'questions', extract it
      if (result && !Array.isArray(result) && (result as any).questions) {
        result = (result as any).questions;
      }
      if (result && !Array.isArray(result)) {
         // Fallback for some AI that wrap the array in an object
         const possibleArray = Object.values(result).find(val => Array.isArray(val));
         if (possibleArray) result = possibleArray;
      }
    }

    // Fix: Ensure result is an array before attempting to use .map() to avoid runtime errors
    if (!Array.isArray(result)) {
      throw new Error("AI 返回格式解析失败，未获取到有效题目列表");
    }

    return result.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`,
      subject,
      difficulty: index < 5 ? Difficulty.CONCEPT : index < 12 ? Difficulty.EASY : index < 17 ? Difficulty.MEDIUM : Difficulty.HARD,
      timestamp: Date.now()
    }));
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "获取题目失败，请检查 AI 配置或网络");
  }
}
