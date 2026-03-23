import "./App.css";
import { useEffect, useMemo, useState } from "react";

const weatherOptions = [
  { key: "sunny", label: "맑음", detail: "22°C · 맑음 · 가벼운 외출", point: "가볍고 산뜻한 컬러 매치가 좋아요", icon: "☀️" },
  { key: "cloudy", label: "흐림", detail: "18°C · 흐림 · 저녁엔 쌀쌀함", point: "가벼운 아우터가 어울려요", icon: "☁️" },
  { key: "rainy", label: "비", detail: "16°C · 비 · 습하고 선선함", point: "생활방수 아우터와 어두운 톤이 실용적이에요", icon: "🌧️" },
  { key: "cold", label: "추움", detail: "8°C · 찬바람 · 보온 필수", point: "레이어드와 두꺼운 아우터 중심으로 입어보세요", icon: "🧣" },
];

const defaultRecommendations = {
  sunny: [
    {
      tag: "데일리",
      title: "화이트 셔츠 + 데님 팬츠",
      top: "화이트 셔츠",
      bottom: "데님 팬츠",
      outer: "",
      shoes: "스니커즈",
      desc: "맑은 날에 답답하지 않도록 산뜻하고 깔끔하게 입기 좋은 조합이에요.",
      point: "화이트와 블루 조합으로 밝고 깨끗한 분위기를 만들 수 있어요.",
    },
    {
      tag: "산뜻함",
      title: "베이지 니트 + 플리츠 스커트",
      top: "베이지 니트",
      bottom: "플리츠 스커트",
      outer: "",
      shoes: "스니커즈",
      desc: "부드러운 톤으로 화사하면서도 편안한 느낌을 줄 수 있어요.",
      point: "베이지와 그레이 조합이 은은하고 여성스럽게 보여요.",
    },
  ],
  cloudy: [
    {
      tag: "간절기",
      title: "화이트 셔츠 + 블랙 자켓 + 데님 팬츠",
      top: "화이트 셔츠",
      bottom: "데님 팬츠",
      outer: "블랙 자켓",
      shoes: "스니커즈",
      desc: "흐린 날씨에 가벼운 자켓을 더해 체온을 챙기기 좋은 코디예요.",
      point: "블랙 자켓이 전체 룩을 단정하게 정리해줘요.",
    },
    {
      tag: "차분함",
      title: "베이지 니트 + 데님 팬츠",
      top: "베이지 니트",
      bottom: "데님 팬츠",
      outer: "",
      shoes: "스니커즈",
      desc: "차분한 톤으로 편안하면서도 안정적인 분위기를 연출할 수 있어요.",
      point: "베이지와 블루 데님 조합이 무난하고 실패가 적어요.",
    },
  ],
  rainy: [
    {
      tag: "실용성",
      title: "블랙 자켓 + 데님 팬츠 + 스니커즈",
      top: "화이트 셔츠",
      bottom: "데님 팬츠",
      outer: "블랙 자켓",
      shoes: "스니커즈",
      desc: "비 오는 날에는 관리가 쉬운 어두운 톤 위주가 실용적이에요.",
      point: "어두운 아우터가 비 오는 날 오염 부담을 줄여줘요.",
    },
    {
      tag: "편안함",
      title: "베이지 니트 + 데님 팬츠",
      top: "베이지 니트",
      bottom: "데님 팬츠",
      outer: "",
      shoes: "스니커즈",
      desc: "실내외 온도 차이를 고려해 편하게 입기 좋은 코디예요.",
      point: "부드러운 상의와 기본 데님으로 무난하게 매치돼요.",
    },
  ],
  cold: [
    {
      tag: "보온",
      title: "베이지 니트 + 블랙 자켓 + 데님 팬츠",
      top: "베이지 니트",
      bottom: "데님 팬츠",
      outer: "블랙 자켓",
      shoes: "스니커즈",
      desc: "기온이 낮을 때는 니트와 자켓 레이어드가 따뜻하고 실용적이에요.",
      point: "밝은 니트와 어두운 자켓의 대비가 깔끔해 보여요.",
    },
    {
      tag: "겨울룩",
      title: "화이트 셔츠 + 니트 레이어드",
      top: "화이트 셔츠",
      bottom: "데님 팬츠",
      outer: "블랙 자켓",
      shoes: "스니커즈",
      desc: "레이어드를 활용해 답답하지 않으면서도 따뜻하게 입을 수 있어요.",
      point: "화이트 셔츠가 레이어드에 깔끔한 포인트가 돼요.",
    },
  ],
};

