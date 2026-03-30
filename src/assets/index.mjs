import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "aicloset",
  waitForConnections: true,
  connectionLimit: 10,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("AI Closet server running");
});

app.post("/api/signup", async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "아이디와 비밀번호는 필수입니다." });
    }

    const [exists] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (exists.length > 0) {
      return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
    }

    const [result] = await db.query(
      "INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)",
      [username, password, nickname || null]
    );

    res.json({
      message: "회원가입 성공",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("signup error:", error);
    res.status(500).json({ message: "회원가입 실패" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query(
      "SELECT id, username, nickname FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
    }

    res.json({
      message: "로그인 성공",
      user: rows[0],
    });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ message: "로그인 실패" });
  }
});

app.get("/api/clothes/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM clothes WHERE user_id = ? ORDER BY id DESC",
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("get clothes error:", error);
    res.status(500).json({ message: "옷 목록 조회 실패" });
  }
});

app.post("/api/clothes", async (req, res) => {
  try {
    const { user_id, name, category, color, season, image_url } = req.body;

    if (!user_id || !name || !category) {
      return res.status(400).json({ message: "user_id, name, category는 필수입니다." });
    }

    const [result] = await db.query(
      `INSERT INTO clothes (user_id, name, category, color, season, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, name, category, color || null, season || null, image_url || null]
    );

    res.json({
      message: "옷 저장 성공",
      id: result.insertId,
    });
  } catch (error) {
    console.error("add clothes error:", error);
    res.status(500).json({ message: "옷 저장 실패" });
  }
});

app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city || "Busan";
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "날씨 API 키가 없습니다." });
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=kr`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        message: data.message || "날씨 정보를 불러오지 못했습니다.",
      });
    }

    res.json({
      city: data.name,
      temp: data.main.temp,
      description: data.weather?.[0]?.description || "",
    });
  } catch (error) {
    console.error("weather error:", error);
    res.status(500).json({ message: "날씨 조회 실패" });
  }
});

app.post("/api/recommend", async (req, res) => {
  try {
    const { closetItems, weather, mood } = req.body;

    if (!closetItems || !Array.isArray(closetItems) || closetItems.length === 0) {
      return res.status(400).json({ message: "옷장 데이터가 필요합니다." });
    }

    const prompt = `
너는 패션 코디 추천 AI야.
반드시 사용자가 가진 옷만 사용해서 추천해.
정확히 3개의 코디를 JSON으로만 반환해.
설명 문장이나 코드블록 없이 JSON만 출력해.

사용자 옷장:
${JSON.stringify(closetItems, null, 2)}

날씨:
${JSON.stringify(weather, null, 2)}

사용자 분위기:
${mood || "없음"}

반환 형식:
{
  "recommendations": [
    {
      "title": "비즈니스 캐주얼",
      "description": "설명",
      "items": [
        { "category": "상의", "name": "셔츠" },
        { "category": "하의", "name": "슬랙스" },
        { "category": "신발", "name": "로퍼" }
      ]
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text.trim();
    const parsed = JSON.parse(text);

    res.json(parsed);
  } catch (error) {
    console.error("recommend error:", error);
    res.status(500).json({ message: "AI 추천 실패", error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});