"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
}

interface ParsedEvent {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

// Extend Window for Web Speech API (not yet in all TS DOM libs)
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export default function Home() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [isParsingText, setIsParsingText] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Format today's date in Japanese
  const today = new Date();
  const jstOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Tokyo",
  };
  const todayJapanese = today.toLocaleDateString("ja-JP", jstOptions);

  useEffect(() => {
    if (session) {
      fetchEvents();
      // Check notification permission status
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/events");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "予定の取得に失敗しました");
      } else {
        setEvents(data.events || []);
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tokyo",
      });
    } catch {
      return dateTimeStr;
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        new Notification("ER スケジュール", {
          body: "通知が有効になりました",
          icon: "/icons/icon-192x192.png",
        });
      }
    }
  };

  const parseTextWithGemini = useCallback(async (text: string) => {
    setIsParsingText(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "テキストの解析に失敗しました");
      } else {
        setParsedEvent(data);
      }
    } catch {
      setError("Gemini APIの呼び出しに失敗しました");
    } finally {
      setIsParsingText(false);
    }
  }, []);

  const startVoiceInput = useCallback(async () => {
    setRecognizedText("");
    setParsedEvent(null);
    setAddSuccess(false);

    // Check if Web Speech API is available
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      // Fallback to text input
      setShowTextFallback(true);
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setIsRecording(true);

      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      recognition.lang = "ja-JP";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        parseTextWithGemini(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        // Fall back to text input
        setShowTextFallback(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      recognition.start();

      // Also set up MediaRecorder as a backup to visualize recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch {
      setIsRecording(false);
      setShowTextFallback(true);
    }
  }, [parseTextWithGemini]);

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFallbackSubmit = () => {
    if (!fallbackText.trim()) return;
    setRecognizedText(fallbackText);
    setShowTextFallback(false);
    parseTextWithGemini(fallbackText);
    setFallbackText("");
  };

  const confirmAndAddEvent = async () => {
    if (!parsedEvent) return;
    setIsAddingEvent(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedEvent),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "予定の追加に失敗しました");
      } else {
        setAddSuccess(true);
        setParsedEvent(null);
        setRecognizedText("");
        // Refresh events list
        await fetchEvents();
      }
    } catch {
      setError("予定の追加に失敗しました");
    } finally {
      setIsAddingEvent(false);
    }
  };

  const cancelParsedEvent = () => {
    setParsedEvent(null);
    setRecognizedText("");
    setShowTextFallback(false);
  };

  const formatDateJapanese = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00+09:00");
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Tokyo",
    });
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg animate-pulse">読み込み中...</div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-blue-600 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🏥</div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            ER スケジュール
          </h1>
          <p className="text-gray-500 text-sm mb-6">救急業務の予定管理アプリ</p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-base transition-colors duration-200 flex items-center justify-center gap-3 shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Googleカレンダーへのアクセス許可が必要です
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white px-4 pt-4 pb-4 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏥</span>
              <h1 className="text-lg font-bold">ER スケジュール</h1>
            </div>
            <p className="text-blue-200 text-xs mt-0.5">{todayJapanese}</p>
          </div>
          <div className="flex items-center gap-2">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-blue-400"
              />
            )}
            <button
              onClick={() => signOut()}
              className="text-blue-200 hover:text-white text-xs underline"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Notification Permission Banner */}
        {notificationPermission === "default" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-yellow-800 font-medium">通知を有効にする</p>
              <p className="text-xs text-yellow-600">予定のリマインダーを受け取れます</p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="bg-yellow-500 text-white text-xs font-semibold py-2 px-3 rounded-lg whitespace-nowrap active:scale-95"
            >
              許可する
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Message */}
        {addSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <p className="text-sm text-green-700 font-medium">予定を追加しました！</p>
            <button
              onClick={() => setAddSuccess(false)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Today's Events */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              今日の予定
            </h2>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="text-blue-600 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
            >
              <span className={loading ? "animate-spin inline-block" : "inline-block"}>
                ↻
              </span>
              更新
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-blue-400 animate-pulse text-2xl mb-2">⏳</div>
              <p className="text-gray-500 text-sm">読み込み中...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-300 text-4xl mb-3">📅</div>
              <p className="text-gray-500 text-sm">今日の予定はありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 transition-opacity ${
                    checkedItems.has(event.id) ? "opacity-60" : "opacity-100"
                  }`}
                >
                  <button
                    onClick={() => toggleCheck(event.id)}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      checkedItems.has(event.id)
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                    aria-label={
                      checkedItems.has(event.id) ? "完了を取り消す" : "完了にする"
                    }
                  >
                    {checkedItems.has(event.id) && (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-gray-900 ${
                        checkedItems.has(event.id)
                          ? "line-through text-gray-400"
                          : ""
                      }`}
                    >
                      {event.title}
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {formatTime(event.start)}
                      {event.end && ` 〜 ${formatTime(event.end)}`}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {checkedItems.has(event.id) && (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                      完了
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Voice/Text Input Section */}
        {!parsedEvent && !isParsingText && (
          <section>
            {!isRecording && !showTextFallback && (
              <button
                onClick={startVoiceInput}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 px-6 rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-3 shadow-md active:scale-95"
              >
                <span className="text-2xl">🎤</span>
                音声で予定を追加
              </button>
            )}

            {isRecording && (
              <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-3xl">🎤</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
                  </div>
                </div>
                <p className="text-gray-700 font-medium mb-1">録音中...</p>
                <p className="text-gray-500 text-sm mb-4">
                  予定を日本語で話してください
                </p>
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors active:scale-95"
                >
                  停止
                </button>
              </div>
            )}

            {showTextFallback && (
              <div className="bg-white rounded-2xl shadow-md p-4">
                <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                  <span>✏️</span>
                  予定をテキストで入力
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  例: 「明日の10時から会議を追加して」
                </p>
                <textarea
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  placeholder="予定の内容を入力してください..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowTextFallback(false)}
                    className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm active:scale-95"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleFallbackSubmit}
                    disabled={!fallbackText.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors active:scale-95"
                  >
                    解析する
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Parsing in progress */}
        {isParsingText && (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <div className="text-3xl mb-3 animate-bounce">🤖</div>
            <p className="text-gray-700 font-medium">AIが解析中...</p>
            {recognizedText && (
              <p className="text-gray-500 text-sm mt-2 italic">
                「{recognizedText}」
              </p>
            )}
          </div>
        )}

        {/* Parsed Event Confirmation */}
        {parsedEvent && !isParsingText && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>✨</span>
              解析結果を確認
            </h3>

            {recognizedText && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">認識されたテキスト:</p>
                <p className="text-sm text-gray-700 italic">「{recognizedText}」</p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0 pt-0.5">
                  タイトル
                </span>
                <input
                  type="text"
                  value={parsedEvent.title}
                  onChange={(e) =>
                    setParsedEvent({ ...parsedEvent, title: e.target.value })
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0 pt-0.5">
                  日付
                </span>
                <div className="flex-1">
                  <input
                    type="date"
                    value={parsedEvent.date}
                    onChange={(e) =>
                      setParsedEvent({ ...parsedEvent, date: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    {formatDateJapanese(parsedEvent.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0">
                  開始
                </span>
                <input
                  type="time"
                  value={parsedEvent.startTime}
                  onChange={(e) =>
                    setParsedEvent({
                      ...parsedEvent,
                      startTime: e.target.value,
                    })
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0">
                  終了
                </span>
                <input
                  type="time"
                  value={parsedEvent.endTime}
                  onChange={(e) =>
                    setParsedEvent({ ...parsedEvent, endTime: e.target.value })
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0 pt-0.5">
                  詳細
                </span>
                <textarea
                  value={parsedEvent.description}
                  onChange={(e) =>
                    setParsedEvent({
                      ...parsedEvent,
                      description: e.target.value,
                    })
                  }
                  placeholder="（任意）"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={cancelParsedEvent}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm active:scale-95"
              >
                キャンセル
              </button>
              <button
                onClick={confirmAndAddEvent}
                disabled={isAddingEvent}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                {isAddingEvent ? (
                  <span className="animate-spin inline-block">↻</span>
                ) : (
                  <span>✓</span>
                )}
                {isAddingEvent ? "追加中..." : "追加する"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
