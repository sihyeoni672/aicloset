import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import multer from "multer";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

const upload = multer({
  dest: uploadsDir,
});

const db = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "aicloset",
});

console.log("MySQL 연결 성공");

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      nickname: user.nickname || "",
    },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}

function pickRandom(arr) {
  if (!arr.length) return "";
  return arr[Math.floor(Math.random() * arr.length)].name;
}

function buildFallbackRecommendations(closetItems, weather, mood) {
  const tops = closetItems.filter((item) => item.category === "상의");
  const bottoms = closetItems.filter((item) => item.category === "하의");
  const outers = closetItems.filter((item) => item.category === "아우터");
  const shoes = closetItems.filter((item) => item.category === "신발");

  const recs = [];

  for (let i = 0; i < 3; i += 1) {
    const top = pickRandom(tops);
    const bottom = pickRandom(bottoms);
    const outer =
      weather === "rainy" || weather === "cold" || weather === "cloudy"
        ? pickRandom(outers)
        : "";
    const shoe = pickRandom(shoes);

    recs.push({
      tag:
        mood === "출근룩"
          ? "비즈니스 캐주얼"
          : mood === "데이트룩"
          ? "모던 캐주얼"
          : mood === "캠퍼스룩"
          ? "캠퍼스 데일리"
          : "데일리 캐주얼",
      title: `${mood} 추천 코디 ${i + 1}`,
      top,
      bottom,
      outer,
      shoes: shoe,
      desc: `${weather} 날씨에 어울리도록 현재 옷장에 저장된 아이템만으로 조합한 코디예요.`,
      point: `${top || "상의"}와 ${bottom || "하의"} 중심으로 무난하게 입기 좋아요.`,
    });
  }

  return recs.filter((item) => item.top || item.bottom || item.outer || item.shoes);
}

app.post("/api/signup", async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "아이디와 비밀번호를 입력해주세요.",
      });
    }

    const [exists] = await db.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (exists.length > 0) {
      return res.status(400).json({
        error: "이미 존재하는 아이디입니다.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)",
      [username, hashedPassword, nickname || null]
    );

    res.json({
      message: "회원가입이 완료되었습니다.",
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({
      error: "회원가입 중 오류가 발생했습니다.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "아이디와 비밀번호를 입력해주세요.",
      });
    }

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({
        error: "아이디 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        error: "아이디 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = createToken(user);

    res.json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || "",
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({
      error: "로그인 중 오류가 발생했습니다.",
    });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, username, nickname FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("내 정보 조회 오류:", error);
    res.status(500).json({ error: "내 정보 조회 중 오류가 발생했습니다." });
  }
});

app.get("/api/clothes", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM clothes WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("옷 목록 조회 오류:", error);
    res.status(500).json({
      error: "옷 목록 조회 실패",
      detail: error.message,
    });
  }
});

app.post(
  "/api/clothes",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, category, color, season } = req.body;

      if (!name || !category) {
        return res.status(400).json({
          error: "이름과 카테고리는 필수입니다.",
        });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const [result] = await db.execute(
        "INSERT INTO clothes (user_id, name, category, color, season, image_url) VALUES (?, ?, ?, ?, ?, ?)",
        [req.user.id, name, category, color || null, season || null, imageUrl]
      );

      const [rows] = await db.execute("SELECT * FROM clothes WHERE id = ?", [
        result.insertId,
      ]);

      res.json(rows[0]);
    } catch (error) {
      console.error("옷 저장 오류:", error);
      res.status(500).json({
        error: "옷 저장 실패",
        detail: error.message,
      });
    }
  }
);

app.delete("/api/clothes/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM clothes WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "삭제할 옷을 찾을 수 없습니다.",
      });
    }

    await db.execute("DELETE FROM clothes WHERE id = ? AND user_id = ?", [
      id,
      req.user.id,
    ]);

    res.json({ message: "삭제 완료" });
  } catch (error) {
    console.error("옷 삭제 오류:", error);
    res.status(500).json({
      error: "옷 삭제 실패",
      detail: error.message,
    });
  }
});

app.post("/api/recommend", authMiddleware, async (req, res) => {
  try {
    const { weather, mood, previousKeys = [] } = req.body;

    const [rows] = await db.execute(
      "SELECT * FROM clothes WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );

    const closetItems = rows;

    if (!closetItems.length) {
      return res.status(400).json({
        error: "옷장에 저장된 옷이 없습니다.",
      });
    }

    const grouped = {
      상의: closetItems.filter((item) => item.category === "상의").map((item) => item.name),
      하의: closetItems.filter((item) => item.category === "하의").map((item) => item.name),
      아우터: closetItems.filter((item) => item.category === "아우터").map((item) => item.name),
      신발: closetItems.filter((item) => item.category === "신발").map((item) => item.name),
    };

    if (!ai) {
      return res.json({
        recommendations: buildFallbackRecommendations(closetItems, weather, mood),
      });
    }

    const prompt = `
너는 사용자의 옷장만으로 코디를 추천하는 스타일리스트다.

절대 규칙:
1. 반드시 아래 옷장 목록에 있는 "name" 값만 사용한다.
2. 목록에 없는 옷 이름을 새로 만들면 안 된다.
3. top, bottom, outer, shoes 값은 반드시 아래 목록 중 하나이거나 빈 문자열("")이어야 한다.
4. 정확히 3개의 추천만 반환한다.
5. previousKeys와 최대한 겹치지 않게 한다.
6. JSON 외의 설명은 절대 출력하지 않는다.

현재 날씨: ${weather}
현재 무드: ${mood}

옷장 목록:
상의: ${JSON.stringify(grouped.상의)}
하의: ${JSON.stringify(grouped.하의)}
아우터: ${JSON.stringify(grouped.아우터)}
신발: ${JSON.stringify(grouped.신발)}

이전 추천 키:
${JSON.stringify(previousKeys)}

반환 형식:
{
  "recommendations": [
    {
      "tag": "비즈니스 캐주얼",
      "title": "코디 제목",
      "top": "상의 이름",
      "bottom": "하의 이름",
      "outer": "아우터 이름 또는 빈 문자열",
      "shoes": "신발 이름 또는 빈 문자열",
      "desc": "왜 이 조합이 어울리는지 설명",
      "point": "스타일 포인트"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim?.() || "";
    const parsed = JSON.parse(text);

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      return res.status(500).json({
        error: "recommendations 형식이 올바르지 않습니다.",
      });
    }

    const validNames = new Set(closetItems.map((item) => item.name));

    const safeRecommendations = parsed.recommendations
      .map((item) => ({
        tag: item.tag || "추천 코디",
        title: item.title || "추천 룩",
        top: item.top || "",
        bottom: item.bottom || "",
        outer: item.outer || "",
        shoes: item.shoes || "",
        desc: item.desc || "",
        point: item.point || "",
      }))
      .filter((item) => {
        const parts = [item.top, item.bottom, item.outer, item.shoes].filter(Boolean);
        return parts.every((name) => validNames.has(name));
      });

    if (!safeRecommendations.length) {
      return res.json({
        recommendations: buildFallbackRecommendations(closetItems, weather, mood),
      });
    }

    res.json({
      recommendations: safeRecommendations,
    });
  } catch (error) {
    console.error("추천 서버 오류:", error);

    const message = error?.message || String(error);

    if (
      message.includes("503") ||
      message.includes("high demand") ||
      message.includes("UNAVAILABLE")
    ) {
      return res.json({
        recommendations: buildFallbackRecommendations([], "cloudy", "캐주얼룩"),
      });
    }

    return res.status(500).json({
      error: "서버 오류가 발생했습니다.",
      detail: message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});