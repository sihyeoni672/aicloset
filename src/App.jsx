import "./App.css";
import { useState } from "react";

const closetItems = [
  { id: 1, name: "화이트 셔츠", category: "상의", color: "화이트" },
  { id: 2, name: "데님 팬츠", category: "하의", color: "블루" },
  { id: 3, name: "블랙 자켓", category: "아우터", color: "블랙" },
  { id: 4, name: "스니커즈", category: "신발", color: "화이트" },
];

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAIRecommendation = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          closetItems,
          weather: "18°C, 흐림, 저녁엔 쌀쌀함",
          mood: "출근룩",
        }),
      });

      const data = await res.json();
      console.log("AI 응답:", data);

      if (!res.ok) {
        alert(data.detail || data.error || "서버 오류가 발생했습니다.");
        return;
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        alert("추천 데이터를 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("에러 발생:", error);
      alert("AI 추천을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="mobile-frame">
        <header className="topbar">
          <div>
            <p className="hello-text">안녕하세요 👋</p>
            <h1>AI Closet</h1>
          </div>
          <button className="icon-btn">☰</button>
        </header>

        <section className="hero-card">
          <div className="hero-text">
            <span className="badge">AI 스타일 추천</span>
            <h2>오늘 날씨와 분위기에 맞는 코디를 추천해드릴게요</h2>
            <p>내 옷장을 기반으로 가장 잘 어울리는 룩을 확인해보세요.</p>
            <button className="primary-btn" onClick={getAIRecommendation}>
              {loading ? "추천 생성 중..." : "추천 받기"}
            </button>
          </div>
          <div className="hero-visual">
            <div className="avatar-circle">
              <span>👗</span>
            </div>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <p>총 옷 수</p>
            <h3>{closetItems.length}</h3>
          </div>
          <div className="summary-card">
            <p>추천 코디</p>
            <h3>{recommendations.length}</h3>
          </div>
          <div className="summary-card">
            <p>즐겨찾기</p>
            <h3>12</h3>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h3>내 옷장</h3>
            <button>전체보기</button>
          </div>

          <div className="closet-list">
            {closetItems.map((item) => (
              <div className="closet-card" key={item.id}>
                <div className="closet-icon">
                  {item.category === "상의"
                    ? "👕"
                    : item.category === "하의"
                    ? "👖"
                    : item.category === "아우터"
                    ? "🧥"
                    : "👟"}
                </div>
                <div>
                  <h4>{item.name}</h4>
                  <p>
                    {item.category} · {item.color}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h3>AI 추천 코디</h3>
            <button>더보기</button>
          </div>

          <div className="recommendation-list">
            {recommendations.length > 0 ? (
              recommendations.map((item, index) => (
                <div className="recommendation-card" key={index}>
                  <div className="recommendation-top">
                    <span className="small-badge">{item.tag}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                  <button className="secondary-btn">이 코디 보기</button>
                </div>
              ))
            ) : (
              <div className="recommendation-card">
                <div className="recommendation-top">
                  <span className="small-badge">AI 대기 중</span>
                </div>
                <h4>추천을 아직 생성하지 않았어요</h4>
                <p>상단의 추천 받기 버튼을 눌러 AI 코디를 생성해보세요.</p>
                <button className="secondary-btn" onClick={getAIRecommendation}>
                  추천 받기
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="weather-card">
            <div>
              <p className="weather-label">오늘 추천 포인트</p>
              <h3>가벼운 아우터가 어울려요</h3>
              <span>18°C · 흐림 · 저녁엔 쌀쌀함</span>
            </div>
            <div className="weather-icon">☁️</div>
          </div>
        </section>

        <nav className="bottom-nav">
          <button className="nav-item active">
            <span>🏠</span>
            <p>홈</p>
          </button>
          <button className="nav-item">
            <span>👚</span>
            <p>옷장</p>
          </button>
          <button className="nav-item">
            <span>✨</span>
            <p>추천</p>
          </button>
          <button className="nav-item">
            <span>❤️</span>
            <p>찜</p>
          </button>
          <button className="nav-item">
            <span>👤</span>
            <p>내정보</p>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;