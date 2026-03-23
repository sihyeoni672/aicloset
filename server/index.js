const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

const uploadsDir = path.join(__dirname, "uploads");
if (fs.existsSync(uploadsDir)) {
  const stat = fs.statSync(uploadsDir);
  if (!stat.isDirectory()) {
    fs.unlinkSync(uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} else {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "1234",
  database: "aicloset",
});

db.connect((err) => {
  if (err) {
    console.log("DB 연결 실패:", err);
  } else {
    console.log("DB 연결 성공");
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일만 업로드 가능합니다."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.get("/", (req, res) => {
  res.json({ message: "AI Closet 서버 실행 중" });
});

app.post("/clothes", (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.log("multer 에러:", err);
      return res.status(400).json({
        message: err.message || "파일 업로드 실패",
      });
    }
    next();
  });
});

app.post("/clothes", (req, res) => {
  try {
    const { name, category, color, season } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !category) {
      return res.status(400).json({
        message: "name과 category는 필수입니다.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "이미지 파일이 없습니다.",
      });
    }

    const sql = `
      INSERT INTO clothes (user_id, name, category, color, season, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [1, name, category, color || null, season || null, image_url], (err, result) => {
      if (err) {
        console.log("DB 저장 실패:", err);
        return res.status(500).json({
          message: "DB 저장 실패",
          error: err.message,
        });
      }

      res.status(201).json({
        message: "저장 성공",
        id: result.insertId,
        image_url,
      });
    });
  } catch (error) {
    console.log("서버 오류:", error);
    res.status(500).json({
      message: "서버 오류",
      error: error.message,
    });
  }
});

app.get("/clothes", (req, res) => {
  db.query("SELECT * FROM clothes ORDER BY id DESC", (err, result) => {
    if (err) {
      console.log("조회 실패:", err);
      return res.status(500).json({
        message: "조회 실패",
        error: err.message,
      });
    }
    res.json(result);
  });
});

app.delete("/clothes/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT image_url FROM clothes WHERE id = ?", [id], (selectErr, selectResult) => {
    if (selectErr) {
      return res.status(500).json({ message: "삭제 실패" });
    }

    if (selectResult.length === 0) {
      return res.status(404).json({ message: "해당 옷이 없습니다." });
    }

    const imageUrl = selectResult[0].image_url;

    db.query("DELETE FROM clothes WHERE id = ?", [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        return res.status(500).json({ message: "삭제 실패" });
      }

      if (imageUrl) {
        const cleanImageUrl = imageUrl.replace(/^\/+/, "");
        const imagePath = path.join(__dirname, cleanImageUrl);
        fs.unlink(imagePath, () => {});
      }

      res.json({
        message: "삭제 성공",
        affectedRows: deleteResult.affectedRows,
      });
    });
  });
});

app.use((err, req, res, next) => {
  console.log("전역 에러:", err);
  res.status(500).json({
    message: err.message || "서버 내부 오류",
  });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});