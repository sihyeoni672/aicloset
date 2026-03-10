import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("AI Closet Server Running");
});

app.post("/api/recommend", async (req, res) => {
  try {
    const { closetItems, weather, mood } = req.body;

    const prompt = `
너는 패션 코디 추천 AI다.

규칙:
1. 반드시 사용자가 가진 옷만 사용해라.
2. 없는 옷은 절대 추천하지 마라.
3. 날씨와 분위기를 반영해라.
4. 추천은 정확히 3개 만들어라.
5. 반드시 JSON만 출력해라.
6. 코드블록(\`\`\`)은 절대 쓰지 마라.

사용자 옷장:
${JSON.stringify(closetItems, null, 2)}

날씨:
${weather}

분위기:
${mood}

반드시 아래 형식의 JSON만 출력:
{
  "recommendations": [
    {
      "title": "추천 제목",
      "desc": "코디 설명",
      "tag": "스타일 태그"
    },
    {
      "title": "추천 제목",
      "desc": "코디 설명",
      "tag": "스타일 태그"
    },
    {
      "title": "추천 제목",
      "desc": "코디 설명",
      "tag": "스타일 태그"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "";
    console.log("Gemini 원본 응답:", text);

    text = text.trim();

    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(text);

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      return res.status(500).json({
        error: "recommendations 형식이 올바르지 않습니다.",
        detail: parsed,
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error("서버 오류:", error);
    res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      detail: error?.message || String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});