const moodOptions = ["출근룩", "캠퍼스룩", "데이트룩", "캐주얼룩"];
const tabs = [
  { key: "home", label: "홈", icon: "🏠" },
  { key: "closet", label: "옷장", icon: "👚" },
  { key: "recommend", label: "추천", icon: "✨" },
  { key: "favorites", label: "찜", icon: "❤️" },
  { key: "profile", label: "내정보", icon: "👤" },
];

const stylistShortcuts = [
  { key: "recommend", label: "코디 추천", icon: "✨", desc: "날씨·무드 기반 추천" },
  { key: "chat", label: "스타일 채팅", icon: "💬", desc: "AI 스타일 상담" },
  { key: "closet", label: "옷장 분석", icon: "🪄", desc: "보유 아이템 확인" },
  { key: "favorites", label: "좋아요 모음", icon: "❤️", desc: "찜한 아이템 보기" },
];

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";

const categoryFallbackLabel = {
  상의: "기본 상의",
  하의: "기본 하의",
  아우터: "기본 아우터",
  신발: "기본 신발",
};

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sameDate = (a, b) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const mapWeatherToKey = (main, temp) => {
  const lowerMain = String(main || "").toLowerCase();

  if (lowerMain.includes("rain") || lowerMain.includes("drizzle") || lowerMain.includes("thunderstorm")) {
    return "rainy";
  }
  if (temp <= 10) {
    return "cold";
  }
  if (lowerMain.includes("cloud") || lowerMain.includes("mist") || lowerMain.includes("fog") || lowerMain.includes("haze")) {
    return "cloudy";
  }
  return "sunny";
};

