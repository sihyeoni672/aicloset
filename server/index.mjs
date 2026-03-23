import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "aicloset",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const makeRecommendationKey = (item) => {
  return [
    item?.top || "",
    item?.bottom || "",
    item?.outer || "",
    item?.shoes || "",
  ]
    .join("|")
    .toLowerCase()
    .trim();
};

const scoreItemForWeather = (item, weather) => {
  const season = normalizeText(item.season);
  const name = normalizeText(item.name);
  let score = 0;

  if (weather === "sunny") {
    if (season.includes("봄") || season.includes("여름")) score += 3;
    if (name.includes("셔츠") || name.includes("반팔") || name.includes("스커트")) score += 2;
  }

  if (weather === "cloudy") {
    if (season.includes("봄") || season.includes("가을")) score += 3;
    if (name.includes("니트") || name.includes("셔츠") || name.includes("데님")) score += 2;
  }

  if (weather === "rainy") {
    if (name.includes("자켓") || name.includes("바람막이") || name.includes("데님")) score += 3;
    if (season.includes("봄") || season.includes("가을")) score += 1;
  }

  if (weather === "cold") {
    if (season.includes("가을") || season.includes("겨울")) score += 4;
    if (name.includes("니트") || name.includes("코트") || name.includes("패딩") || name.includes("자켓")) score += 3;
  }

  return score;
};

const scoreItemForMood = (item, mood) => {
  const name = normalizeText(item.name);
  const color = normalizeText(item.color);
  let score = 0;

  if (mood === "출근룩") {
    if (name.includes("셔츠") || name.includes("슬랙스") || name.includes("자켓")) score += 3;
    if (color.includes("블랙") || color.includes("화이트") || color.includes("베이지") || color.includes("네이비")) score += 2;
  }

  if (mood === "캠퍼스룩") {
    if (name.includes("맨투맨") || name.includes("후드") || name.includes("데님") || name.includes("스니커즈")) score += 3;
  }

  if (mood === "데이트룩") {
    if (color.includes("화이트") || color.includes("크림") || color.includes("베이지") || color.includes("핑크")) score += 2;
    if (name.includes("니트") || name.includes("스커트") || name.includes("블라우스")) score += 3;
  }

  if (mood === "캐주얼룩") {
    if (name.includes("데님") || name.includes("티") || name.includes("스니커즈")) score += 3;
  }

  return score;
};

const scoreItem = (item, weather, mood) => {
  return scoreItemForWeather(item, weather) + scoreItemForMood(item, mood);
};

const sortByScore = (items, weather, mood) => {
  return [...items].sort((a, b) => scoreItem(b, weather, mood) - scoreItem(a, weather, mood));
};

const pickBest = (items, weather, mood) => {
  const sorted = sortByScore(items, weather, mood);
  return sorted[0] || null;
};

const buildDescription = ({ top, bottom, outer, shoes, weather, mood }) => {
  const parts = [];
  if (top) parts.push(`${top}를 중심으로`);
  if (bottom) parts.push(`${bottom}와 매치하고`);
  if (outer) parts.push(`${outer}로 레이어드를 더해`);
  if (shoes) parts.push(`${shoes}로 마무리하는`);
  return `${parts.join(" ")} ${mood} 느낌의 ${weather} 날씨용 코디예요.`.trim();
};

const buildPoint = ({ top, bottom, outer, weather, mood }) => {
  if (weather === "rainy") {
    return "비 오는 날에는 관리 쉬운 톤과 가벼운 아우터 조합이 실용적이에요.";
  }
  if (weather === "cold") {
    return "기온이 낮을수록 상의와 아우터의 레이어드가 스타일과 보온을 같이 챙겨줘요.";
  }
  if (mood === "데이트룩") {
    return "밝거나 부드러운 톤 아이템을 한 가지 넣으면 분위기가 더 살아나요.";
  }
  if (mood === "출근룩") {
    return "깔끔한 상하의 조합에 단정한 아우터를 더하면 안정감이 좋아요.";
  }
  if (outer) {
    return "아우터를 더해 실루엣이 정리되고 완성도가 높아져요.";
  }
  return "너무 과한 조합보다 기본형 아이템 중심으로 맞추면 실패가 적어요.";
};

