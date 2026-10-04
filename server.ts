import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { generateSmartFallback } from "./lib/smartFallbackGenerator";
import { generateWithOpenRouter } from "./lib/openRouterService";

// Load .env file automatically in development or node runtime
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile();
  }
} catch {
  // Ignore if .env doesn't exist yet
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for Content Generation with retry & automatic fallback models
async function generateWithFallbackAndRetry(params: { model: string; contents: any; config?: any }, retries = 1, delayMs = 1000) {
  let lastError: any = null;
  // Models in preferred order: requested model (or default 3.8-flash), then valid latest flash models
  const preferredModels = [
    params.model || "gemini-3.8-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  const uniqueModels = Array.from(new Set(preferredModels));
  
  for (const currentModel of uniqueModels) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Trying content generation with model ${currentModel}, attempt ${attempt}...`);
        const result = await ai.models.generateContent({
          ...params,
          model: currentModel
        });
        return result;
      } catch (err: any) {
        lastError = err;
        
        // If it's a client bad request (status 400), don't retry or switch model
        if (err.status === 400) {
          throw err;
        }

        // Check if quota is exhausted or model is experiencing high demand / unavailable
        const isQuotaOrUnavailable = err.status === 429 || 
          err.status === 503 ||
          err.status === 'RESOURCE_EXHAUSTED' ||
          err.status === 'UNAVAILABLE' ||
          err.code === 429 ||
          err.code === 503 ||
          String(err.status) === '429' ||
          String(err.status) === '503' ||
          (err.message && (
            err.message.includes('429') || 
            err.message.includes('503') || 
            err.message.includes('RESOURCE_EXHAUSTED') || 
            err.message.includes('UNAVAILABLE') || 
            err.message.includes('quota') || 
            err.message.includes('Quota') || 
            err.message.includes('high demand')
          ));
        
        if (isQuotaOrUnavailable) {
          console.log(`[Gemini] Model ${currentModel} reached capacity or quota, switching immediately to fallbacks...`);
          (err as any).status = 429;
          throw err;
        }

        console.log(`[Gemini] Attempt ${attempt} with model ${currentModel} note:`, err.message || err);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        }
      }
    }
  }

  const isQuota = lastError?.status === 429 || 
    (lastError?.message && (lastError.message.includes('429') || lastError.message.includes('RESOURCE_EXHAUSTED') || lastError.message.includes('quota')));

  if (isQuota) {
    const quotaError = new Error("تم استهلاك الحصة المتاحة لطلبات الذكاء الاصطناعي مؤقتاً (Quota Limit). يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.");
    (quotaError as any).status = 429;
    throw quotaError;
  }

  throw lastError || new Error("فشلت عملية التوليد بعد محاولات متعددة.");
}

// Helper for Image Generation with retry & fallback models
async function generateImageWithFallbackAndRetry(params: { model: string; contents: any; config?: any }, retries = 1, delayMs = 1000) {
  let lastError: any = null;
  const modelsToTry = [params.model, "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"];
  const uniqueModels = Array.from(new Set(modelsToTry));
  
  for (const currentModel of uniqueModels) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Trying image generation with model ${currentModel}, attempt ${attempt}...`);
        const result = await ai.models.generateContent({
          ...params,
          model: currentModel
        });
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt} with image model ${currentModel} failed:`, err.message);
        
        if (err.status === 400) {
          throw err;
        }
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
  }
  throw lastError || new Error("فشل إنشاء الصورة.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "مفتاح GEMINI_API_KEY غير متوفر في متغيرات البيئة الخاصة بالخادم المحلي أو حاوية العمل. يرجى تهيئة المتغير ليعمل الذكاء الاصطناعي بنجاح." 
        });
      }

      const { prompt, model = "gemini-3.8-flash", systemInstruction, responseSchema, responseMimeType, enableSearch, image, imageMimeType } = req.body;
      
      const config: any = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (responseSchema) config.responseSchema = responseSchema;
      if (responseMimeType) config.responseMimeType = responseMimeType;
      
      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      let contents: any = prompt;
      if (image && typeof image === 'string') {
        let mime = imageMimeType || 'image/jpeg';
        let b64 = image;
        if (image.startsWith('data:')) {
          const match = image.match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mime = match[1];
            b64 = match[2];
          }
        }
        contents = [
          {
            inlineData: {
              data: b64,
              mimeType: mime
            }
          },
          {
            text: prompt
          }
        ];
      }
      
      const response = await generateWithFallbackAndRetry({
        model: enableSearch ? "gemini-3.8-flash" : model,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined
      });
      
      const sources: Array<{ title: string; url: string }> = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(groundingChunks)) {
        for (const chunk of groundingChunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri
            });
          }
        }
      }
      
      res.json({ text: response.text, sources: sources.length > 0 ? sources : undefined });
    } catch (error: any) {
      const isQuotaOrUnavailable = error.status === 429 || 
        error.status === 503 ||
        error.status === 'RESOURCE_EXHAUSTED' ||
        error.status === 'UNAVAILABLE' ||
        error.code === 429 ||
        error.code === 503 ||
        error.message?.includes('429') || 
        error.message?.includes('503') || 
        error.message?.includes('RESOURCE_EXHAUSTED') || 
        error.message?.includes('UNAVAILABLE') || 
        error.message?.includes('quota') || 
        error.message?.includes('Quota') ||
        error.message?.includes('high demand');
      
      if (isQuotaOrUnavailable) {
        console.log("[AI Engine] Engaging fallback AI generation pipeline...");
        const { prompt, systemInstruction, image } = req.body;

        // Tier 2: If OpenRouter is configured in .env, generate live content from OpenRouter free models
        if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
          try {
            const openRouterText = await generateWithOpenRouter({
              prompt,
              systemInstruction,
              image
            });
            if (openRouterText) {
              return res.json({ 
                text: openRouterText,
                provider: "OpenRouter"
              });
            }
          } catch (orErr: any) {
            console.log("[AI Engine] OpenRouter step skipped, proceeding to smart fallback:", orErr?.message || orErr);
          }
        }

        // Tier 3: High-quality local semantic synthesis fallback
        const fallbackText = generateSmartFallback(prompt || '', systemInstruction);
        return res.json({ 
          text: fallbackText,
          isFallback: true,
          notice: "تم توليد هذا المحتوى بنمط التأليف الذكي الاحتياطي لتجاوز انشغال خوادم الحصة المجانية مؤقتاً."
        });
      }

      console.log("[AI Engine] Generate error:", error.message || error);
      res.status(error.status || 500).json({ 
        error: error.message || "حدث خطأ أثناء معالجة الطلب." 
      });
    }
  });

  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          error: "مفتاح GEMINI_API_KEY غير متوفر في البيئة." 
        });
      }
      const { prompt, aspectRatio = "3:4" } = req.body;
      
      const response = await generateImageWithFallbackAndRetry({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: "1K"
          }
        }
      });
      
      let imageUrl = null;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "لم يتم إنشاء أي صورة." });
      }
    } catch (error: any) {
      console.warn("Gemini API Error (Image), generating SVG book cover fallback:", error.message);
      const rawPrompt = req.body?.prompt || 'غلاف مستند';
      const cleanTitle = rawPrompt
        .replace(/تصميم غلاف كتاب احترافي:|النمط:.*|بدون نصوص.*/g, '')
        .replace(/["'"]/g, '')
        .trim() || 'غلاف كتاب رسمي';

      const svgCover = `data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
              <stop offset="40%" style="stop-color:#1e3a8a;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
            </linearGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="600" height="800" fill="url(#grad)" rx="16"/>
          <rect width="600" height="800" fill="url(#grid)" rx="16"/>
          <rect x="35" y="35" width="530" height="730" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" rx="10"/>
          <rect x="45" y="45" width="510" height="710" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" rx="8"/>
          
          <text x="300" y="130" fill="#93c5fd" font-family="'Cairo', sans-serif" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="3">JOE WORD • طبعة خاصة</text>
          <line x1="200" y1="150" x2="400" y2="150" stroke="#60a5fa" stroke-width="2" opacity="0.8"/>
          
          <text x="300" y="360" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="34" font-weight="900" text-anchor="middle">${cleanTitle}</text>
          <text x="300" y="415" fill="#cbd5e1" font-family="'Cairo', sans-serif" font-size="16" font-weight="400" text-anchor="middle">إصدار رسمي متكامل • توثيق وبحث علمي</text>
          
          <circle cx="300" cy="530" r="46" fill="rgba(59,130,246,0.15)" stroke="#60a5fa" stroke-width="2"/>
          <text x="300" y="542" fill="#ffffff" font-family="'Cairo', sans-serif" font-size="32" text-anchor="middle">📖</text>
          
          <line x1="180" y1="670" x2="420" y2="670" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
          <text x="300" y="705" fill="#94a3b8" font-family="'Cairo', sans-serif" font-size="13" text-anchor="middle">تم التصميم والتنسيق عبر Joe Word</text>
        </svg>
      `.trim())}`;

      res.json({ imageUrl: svgCover, isFallback: true });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