const mapWeatherIcon = (weatherKey) => {
  if (weatherKey === "rainy") return "🌧️";
  if (weatherKey === "cold") return "🧣";
  if (weatherKey === "cloudy") return "☁️";
  return "☀️";
};

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [closetItems, setClosetItems] = useState([]);
  const [weatherKey, setWeatherKey] = useState("cloudy");
  const [selectedMood, setSelectedMood] = useState("출근룩");
  const [recommendations, setRecommendations] = useState(defaultRecommendations.cloudy);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "상의",
    color: "",
    season: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [selectedImageItem, setSelectedImageItem] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "ai",
      text: "안녕하세요! 스타일 채팅이에요. 옷장에 있는 아이템이나 오늘 입고 싶은 분위기를 말해주면 추천해드릴게요.",
    },
  ]);

  const [selectedDate, setSelectedDate] = useState(formatDateValue(new Date()));
  const [coords, setCoords] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [liveWeather, setLiveWeather] = useState({
    city: "",
    temp: "",
    description: "",
    source: "",
    icon: "☁️",
  });

  const weatherInfo = useMemo(
    () => weatherOptions.find((item) => item.key === weatherKey) ?? weatherOptions[1],
    [weatherKey]
  );

  const favorites = useMemo(() => closetItems.filter((item) => item.liked), [closetItems]);

  const closetSummary = useMemo(() => {
    const byCategory = {
      상의: closetItems.filter((item) => item.category === "상의"),
      하의: closetItems.filter((item) => item.category === "하의"),
      아우터: closetItems.filter((item) => item.category === "아우터"),
      신발: closetItems.filter((item) => item.category === "신발"),
    };

    return {
      byCategory,
      total: closetItems.length,
      missing: Object.entries(byCategory)
        .filter(([, items]) => items.length === 0)
        .map(([category]) => category),
    };
  }, [closetItems]);

  const styleInsight = useMemo(() => {
    if (!closetItems.length) {
      return "옷장을 채우면 보유 아이템을 바탕으로 더 똑똑한 추천을 만들 수 있어요.";
    }

    if (closetSummary.missing.length >= 2) {
      return `지금 옷장에는 ${closetSummary.missing.join(", ")} 카테고리가 부족해요. 기본 조합이 되는 아이템을 먼저 채우면 추천 정확도가 좋아져요.`;
    }

    if (selectedMood === "데이트룩") {
      return "데이트룩은 밝은 톤 상의나 포인트 있는 아우터를 활용하면 분위기가 살아나요.";
    }

    if (weatherKey === "rainy") {
      return "비 오는 날은 밝은 하의보다 관리 쉬운 어두운 톤과 가벼운 아우터 조합이 좋아요.";
    }

    return `지금 옷장 구성이라면 ${selectedMood} 중심 코디 추천이 잘 어울려요. ${weatherInfo.point}`;
  }, [closetItems.length, closetSummary.missing, selectedMood, weatherKey, weatherInfo.point]);

  const getRecommendationKey = (item) => {
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

  const fetchClothes = async () => {
    try {
      setPageLoading(true);
      const response = await fetch(`${API_BASE}/clothes`);
      const data = await response.json();

      const mapped = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            liked: item.liked ?? false,
          }))
        : [];

      setClosetItems(mapped);
    } catch (error) {
      console.error("옷 목록 조회 오류:", error);
      alert("옷 목록을 불러오지 못했습니다.");
    } finally {
      setPageLoading(false);
    }
  };

  const applyWeatherResult = ({ main, temp, city, description, sourceDate }) => {
    const nextWeatherKey = mapWeatherToKey(main, temp);
    setWeatherKey(nextWeatherKey);
    setLiveWeather({
      city: city || "",
      temp: `${Math.round(temp)}°C`,
      description: description || "",
      source: sourceDate || selectedDate,
      icon: mapWeatherIcon(nextWeatherKey),
    });
  };

  const fetchWeatherByCoords = async (lat, lon, targetDate) => {
    if (!WEATHER_API_KEY) {
      setWeatherError("날씨 API 키가 없어 기본 날씨 모드로 동작 중입니다.");
      return;
    }

    try {
      setWeatherLoading(true);
      setWeatherError("");

      const target = new Date(targetDate);
      const today = new Date();

      if (sameDate(target, today)) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "현재 날씨를 불러오지 못했습니다.");
        }

        applyWeatherResult({
          main: data?.weather?.[0]?.main,
          temp: data?.main?.temp,
          city: data?.name,
          description: data?.weather?.[0]?.description,
          sourceDate: targetDate,
        });
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "예보를 불러오지 못했습니다.");
      }

      const targetYmd = targetDate;
      const sameDayItems = (data?.list || []).filter((item) => {
        const itemDate = item?.dt_txt?.slice(0, 10);
        return itemDate === targetYmd;
      });

      const targetItem =
        sameDayItems.find((item) => item?.dt_txt?.includes("12:00:00")) ||
        sameDayItems[0];

      if (!targetItem) {
        throw new Error("선택한 날짜의 예보 데이터가 없습니다.");
      }

      applyWeatherResult({
        main: targetItem?.weather?.[0]?.main,
        temp: targetItem?.main?.temp,
        city: data?.city?.name,
        description: targetItem?.weather?.[0]?.description,
        sourceDate: targetDate,
      });
    } catch (error) {
      console.error("날씨 조회 오류:", error);
      setWeatherError(error.message || "날씨를 불러오지 못했습니다.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const requestLocationAndWeather = () => {
    if (!navigator.geolocation) {
      setWeatherError("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCoords(nextCoords);
        fetchWeatherByCoords(nextCoords.lat, nextCoords.lon, selectedDate);
      },
      () => {
        setWeatherError("위치 권한이 거부되어 날씨를 자동으로 불러오지 못했습니다.");
      }
    );
  };

  useEffect(() => {
    fetchClothes();
    requestLocationAndWeather();
  }, []);

  useEffect(() => {
    if (coords) {
      fetchWeatherByCoords(coords.lat, coords.lon, selectedDate);
    }
  }, [selectedDate]);

  const toggleFavorite = (id) => {
    setClosetItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, liked: !item.liked } : item))
    );
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpload = async () => {
    if (!form.name.trim()) {
      alert("옷 이름을 입력해주세요.");
      return;
    }

    if (!form.category.trim()) {
      alert("카테고리를 선택해주세요.");
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

      const response = await fetch(`${API_BASE}/clothes`, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        console.error("응답 JSON 파싱 실패:", rawText);
        throw new Error("서버가 JSON이 아닌 응답을 보냈습니다.");
      }

      if (!response.ok) {
        throw new Error(data?.message || "업로드에 실패했습니다.");
      }

      alert("옷이 저장되었습니다.");
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
      setActiveTab("closet");
    } catch (error) {
      console.error("업로드 오류:", error);
      alert(error.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("이 옷을 삭제할까요?");
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/clothes/${id}`, {
        method: "DELETE",
      });

      const rawText = await response.text();
      const data = rawText ? JSON.parse(rawText) : {};

      if (!response.ok) {
        throw new Error(data?.message || "삭제 실패");
      }

      await fetchClothes();
    } catch (error) {
      console.error("삭제 오류:", error);
      alert(error.message || "삭제하지 못했습니다.");
    }
  };

  const getAIRecommendation = async () => {
    if (loading) return;

    setLoading(true);
    setActiveTab("recommend");

    try {
      if (!closetItems.length) {
        throw new Error("먼저 옷장에 옷을 1개 이상 저장해주세요.");
      }

      const previousKeys = recommendations.map(getRecommendationKey);

      const response = await fetch(`${API_BASE}/api/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          closetItems,
          weather: weatherKey,
          mood: selectedMood,
          previousRecommendations: recommendations,
          previousKeys,
          retry: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "AI 추천을 불러오지 못했습니다.");
      }

      const normalized = Array.isArray(data?.recommendations)
        ? data.recommendations.map((item, index) => ({
            tag: item.tag || `추천 ${index + 1}`,
            title: item.title || `코디 ${index + 1}`,
            top: item.top || "",
            bottom: item.bottom || "",
            outer: item.outer || "",
            shoes: item.shoes || "",
            desc: item.desc || "설명이 제공되지 않았습니다.",
            point: item.point || "스타일 포인트가 없습니다.",
          }))
        : [];

      const filtered = normalized.filter(
        (item) => !previousKeys.includes(getRecommendationKey(item))
      );

      if (filtered.length > 0) {
        setRecommendations(filtered);
        return;
      }

      if (normalized.length > 0) {
        setRecommendations(normalized);
        return;
      }

      setRecommendations(defaultRecommendations[weatherKey]);
    } catch (error) {
      console.error("AI 추천 오류:", error);
      alert(error.message || "AI 추천을 불러오지 못했습니다.");
      setRecommendations(defaultRecommendations[weatherKey]);
    } finally {
      setLoading(false);
    }
  };

  const pickItemByKeyword = (keyword, items) => {
    if (!keyword) return items[0];
    const lowered = keyword.toLowerCase();
    return (
      items.find((item) =>
        `${item.name} ${item.color || ""} ${item.season || ""}`.toLowerCase().includes(lowered)
      ) || items[0]
    );
  };

  const buildLocalStyleAnswer = (question) => {
    const lower = question.toLowerCase();
    const tops = closetSummary.byCategory["상의"];
    const bottoms = closetSummary.byCategory["하의"];
    const outers = closetSummary.byCategory["아우터"];
    const shoes = closetSummary.byCategory["신발"];

    if (!closetItems.length) {
      return "아직 옷장에 저장된 옷이 없어요. 옷장 탭에서 아이템을 먼저 추가하면 더 정확하게 답해드릴 수 있어요.";
    }

    if (lower.includes("뭐 입")) {
      const top = tops[0]?.name || categoryFallbackLabel["상의"];
      const bottom = bottoms[0]?.name || categoryFallbackLabel["하의"];
      const outer =
        weatherKey === "cold" || weatherKey === "rainy"
          ? outers[0]?.name || "가벼운 아우터"
          : null;
      return `${weatherInfo.label} 날씨에 ${selectedMood} 느낌으로 가려면 ${top}에 ${bottom} 조합이 좋아요.${outer ? ` 위에 ${outer}를 더하면 더 안정적이에요.` : ""}`;
    }

    if (lower.includes("색") || lower.includes("컬러")) {
      const colorful = closetItems.filter((item) => item.color);
      if (!colorful.length) {
        return "지금 저장된 옷에 색상 정보가 적어서, 옷 등록할 때 색상을 함께 넣어주면 컬러 조합 추천이 더 정확해져요.";
      }
      const first = colorful[0];
      return `${first.color} 계열 아이템이 있어서 같은 무채색 하의나 데님과 매치하면 실패가 적어요. 오늘처럼 ${weatherInfo.label} 날씨에는 톤을 너무 많이 섞지 않는 게 좋아요.`;
    }

    if (lower.includes("아우터")) {
      if (!outers.length) {
        return "지금 옷장에는 아우터가 없어요. 간절기용 자켓이나 가디건 하나만 추가해도 활용도가 크게 올라가요.";
      }
      return `${weatherInfo.label} 날씨엔 ${outers[0].name}부터 활용해보세요. ${selectedMood} 무드라면 이너는 단정하게, 하의는 기본형으로 맞추는 게 예뻐요.`;
    }

    if (lower.includes("데이트")) {
      const top = pickItemByKeyword("화이트", tops)?.name || tops[0]?.name || "밝은 톤 상의";
      const bottom = bottoms[0]?.name || "심플한 하의";
      return `데이트룩이라면 ${top}에 ${bottom} 조합이 가장 무난하고, 액세서리나 가방으로 포인트를 주면 훨씬 완성도가 올라가요.`;
    }

    if (lower.includes("출근") || lower.includes("학교") || lower.includes("캠퍼스")) {
      const targetMood = lower.includes("출근") ? "출근룩" : "캠퍼스룩";
      const top = tops[0]?.name || "기본 상의";
      const bottom = bottoms[0]?.name || "기본 하의";
      return `${targetMood} 기준으로는 ${top} + ${bottom}처럼 깔끔한 조합이 제일 활용도가 높아요. 여기에 신발은 ${shoes[0]?.name || "스니커즈"} 정도로 맞추면 부담이 없어요.`;
    }

    return `지금 옷장 기준으로 ${selectedMood} 무드 추천은 가능해요. 상의 ${tops.length}개, 하의 ${bottoms.length}개, 아우터 ${outers.length}개가 있어서 기본 조합은 충분하고, ${weatherInfo.point}`;
  };

  const sendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage = { role: "user", text: trimmed };
    const aiMessage = { role: "ai", text: buildLocalStyleAnswer(trimmed) };

    setChatMessages((prev) => [...prev, userMessage, aiMessage]);
    setChatInput("");
  };

  const handleStylistShortcut = (key) => {
    if (key === "chat") {
      setChatOpen(true);
      return;
    }
    if (key === "closet") {
      setActiveTab("closet");
      return;
    }
    if (key === "favorites") {
      setActiveTab("favorites");
      return;
    }
    if (key === "recommend") {
      getAIRecommendation();
    }
  };

  const renderClosetCard = (item, showFavoriteButton = true) => (
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
          {showFavoriteButton ? (
            <button
              className={`like-btn ${item.liked ? "liked" : ""}`}
              onClick={() => toggleFavorite(item.id)}
              type="button"
            >
              {item.liked ? "❤️" : "🤍"}
            </button>
          ) : null}

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

  const renderRecommendationItems = (item) => {
    const parts = [
      item.top ? `상의: ${item.top}` : null,
      item.bottom ? `하의: ${item.bottom}` : null,
      item.outer ? `아우터: ${item.outer}` : null,
      item.shoes ? `신발: ${item.shoes}` : null,
    ].filter(Boolean);

    return parts.map((part, idx) => <p key={idx}>{part}</p>);
  };

  const renderRecommendations = () => (
    <div className="recommendation-list">
      {recommendations.length > 0 ? (
        recommendations.map((item, index) => (
          <div className="recommendation-card" key={`${item.title}-${index}`}>
            <div className="recommendation-top">
              <span className="small-badge">{item.tag}</span>
            </div>

            <h4>{item.title}</h4>
            {renderRecommendationItems(item)}
            <p>{item.desc}</p>
            <p><strong>포인트:</strong> {item.point || "스타일 포인트가 없습니다."}</p>

            <button className="secondary-btn" type="button" onClick={getAIRecommendation}>
              {loading ? "추천 생성 중..." : "이 코디 말고 다시 추천"}
            </button>
          </div>
        ))
      ) : (
        <div className="recommendation-card">
          <div className="recommendation-top">
            <span className="small-badge">AI 대기 중</span>
          </div>
          <h4>추천을 아직 생성하지 않았어요</h4>
          <p>상단의 추천 받기 버튼을 눌러 AI 코디를 생성해보세요.</p>
          <button className="secondary-btn" onClick={getAIRecommendation} type="button">
            추천 받기
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      <div className="mobile-frame">
        <header className="topbar">
          <div>
            <p className="hello-text">안녕하세요 👋</p>
            <h1>AI 옷장</h1>
          </div>
          <button className="icon-btn" type="button">
            ☰
          </button>
        </header>

        {activeTab === "home" && (
          <>
            <section className="hero-card">
              <div className="hero-text">
                <span className="badge">AI 스타일 추천</span>
                <h2>오늘 날씨와 분위기에 맞는 코디를 추천해드릴게요</h2>
                <p>내 옷장을 기반으로 가장 잘 어울리는 룩을 확인해보세요.</p>
                <button className="primary-btn" onClick={getAIRecommendation} type="button">
                  {loading ? "추천 생성 중..." : "추천 받기"}
                </button>
              </div>
              <div className="hero-visual">
                <div className="avatar-circle">
                  <span>👗</span>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <h3>AI 스타일리스트</h3>
                <button type="button" onClick={() => setChatOpen(true)}>
                  채팅 열기
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                {stylistShortcuts.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleStylistShortcut(item.key)}
                    style={{
                      border: "1px solid #ece8ff",
                      background: item.key === "chat" ? "linear-gradient(135deg, #f6f0ff 0%, #fff 100%)" : "#fff",
                      borderRadius: "18px",
                      padding: "14px",
                      textAlign: "left",
                      boxShadow: "0 8px 24px rgba(31, 41, 55, 0.06)",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>{item.label}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>

              <div
                style={{
                  marginTop: "14px",
                  borderRadius: "18px",
                  padding: "16px",
                  background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "6px" }}>오늘의 스타일 인사이트</div>
                <div style={{ fontSize: "15px", lineHeight: 1.6 }}>{styleInsight}</div>
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
                <h3>{favorites.length}</h3>
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
                {closetItems.slice(0, 4).map((item) => renderClosetCard(item))}
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <h3>AI 추천 코디</h3>
                <button type="button" onClick={() => setActiveTab("recommend")}>
                  더보기
                </button>
              </div>
              {renderRecommendations()}
            </section>

            <section className="section">
              <div className="weather-card">
                <div style={{ flex: 1 }}>
                  <p className="weather-label">날짜별 날씨 반영</p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        maxWidth: "170px",
                        margin: 0,
                      }}
                    />
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={requestLocationAndWeather}
                    >
                      새로고침
                    </button>
                  </div>

                  <h3>
                    {weatherLoading
                      ? "날씨 불러오는 중..."
                      : liveWeather.city
                      ? `${liveWeather.city} · ${liveWeather.temp} · ${liveWeather.description || weatherInfo.label}`
                      : weatherInfo.point}
                  </h3>

                  <span>
                    {liveWeather.source
                      ? `${liveWeather.source} 기준 날씨 반영`
                      : weatherInfo.detail}
                  </span>

                  {weatherError ? (
                    <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#b91c1c" }}>
                      {weatherError}
                    </p>
                  ) : null}
                </div>

                <div className="weather-icon">{liveWeather.icon || weatherInfo.icon}</div>
              </div>

              <div className="weather-tabs">
                {weatherOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`weather-tab ${weatherKey === item.key ? "selected" : ""}`}
                    onClick={() => {
                      setWeatherKey(item.key);
                      setRecommendations(defaultRecommendations[item.key]);
                    }}
                  >
                    {item.label}
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

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                <input
                  type="text"
                  name="name"
                  placeholder="옷 이름"
                  value={form.name}
                  onChange={handleChangeForm}
                />

                <select name="category" value={form.category} onChange={handleChangeForm}>
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
                  onChange={handleChangeForm}
                />

                <input
                  type="text"
                  name="season"
                  placeholder="계절 예: 봄, 여름"
                  value={form.season}
                  onChange={handleChangeForm}
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

            {pageLoading ? (
              <div className="recommendation-card">
                <h4>불러오는 중...</h4>
              </div>
            ) : closetItems.length > 0 ? (
              <div className="closet-list">
                {closetItems.map((item) => renderClosetCard(item))}
              </div>
            ) : (
              <div className="recommendation-card">
                <h4>등록된 옷이 없어요</h4>
                <p>위에서 옷 사진과 정보를 추가해보세요.</p>
              </div>
            )}
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

            <div className="weather-inline-info">
              <span>{liveWeather.icon || weatherInfo.icon}</span>
              <p>
                {weatherInfo.label} · {selectedMood} · {selectedDate} 기준 추천
              </p>
            </div>

            {renderRecommendations()}
          </section>
        )}

        {activeTab === "favorites" && (
          <section className="section page-section">
            <div className="section-header">
              <h3>찜 목록</h3>
              <button type="button" onClick={() => setActiveTab("home")}>
                홈으로
              </button>
            </div>

            {favorites.length > 0 ? (
              <div className="closet-list">
                {favorites.map((item) => renderClosetCard(item))}
              </div>
            ) : (
              <div className="recommendation-card">
                <div className="recommendation-top">
                  <span className="small-badge">비어 있음</span>
                </div>
                <h4>찜한 아이템이 없어요</h4>
                <p>옷장 화면에서 하트를 눌러 찜 목록을 채워보세요.</p>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setActiveTab("closet")}
                >
                  옷장으로 이동
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === "profile" && (
          <section className="section page-section">
            <div className="section-header">
              <h3>내정보</h3>
              <button type="button" onClick={() => setActiveTab("home")}>
                홈으로
              </button>
            </div>

            <div className="summary-grid profile-grid">
              <div className="summary-card">
                <p>스타일 무드</p>
                <h3>{selectedMood}</h3>
              </div>
              <div className="summary-card">
                <p>선택 날씨</p>
                <h3>{weatherInfo.label}</h3>
              </div>
              <div className="summary-card">
                <p>찜 개수</p>
                <h3>{favorites.length}</h3>
              </div>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-top">
                <span className="small-badge">준비 중</span>
              </div>
              <h4>나중에 연결될 기능</h4>
              <p>
                옷 사진 데이터베이스, 개인 스타일 분석, 최근 본 코디, 계절별 추천 기록을 이 화면에 확장할 수 있게 구조를 잡아두었어요.
              </p>
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

      {chatOpen && (
        <div
          onClick={() => setChatOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#fff",
              borderRadius: "24px",
              padding: "18px 16px 20px",
              maxHeight: "78vh",
              boxSizing: "border-box",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0 }}>스타일 채팅</h3>
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
                  {weatherInfo.label} · {selectedMood} · 보유 아이템 {closetItems.length}개
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "42vh",
                overflowY: "auto",
                padding: "4px 2px 10px",
              }}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    background: msg.role === "user" ? "#111827" : "#f3f4f6",
                    color: msg.role === "user" ? "#fff" : "#111827",
                    padding: "12px 14px",
                    borderRadius: "16px",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
                placeholder="예: 오늘 뭐 입을까? / 아우터 추천해줘"
                style={{
                  flex: 1,
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  outline: "none",
                }}
              />
              <button className="primary-btn" type="button" onClick={sendChat}>
                전송
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
              {["오늘 뭐 입을까?", "데이트룩 추천", "아우터 추천", "색 조합 알려줘"].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setChatInput(quick)}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {quick}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
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

            <p style={{ margin: "6px 0" }}><strong>카테고리:</strong> {selectedImageItem.category}</p>
            <p style={{ margin: "6px 0" }}><strong>색상:</strong> {selectedImageItem.color || "색상미정"}</p>
            <p style={{ margin: "6px 0" }}><strong>계절:</strong> {selectedImageItem.season || "계절미정"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;