const buildTitle = ({ top, bottom, outer, shoes }) => {
  const parts = [top, bottom, outer, shoes].filter(Boolean);
  return parts.slice(0, 3).join(" + ");
};

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const buildRecommendationsFromCloset = (closetItems, weather, mood) => {
  const tops = uniqueById(closetItems.filter((i) => i.category === "상의"));
  const bottoms = uniqueById(closetItems.filter((i) => i.category === "하의"));
  const outers = uniqueById(closetItems.filter((i) => i.category === "아우터"));
  const shoes = uniqueById(closetItems.filter((i) => i.category === "신발"));

  const sortedTops = sortByScore(tops, weather, mood);
  const sortedBottoms = sortByScore(bottoms, weather, mood);
  const sortedOuters = sortByScore(outers, weather, mood);
  const sortedShoes = sortByScore(shoes, weather, mood);

  const candidates = [];

  if (sortedTops.length && sortedBottoms.length) {
    for (const top of sortedTops.slice(0, 4)) {
      for (const bottom of sortedBottoms.slice(0, 4)) {
        const outer = weather === "cold" || weather === "rainy" || mood === "출근룩"
          ? sortedOuters.find((item) => item.id !== top.id && item.id !== bottom.id) || null
          : sortedOuters[0] || null;

        const shoe = sortedShoes[0] || null;

        candidates.push({
          tag: mood,
          title: buildTitle({
            top: top.name,
            bottom: bottom.name,
            outer: outer?.name || "",
            shoes: shoe?.name || "",
          }),
          top: top.name,
          bottom: bottom.name,
          outer: outer?.name || "",
          shoes: shoe?.name || "",
          desc: buildDescription({
            top: top.name,
            bottom: bottom.name,
            outer: outer?.name || "",
            shoes: shoe?.name || "",
            weather,
            mood,
          }),
          point: buildPoint({
            top: top.name,
            bottom: bottom.name,
            outer: outer?.name || "",
            weather,
            mood,
          }),
          score:
            scoreItem(top, weather, mood) +
            scoreItem(bottom, weather, mood) +
            (outer ? scoreItem(outer, weather, mood) : 0) +
            (shoe ? scoreItem(shoe, weather, mood) : 0),
        });
      }
    }
  }

  if (!candidates.length && sortedTops.length) {
    for (const top of sortedTops.slice(0, 4)) {
      const outer = (weather === "cold" || weather === "rainy") ? sortedOuters[0] || null : null;
      const shoe = sortedShoes[0] || null;

      candidates.push({
        tag: mood,
        title: buildTitle({
          top: top.name,
          bottom: "",
          outer: outer?.name || "",
          shoes: shoe?.name || "",
        }),
        top: top.name,
        bottom: "",
        outer: outer?.name || "",
        shoes: shoe?.name || "",
        desc: buildDescription({
          top: top.name,
          bottom: "",
          outer: outer?.name || "",
          shoes: shoe?.name || "",
          weather,
          mood,
        }),
        point: buildPoint({
          top: top.name,
          bottom: "",
          outer: outer?.name || "",
          weather,
          mood,
        }),
        score: scoreItem(top, weather, mood) + (outer ? scoreItem(outer, weather, mood) : 0),
      });
    }
  }

  if (!candidates.length && sortedBottoms.length) {
    for (const bottom of sortedBottoms.slice(0, 4)) {
      const shoe = sortedShoes[0] || null;

      candidates.push({
        tag: mood,
        title: buildTitle({
          top: "",
          bottom: bottom.name,
          outer: "",
          shoes: shoe?.name || "",
        }),
        top: "",
        bottom: bottom.name,
        outer: "",
        shoes: shoe?.name || "",
        desc: buildDescription({
          top: "",
          bottom: bottom.name,
          outer: "",
          shoes: shoe?.name || "",
          weather,
          mood,
        }),
        point: buildPoint({
          top: "",
          bottom: bottom.name,
          outer: "",
          weather,
          mood,
        }),
        score: scoreItem(bottom, weather, mood),
      });
    }
  }

  const deduped = [];
  const seen = new Set();

  for (const item of candidates.sort((a, b) => b.score - a.score)) {
    const key = makeRecommendationKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped.map(({ score, ...rest }) => rest);
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/clothes", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, name, category, color, season, image_url, created_at
       FROM clothes
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("GET /clothes error:", error);
    res.status(500).json({ message: "옷 목록 조회에 실패했습니다." });
  }
});

app.post("/clothes", upload.single("image"), async (req, res) => {
  try {
    const { name, category, color, season } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "이름과 카테고리는 필수입니다." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "이미지 파일이 필요합니다." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO clothes (user_id, name, category, color, season, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, name, category, color || "", season || "", imageUrl]
    );

    res.status(201).json({
      message: "저장 성공",
      id: result.insertId,
      image_url: imageUrl,
    });
  } catch (error) {
    console.error("POST /clothes error:", error);
    res.status(500).json({ message: "옷 저장에 실패했습니다." });
  }
});

app.delete("/clothes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT image_url FROM clothes WHERE id = ?`, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "삭제할 옷을 찾지 못했습니다." });
    }

    const imageUrl = rows[0].image_url;
    await pool.query(`DELETE FROM clothes WHERE id = ?`, [id]);

    if (imageUrl) {
      const filePath = path.join(__dirname, imageUrl.replace(/^\//, ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: "삭제 성공" });
  } catch (error) {
    console.error("DELETE /clothes/:id error:", error);
    res.status(500).json({ message: "삭제에 실패했습니다." });
  }
});

app.post("/api/recommend", async (req, res) => {
  try {
    const {
      closetItems = [],
      weather = "cloudy",
      mood = "출근룩",
      previousRecommendations = [],
      previousKeys = [],
    } = req.body;

    if (!Array.isArray(closetItems) || closetItems.length === 0) {
      return res.status(400).json({ message: "추천할 옷 데이터가 없습니다." });
    }

    const blockedKeys = new Set([
      ...previousKeys.map((v) => String(v).toLowerCase().trim()),
      ...previousRecommendations.map(makeRecommendationKey),
    ]);

    const candidates = buildRecommendationsFromCloset(closetItems, weather, mood);

    if (!candidates.length) {
      return res.json({ recommendations: [] });
    }

    const filtered = candidates.filter(
      (item) => !blockedKeys.has(makeRecommendationKey(item))
    );

    const source = filtered.length > 0 ? filtered : candidates;

    const shuffled = [...source].sort(() => Math.random() - 0.5);
    const finalRecommendations = shuffled.slice(0, 3);

    res.json({
      recommendations: finalRecommendations,
    });
  } catch (error) {
    console.error("POST /api/recommend error:", error);
    res.status(500).json({ error: "추천 생성 중 오류가 발생했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});