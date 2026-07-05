import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/gemini/generate", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: "مفتاح GEMINI_API_KEY غير متوفر في إعدادات البيئة (Environment Variables) الخاصة بموقعك على Vercel. يرجى الدخول إلى لوحة تحكم Vercel وإضافة هذا المتغير ليعمل الذكاء الاصطناعي بنجاح." 
      });
    }

    const { prompt, model = "gemini-3.5-flash", systemInstruction, responseSchema, responseMimeType } = req.body;
    
    const config: any = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (responseSchema) config.responseSchema = responseSchema;
    if (responseMimeType) config.responseMimeType = responseMimeType;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
