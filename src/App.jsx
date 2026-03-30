import "./App.css";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:4000";

const weatherOptions = [
  { key: "sunny", label: "맑음", icon: "☀️" },
  { key: "cloudy", label: "흐림", icon: "☁️" },
  { key: "rainy", label: "비", icon: "🌧️" },
  { key: "cold", label: "추움", icon: "🧣" },
];

const moodOptions = ["출근룩", "캠퍼스룩", "데이트룩", "캐주얼룩"];

const tabs = [
  { key: "home", label: "홈", icon: "🏠" },
  { key: "closet", label: "옷장", icon: "👚" },
  { key: "recommend", label: "추천", icon: "✨" },
  { key: "favorites", label: "찜", icon: "❤️" },
  { key: "profile", label: "내정보", icon: "👤" },
];

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    username: "",
    password: "",
    nickname: "",
  });
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("home");
  const [clothes, setClothes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savedLooks, setSavedLooks] = useState(() => {
    try {
      const raw = localStorage.getItem("savedLooks");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [weatherKey, setWeatherKey] = useState("cloudy");
  const [selectedMood, setSelectedMood] = useState("출근룩");
  const [loading, setLoading] = useState(false);
  const [selectedImageItem, setSelectedImageItem] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "상의",
    color: "",
    season: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const favoriteItems = useMemo(
    () => (Array.isArray(clothes) ? clothes.filter((item) => item.liked) : []),
    [clothes]
  );

  const totalFavoriteCount = favoriteItems.length + savedLooks.length;

  useEffect(() => {
    localStorage.setItem("savedLooks", JSON.stringify(savedLooks));
  }, [savedLooks]);

  useEffect(() => {
    if (token) {
      fetchMe();
      fetchClothes();
    } else {
      setClothes([]);
      setRecommendations([]);
    }
  }, [token]);

  const authFetch = async (url, options = {}) => {
    const nextHeaders = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    return fetch(url, {
      ...options,
      headers: nextHeaders,
    });
  };

  const fetchMe = async () => {
    try {
      const response = await authFetch(`${API_BASE}/api/me`);
      const data = await response.json();

      if (!response.ok) {
        logout();
        return;
      }

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch (error) {
      console.error("내 정보 조회 오류:", error);
      logout();
    }
  };

  const fetchClothes = async () => {
    try {
      const response = await authFetch(`${API_BASE}/api/clothes`);
      const data = await response.json();

      if (!response.ok) {
        console.error("옷 목록 조회 실패:", data);
        setClothes([]);
        return;
      }

      setClothes(
        Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              liked: item.liked ?? false,
            }))
          : []
      );
    } catch (error) {
      console.error("옷 목록 조회 오류:", error);
      setClothes([]);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);

      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "로그인 실패");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      alert(error.message || "로그인에 실패했습니다.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      setAuthLoading(true);

      const response = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "회원가입 실패");
      }

      alert("회원가입이 완료되었습니다. 이제 로그인해주세요.");
      setAuthMode("login");
      setSignupForm({ username: "", password: "", nickname: "" });
    } catch (error) {
      alert(error.message || "회원가입에 실패했습니다.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setClothes([]);
    setRecommendations([]);
    setActiveTab("home");
  };

  const handleUpload = async () => {
    if (!form.name.trim()) {
      alert("옷 이름을 입력해주세요.");
      return;
    }

    if (!selectedFile) {
      alert("사진을 선택해주세요.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("color", form.color);
      formData.append("season", form.season);
      formData.append("image", selectedFile);

      const response = await authFetch(`${API_BASE}/api/clothes`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "업로드 실패");
      }

      setForm({
        name: "",
        category: "상의",
        color: "",
        season: "",
      });
      setSelectedFile(null);

      const fileInput = document.getElementById("clothes-image-input");
      if (fileInput) fileInput.value = "";

      await fetchClothes();
      alert("저장되었습니다.");
      setActiveTab("closet");
    } catch (error) {
      alert(error.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 옷을 삭제할까요?")) return;

    try {
      const response = await authFetch(`${API_BASE}/api/clothes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "삭제 실패");
      }

      await fetchClothes();
    } catch (error) {
      alert(error.message || "삭제에 실패했습니다.");
    }
  };

  const toggleFavorite = (id) => {
    setClothes((prev) =>
      Array.isArray(prev)
        ? prev.map((item) =>
            item.id === id ? { ...item, liked: !item.liked } : item
          )
        : []
    );
  };

  const getRecommendationKey = (item) => {
    return [item?.top || "", item?.bottom || "", item?.outer || "", item?.shoes || ""]
      .join("|")
      .toLowerCase()
      .trim();
  };

  const normalizeText = (value) =>
    String(value || "").toLowerCase().replace(/\s+/g, "").trim();

  const findClosetMatch = (keyword, category) => {
    const items = Array.isArray(clothes)
      ? clothes.filter((item) => item.category === category)
      : [];

    if (!items.length) return null;

    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) return null;

    const exact = items.find(
      (item) => normalizeText(item.name) === normalizedKeyword
    );
    if (exact) return exact;

    const partial = items.find(
      (item) =>
        normalizeText(item.name).includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizeText(item.name))
    );
    if (partial) return partial;

    return null;
  };

  const getRecommendationPreviewItems = (item) => {
    return [
      {
        label: "상의",
        closetItem: item.top ? findClosetMatch(item.top, "상의") : null,
        text: item.top || "상의 없음",
        emoji: "👕",
      },
      {
        label: "하의",
        closetItem: item.bottom ? findClosetMatch(item.bottom, "하의") : null,
        text: item.bottom || "하의 없음",
        emoji: "👖",
      },
      {
        label: "아우터",
        closetItem: item.outer ? findClosetMatch(item.outer, "아우터") : null,
        text: item.outer || "아우터 없음",
        emoji: "🧥",
      },
      {
        label: "신발",
        closetItem: item.shoes ? findClosetMatch(item.shoes, "신발") : null,
        text: item.shoes || "신발 없음",
        emoji: "👟",
      },
    ];
  };

  const isSavedLook = (look) => {
    const key = getRecommendationKey(look);
    return savedLooks.some((item) => getRecommendationKey(item) === key);
  };

  const toggleSavedLook = (look) => {
    const key = getRecommendationKey(look);

    setSavedLooks((prev) => {
      const exists = prev.some((item) => getRecommendationKey(item) === key);

      if (exists) {
        return prev.filter((item) => getRecommendationKey(item) !== key);
      }

      return [{ ...look }, ...prev];
    });
  };

  const getAIRecommendation = async () => {
    try {
      setLoading(true);

      const previousKeys = recommendations.map(getRecommendationKey);

      const response = await authFetch(`${API_BASE}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closetItems: clothes,
          weather: weatherKey,
          mood: selectedMood,
          previousKeys,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "추천 실패");
      }

      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
      setActiveTab("recommend");
    } catch (error) {
      alert(error.message || "추천을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderClosetCard = (item) => (
    <div className="closet-card" key={item.id}>
      <div className="closet-icon">
        {item.image_url ? (
          <img
            src={`${API_BASE}${item.image_url}`}
            alt={item.name}
            style={{
              width: "56px",
              height: "56px",
              objectFit: "cover",
              borderRadius: "12px",
              cursor: "pointer",
            }}
            onClick={() => setSelectedImageItem(item)}
          />
        ) : item.category === "상의" ? (
          "👕"
        ) : item.category === "하의" ? (
          "👖"
        ) : item.category === "아우터" ? (
          "🧥"
        ) : (
          "👟"
        )}
      </div>

      <div className="closet-card-body">
        <div>
          <h4>{item.name}</h4>
          <p>
            {item.category} · {item.color || "색상미정"}
            {item.season ? ` · ${item.season}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className={`like-btn ${item.liked ? "liked" : ""}`}
            onClick={() => toggleFavorite(item.id)}
            type="button"
          >
            {item.liked ? "❤️" : "🤍"}
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => handleDelete(item.id)}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecommendationPreview = (item) => {
    const previewItems = getRecommendationPreviewItems(item);

    return (
      <div className="look-preview-grid">
        {previewItems.map((part, index) => (
          <div className="look-preview-card" key={`${part.label}-${index}`}>
            <div className="look-preview-image-wrap">
              {part.closetItem?.image_url ? (
                <img
                  src={`${API_BASE}${part.closetItem.image_url}`}
                  alt={part.closetItem.name}
                  className="look-preview-image"
                  onClick={() => setSelectedImageItem(part.closetItem)}
                />
              ) : (
                <div className="look-preview-placeholder">
                  <div style={{ fontSize: "30px", marginBottom: "6px" }}>
                    {part.emoji}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      textAlign: "center",
                      padding: "0 8px",
                    }}
                  >
                    사진 없음
                  </div>
                </div>
              )}
            </div>

            <div className="look-preview-meta">
              <span>{part.label}</span>
              <strong>{part.closetItem?.name || part.text}</strong>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!token) {
    return (
      <div className="app">
        <div className="mobile-frame" style={{ paddingBottom: 0 }}>
          <header className="topbar">
            <div>
              <p className="hello-text">회원 전용 옷장</p>
              <h1>AI 옷장 로그인</h1>
            </div>
          </header>

          <section className="hero-card">
            <div className="hero-text">
              <span className="badge">로그인 후 이용</span>
              <h2>회원별로 옷장을 따로 관리할 수 있어요</h2>
              <p>내 옷만 저장하고, 내 옷만으로 코디 추천을 받게 됩니다.</p>
            </div>
          </section>

          <section className="section" style={{ marginTop: "24px" }}>
            <div className="weather-tabs" style={{ marginTop: 0 }}>
              <button
                type="button"
                className={`weather-tab ${authMode === "login" ? "selected" : ""}`}
                onClick={() => setAuthMode("login")}
              >
                로그인
              </button>
              <button
                type="button"
                className={`weather-tab ${authMode === "signup" ? "selected" : ""}`}
                onClick={() => setAuthMode("signup")}
              >
                회원가입
              </button>
            </div>

            <div className="recommendation-card" style={{ marginTop: "18px" }}>
              {authMode === "login" ? (
                <>
                  <h4>로그인</h4>
                  <input
                    type="text"
                    placeholder="아이디"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    style={{ marginTop: "12px" }}
                  />
                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    style={{ marginTop: "10px" }}
                  />
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={handleLogin}
                  >
                    {authLoading ? "로그인 중..." : "로그인"}
                  </button>
                </>
              ) : (
                <>
                  <h4>회원가입</h4>
                  <input
                    type="text"
                    placeholder="아이디"
                    value={signupForm.username}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    style={{ marginTop: "12px" }}
                  />
                  <input
                    type="password"
                    placeholder="비밀번호"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    style={{ marginTop: "10px" }}
                  />
                  <input
                    type="text"
                    placeholder="닉네임"
                    value={signupForm.nickname}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        nickname: e.target.value,
                      }))
                    }
                    style={{ marginTop: "10px" }}
                  />
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={handleSignup}
                  >
                    {authLoading ? "가입 중..." : "회원가입"}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="mobile-frame">
        <header className="topbar">
          <div>
            <p className="hello-text">안녕하세요 👋</p>
            <h1>{user?.nickname || user?.username || "회원"}님의 AI 옷장</h1>
          </div>
          <button className="icon-btn" type="button" onClick={logout}>
            ↪
          </button>
        </header>

        {activeTab === "home" && (
          <>
            <section className="hero-card">
              <div className="hero-text">
                <span className="badge">회원별 코디 추천</span>
                <h2>내 옷장에 저장한 옷만으로 추천해드릴게요</h2>
                <p>지금 로그인한 계정의 옷만 저장되고 추천도 그 옷만 사용해요.</p>
                <button className="primary-btn" onClick={getAIRecommendation} type="button">
                  {loading ? "추천 생성 중..." : "추천 받기"}
                </button>
              </div>
            </section>

            <section className="summary-grid">
              <div className="summary-card">
                <p>총 옷 수</p>
                <h3>{Array.isArray(clothes) ? clothes.length : 0}</h3>
              </div>
              <div className="summary-card">
                <p>추천 코디</p>
                <h3>{recommendations.length}</h3>
              </div>
              <div className="summary-card">
                <p>찜 개수</p>
                <h3>{totalFavoriteCount}</h3>
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <h3>날씨 선택</h3>
              </div>
              <div className="weather-tabs">
                {weatherOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`weather-tab ${weatherKey === item.key ? "selected" : ""}`}
                    onClick={() => setWeatherKey(item.key)}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              <div className="mood-tabs">
                {moodOptions.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    className={`mood-chip ${selectedMood === mood ? "selected" : ""}`}
                    onClick={() => setSelectedMood(mood)}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <h3>내 옷장</h3>
                <button type="button" onClick={() => setActiveTab("closet")}>
                  전체보기
                </button>
              </div>
              <div className="closet-list">
                {Array.isArray(clothes) &&
                  clothes.slice(0, 4).map(renderClosetCard)}
              </div>
            </section>
          </>
        )}

        {activeTab === "closet" && (
          <section className="section page-section">
            <div className="section-header">
              <h3>내 옷장 전체</h3>
              <button type="button" onClick={() => setActiveTab("home")}>
                홈으로
              </button>
            </div>

            <div className="recommendation-card" style={{ marginBottom: "16px" }}>
              <div className="recommendation-top">
                <span className="small-badge">새 옷 등록</span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="옷 이름"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />

                <select
                  name="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  <option value="상의">상의</option>
                  <option value="하의">하의</option>
                  <option value="아우터">아우터</option>
                  <option value="신발">신발</option>
                </select>

                <input
                  type="text"
                  name="color"
                  placeholder="색상"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                />

                <input
                  type="text"
                  name="season"
                  placeholder="계절 예: 봄, 여름"
                  value={form.season}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, season: e.target.value }))
                  }
                />

                <input
                  id="clothes-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />

                <button className="primary-btn" type="button" onClick={handleUpload}>
                  {uploading ? "업로드 중..." : "옷 저장하기"}
                </button>
              </div>
            </div>

            <div className="closet-list">
              {Array.isArray(clothes) &&
                clothes.map(renderClosetCard)}
            </div>
          </section>
        )}

        {activeTab === "recommend" && (
          <section className="section page-section">
            <div className="section-header">
              <h3>AI 추천 코디</h3>
              <button type="button" onClick={getAIRecommendation}>
                {loading ? "생성 중..." : "다시 추천"}
              </button>
            </div>

            <div className="recommendation-list">
              {recommendations.map((item, index) => (
                <div className="recommendation-card" key={`${item.title}-${index}`}>
                  <div className="recommendation-top">
                    <span className="small-badge">{item.tag}</span>
                    <button
                      type="button"
                      className={`like-btn ${isSavedLook(item) ? "liked" : ""}`}
                      onClick={() => toggleSavedLook(item)}
                    >
                      {isSavedLook(item) ? "❤️" : "🤍"}
                    </button>
                  </div>

                  <h4>{item.title}</h4>
                  {renderRecommendationPreview(item)}
                  <p>상의: {item.top || "-"}</p>
                  <p>하의: {item.bottom || "-"}</p>
                  <p>아우터: {item.outer || "-"}</p>
                  <p>신발: {item.shoes || "-"}</p>
                  <p>{item.desc}</p>
                  <p>
                    <strong>포인트:</strong> {item.point}
                  </p>
                </div>
              ))}

              {!recommendations.length && (
                <div className="recommendation-card">
                  <h4>아직 추천된 코디가 없어요</h4>
                  <button className="secondary-btn" type="button" onClick={getAIRecommendation}>
                    추천 받기
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "favorites" && (
          <section className="section page-section">
            <div className="section-header">
              <h3>찜 목록</h3>
            </div>

            {favoriteItems.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: "8px" }}>
                  <h3 style={{ fontSize: "16px" }}>찜한 옷</h3>
                </div>
                <div className="closet-list" style={{ marginBottom: "18px" }}>
                  {favoriteItems.map(renderClosetCard)}
                </div>
              </>
            )}

            {savedLooks.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: "8px" }}>
                  <h3 style={{ fontSize: "16px" }}>찜한 코디</h3>
                </div>
                <div className="recommendation-list">
                  {savedLooks.map((item, index) => (
                    <div className="recommendation-card" key={index}>
                      <div className="recommendation-top">
                        <span className="small-badge">{item.tag}</span>
                      </div>
                      <h4>{item.title}</h4>
                      {renderRecommendationPreview(item)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "profile" && (
          <section className="section page-section">
            <div className="section-header">
              <h3>내정보</h3>
            </div>

            <div className="summary-grid profile-grid">
              <div className="summary-card">
                <p>아이디</p>
                <h3 style={{ fontSize: "16px" }}>{user?.username}</h3>
              </div>
              <div className="summary-card">
                <p>닉네임</p>
                <h3 style={{ fontSize: "16px" }}>{user?.nickname || "-"}</h3>
              </div>
              <div className="summary-card">
                <p>총 옷 수</p>
                <h3>{Array.isArray(clothes) ? clothes.length : 0}</h3>
              </div>
            </div>

            <div className="recommendation-card">
              <h4>로그인된 계정 전용 옷장</h4>
              <p>지금부터 옷 저장, 조회, 추천은 모두 이 계정 기준으로 동작합니다.</p>
              <button className="secondary-btn" type="button" onClick={logout}>
                로그아웃
              </button>
            </div>
          </section>
        )}

        <nav className="bottom-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`nav-item ${activeTab === tab.key ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <p>{tab.label}</p>
            </button>
          ))}
        </nav>
      </div>

      {selectedImageItem && (
        <div
          onClick={() => setSelectedImageItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "16px",
              width: "100%",
              maxWidth: "420px",
              maxHeight: "90vh",
              overflow: "auto",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ margin: 0 }}>{selectedImageItem.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedImageItem(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <img
              src={`${API_BASE}${selectedImageItem.image_url}`}
              alt={selectedImageItem.name}
              style={{
                width: "100%",
                maxHeight: "60vh",
                objectFit: "contain",
                borderRadius: "14px",
                marginBottom: "12px",
              }}
            />

            <p style={{ margin: "6px 0" }}>
              <strong>카테고리:</strong> {selectedImageItem.category}
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>색상:</strong> {selectedImageItem.color || "색상미정"}
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>계절:</strong> {selectedImageItem.season || "계절미정"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;