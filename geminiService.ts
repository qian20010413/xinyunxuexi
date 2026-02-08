
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Difficulty, Question } from "./types";

// Initialize Gemini API with the correct structure and model
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an educational question using Gemini 3 Flash.
 * Uses structured output (responseSchema) to ensure consistency with the app's types.
 */
export async function generateAiQuestion(subject: Subject, difficulty: Difficulty): Promise<Question | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `为七年级学生生成一道${subject}学科的${difficulty}难度的练习题。题目需要符合人教版教材标准，侧重能力提优。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: '知识点名称' },
            content: { type: Type.STRING, description: '题目正文' },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: '如果是多项选择题，提供4个选项（如 A. xxx）；如果是填空题则提供空数组'
            },
            correctAnswer: { type: Type.STRING, description: '正确答案（字母或数值）' },
            explanation: { type: Type.STRING, description: '详细的解题思路和知识点解析' },
          },
          required: ["topic", "content", "correctAnswer", "explanation"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    // Validate result and return formatted Question
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      subject,
      difficulty,
      topic: result.topic || '综合练习',
      content: result.content,
      options: result.options && result.options.length > 0 ? result.options : undefined,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    return null;
  }
}
