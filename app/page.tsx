"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────

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

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
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

type TabType = "today" | "weekly" | "monthly";

// ── JST Utility Functions ─────────────────────────────────────────────

/** Returns a Date object where getUTC* methods give JST values. */
function jstShifted(date: Date = new Date()): Date {
  const ms = date.getTimezoneOffset() * 60000 + 9 * 3600000;
  return new Date(date.getTime() + ms);
}

/** Formats a jstShifted Date as "YYYY-MM-DD". */
function formatDateKey(jstDate: Date): string {
  const y = jstDate.getUTCFullYear();
  const m = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jstDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the JST date key (YYYY-MM-DD) for a calendar event. */
function eventDateKey(event: CalendarEvent): string {
  const s = event.start;
  if (!s) return "";
  if (s.includes("T")) {
    return new Date(s).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  }
  return s.substring(0, 10);
}

/** Returns 0=Sun … 6=Sat for a YYYY-MM-DD string (timezone-safe). */
function dowFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const DOW_JA = ["日", "月", "火", "水", "木", "金", "土"];

// ── Weekly Info ───────────────────────────────────────────────────────

interface DayInfo {
  key: string;   // YYYY-MM-DD
  month: number; // 0-indexed
  day: number;
  dow: number;   // 0=Sun
}

interface WeekInfo {
  start: string;
  end: string;
  dates: DayInfo[];
  label: string;
}

function getWeekInfo(weekOffset: number): WeekInfo {
  const now = jstShifted();
  const dow = now.getUTCDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + diffToMon + weekOffset * 7);

  const dates: DayInfo[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    return {
      key: formatDateKey(d),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
      dow: d.getUTCDay(),
    };
  });

  const first = dates[0];
  const last  = dates[6];
  const label =
    first.month === last.month
      ? `${first.month + 1}月${first.day}日 〜 ${last.day}日`
      : `${first.month + 1}月${first.day}日 〜 ${last.month + 1}月${last.day}日`;

  return { start: dates[0].key, end: dates[6].key, dates, label };
}

// ── Monthly Info ──────────────────────────────────────────────────────

interface MonthInfo {
  year: number;
  month: number;   // 0-indexed
  start: string;
  end: string;
  lastDay: number;
  firstDow: number; // 0=Sun
  label: string;
}

function getMonthInfo(monthOffset: number): MonthInfo {
  const now = jstShifted();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1));
  const year    = base.getUTCFullYear();
  const month   = base.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDow = base.getUTCDay();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end   = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const label = `${year}年${month + 1}月`;
  return { year, month, start, end, lastDay, firstDow, label };
}

// ── EventCard Sub-component ───────────────────────────────────────────

function EventCard({
  event,
  checked,
  onToggle,
  formatTime,
}: {
  event: CalendarEvent;
  checked: boolean;
  onToggle: () => void;
  formatTime: (s: string) => string;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 transition-opacity ${
        checked ? "opacity-60" : "opacity-100"
      }`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-blue-400"
        }`}
        aria-label={checked ? "完了を取り消す" : "完了にする"}
      >
        {checked && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
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
            checked ? "line-through text-gray-400" : ""
          }`}
        >
          {event.title}
        </p>
        {event.start.includes("T") && (
          <p className="text-xs text-blue-600 mt-0.5">
            {formatTime(event.start)}
            {event.end && event.end.includes("T") && ` 〜 ${formatTime(event.end)}`}
          </p>
        )}
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
      {checked && (
        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
          完了
        </span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function Home() {
  const { data: session, status } = useSession();

  // Today view
  const [events, setEvents]           = useState<CalendarEvent[]>([]);
  const [loading, setLoading]         = useState(false);

  // Range views (weekly / monthly)
  const [activeTab, setActiveTab]     = useState<TabType>("today");
  const [weekOffset, setWeekOffset]   = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [rangeEvents, setRangeEvents] = useState<CalendarEvent[]>([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  // Shared UI state
  const [checkedItems, setCheckedItems]       = useState<Set<string>>(new Set());
  const [error, setError]                     = useState<string | null>(null);
  const [isRecording, setIsRecording]         = useState(false);
  const [recognizedText, setRecognizedText]   = useState("");
  const [inputText, setInputText]             = useState("");
  const [parsedEvent, setParsedEvent]         = useState<ParsedEvent | null>(null);
  const [isParsingText, setIsParsingText]     = useState(false);
  const [isAddingEvent, setIsAddingEvent]     = useState(false);
  const [addSuccess, setAddSuccess]           = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [subscriptionSaved, setSubscriptionSaved] = useState<boolean | null>(null); // null=unknown
  const [pushError, setPushError] = useState<string | null>(null);

  const recognitionRef       = useRef<ISpeechRecognition | null>(null);
  const recognitionResultRef = useRef<boolean>(false);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Today's JST date string
  const todayStr = formatDateKey(jstShifted());
  const todayJapanese = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "long", timeZone: "Asia/Tokyo",
  });

  // ── Fetch: today ────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/calendar/events");
      const data = await res.json();
      if (!res.ok) setError(data.error || "予定の取得に失敗しました");
      else setEvents(data.events || []);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch: range (weekly / monthly) ────────────────────────────────

  const fetchRangeEvents = useCallback(async (start: string, end: string) => {
    setRangeLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/calendar/events?start=${start}&end=${end}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "予定の取得に失敗しました");
      else setRangeEvents(data.events || []);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setRangeLoading(false);
    }
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session) return;
    fetchEvents();
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "granted") {
        // Check if subscription is already registered on server
        checkSubscriptionStatus();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (activeTab === "weekly") {
      const { start, end } = getWeekInfo(weekOffset);
      fetchRangeEvents(start, end);
    } else if (activeTab === "monthly") {
      const { start, end } = getMonthInfo(monthOffset);
      fetchRangeEvents(start, end);
    }
  }, [session, activeTab, weekOffset, monthOffset, fetchRangeEvents]);

  // ── Push Notifications ───────────────────────────────────────────────

  const subscribeToPush = async (): Promise<boolean> => {
    setPushError(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushError("このブラウザはプッシュ通知に対応していません");
        return false;
      }
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setPushError("VAPID公開鍵が未設定です（環境変数を確認してください）");
        return false;
      }

      // Convert VAPID public key
      const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4);
      const base64  = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) applicationServerKey[i] = rawData.charCodeAt(i);

      // Force new subscription (unsubscribe first to ensure fresh token)
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) await existingSub.unsubscribe();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Save to server
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPushError(`サーバー保存失敗: ${data.error || res.status}`);
        setSubscriptionSaved(false);
        return false;
      }

      setSubscriptionSaved(true);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPushError(`登録エラー: ${msg}`);
      setSubscriptionSaved(false);
      console.warn("[Push] Subscribe failed:", e);
      return false;
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const res = await fetch("/api/notifications/status");
      if (!res.ok) return;
      const data = await res.json();
      setSubscriptionSaved(data.hasSubscription === true);
      if (!data.upstashOk) {
        setPushError(`Upstash接続エラー: ${data.upstashError || "不明"}`);
      }
    } catch {
      // silent
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        await subscribeToPush();
      }
    }
  };

  // ── Voice Input ──────────────────────────────────────────────────────

  const parseTextWithGemini = useCallback(async (text: string) => {
    setIsParsingText(true);
    try {
      const res  = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "テキストの解析に失敗しました");
      else setParsedEvent(data);
    } catch {
      setError("Gemini APIの呼び出しに失敗しました");
    } finally {
      setIsParsingText(false);
    }
  }, []);

  const startVoiceInput = useCallback(() => {
    setParsedEvent(null);
    setAddSuccess(false);
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) return;
    try {
      recognitionResultRef.current = false;
      const recognition = new API();
      recognitionRef.current = recognition;
      recognition.lang = "ja-JP";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        recognitionResultRef.current = true;
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = null;
        }
        const transcript = e.results[0][0].transcript;
        setRecognizedText(transcript);
        setInputText(transcript);
        setIsRecording(false);
        parseTextWithGemini(transcript);
      };
      recognition.onerror = () => {
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = null;
        }
        setIsRecording(false);
      };
      recognition.onend = () => {
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = null;
        }
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
      recognitionTimeoutRef.current = setTimeout(() => {
        if (!recognitionResultRef.current) {
          recognition.abort();
          setIsRecording(false);
        }
      }, 10000);
    } catch {
      setIsRecording(false);
    }
  }, [parseTextWithGemini]);

  const stopRecording = () => {
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    setRecognizedText(inputText);
    parseTextWithGemini(inputText);
    setInputText("");
  };

  // ── Event Management ─────────────────────────────────────────────────

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmAndAddEvent = async () => {
    if (!parsedEvent) return;
    setIsAddingEvent(true);
    setError(null);
    try {
      const res  = await fetch("/api/calendar/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedEvent),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "予定の追加に失敗しました");
      } else {
        setAddSuccess(true);
        setParsedEvent(null);
        setRecognizedText("");
        // Refresh the active view
        if (activeTab === "today") {
          await fetchEvents();
        } else {
          const info = activeTab === "weekly"
            ? getWeekInfo(weekOffset)
            : getMonthInfo(monthOffset);
          await fetchRangeEvents(info.start, info.end);
        }
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
    setInputText("");
  };

  // ── Format Helpers ───────────────────────────────────────────────────

  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr || !dateTimeStr.includes("T")) return "";
    try {
      return new Date(dateTimeStr).toLocaleTimeString("ja-JP", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo",
      });
    } catch {
      return "";
    }
  };

  const formatDateJapanese = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00+09:00");
    return d.toLocaleDateString("ja-JP", {
      year: "numeric", month: "long", day: "numeric",
      weekday: "short", timeZone: "Asia/Tokyo",
    });
  };

  // ── Auth States ──────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-blue-600 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🏥</div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">ER スケジュール</h1>
          <p className="text-gray-500 text-sm mb-6">救急業務の予定管理アプリ</p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-base transition-colors duration-200 flex items-center justify-center gap-3 shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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

  // ── View Data ────────────────────────────────────────────────────────

  const weekInfo = getWeekInfo(weekOffset);

  // Weekly: group events by date
  const weekEventMap = new Map<string, CalendarEvent[]>();
  for (const ev of rangeEvents) {
    const key = eventDateKey(ev);
    if (!weekEventMap.has(key)) weekEventMap.set(key, []);
    weekEventMap.get(key)!.push(ev);
  }

  const monthInfo = getMonthInfo(monthOffset);

  // Monthly: group events by date
  const monthEventMap = new Map<string, CalendarEvent[]>();
  for (const ev of rangeEvents) {
    const key = eventDateKey(ev);
    if (!monthEventMap.has(key)) monthEventMap.set(key, []);
    monthEventMap.get(key)!.push(ev);
  }
  const monthDatesWithEvents = Array.from(monthEventMap.keys()).sort();

  // ── Nav Button (shared style) ────────────────────────────────────────

  const NavBtn = ({ onClick, children, disabled }: {
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 disabled:opacity-40 text-xl"
    >
      {children}
    </button>
  );

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ───────────────────────────────────────────────────── */}
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

      {/* ── Tab Navigation (sticky) ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto flex">
          {(["today", "weekly", "monthly"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab === "today" ? "今日" : tab === "weekly" ? "週間" : "月間"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">

        {/* Notification banners */}
        {notificationPermission === "default" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-yellow-800 font-medium">通知を有効にする</p>
              <p className="text-xs text-yellow-600">8:30・15:00 に自動でお知らせします</p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="bg-yellow-500 text-white text-xs font-semibold py-2 px-3 rounded-lg whitespace-nowrap active:scale-95"
            >
              許可する
            </button>
          </div>
        )}

        {notificationPermission === "granted" && (
          <div className="mb-4 space-y-2">
            {/* Push error */}
            {pushError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-700">通知エラー</p>
                  <p className="text-xs text-red-600 break-all">{pushError}</p>
                </div>
                <button onClick={() => setPushError(null)} className="text-red-400 flex-shrink-0">✕</button>
              </div>
            )}

            <div className={`border rounded-xl p-3 ${
              subscriptionSaved === false
                ? "bg-orange-50 border-orange-200"
                : "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">
                  {subscriptionSaved === false ? "⚠️" : "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    subscriptionSaved === false ? "text-orange-800" : "text-green-800"
                  }`}>
                    {subscriptionSaved === null
                      ? "通知確認中..."
                      : subscriptionSaved
                      ? "通知が有効です"
                      : "通知が未登録です"}
                  </p>
                  <p className={`text-xs ${
                    subscriptionSaved === false ? "text-orange-600" : "text-green-600"
                  }`}>
                    {subscriptionSaved === false
                      ? "「再登録」を押してください"
                      : "8:30・15:00 に自動通知されます"}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {subscriptionSaved === false ? (
                    <button
                      onClick={subscribeToPush}
                      className="bg-orange-500 text-white text-xs font-semibold py-2 px-3 rounded-lg whitespace-nowrap active:scale-95"
                    >
                      再登録
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/notifications/test", { method: "POST" });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setPushError(data.error || `テスト送信失敗 (${res.status})`);
                        } else {
                          // success — notification should appear shortly
                        }
                      }}
                      className="bg-green-500 text-white text-xs font-semibold py-2 px-3 rounded-lg whitespace-nowrap active:scale-95"
                    >
                      テスト送信
                    </button>
                  )}
                  <button
                    onClick={subscribeToPush}
                    className="bg-white border border-gray-300 text-gray-600 text-xs font-medium py-1.5 px-2 rounded-lg whitespace-nowrap active:scale-95"
                  >
                    再登録
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {addSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <p className="text-sm text-green-700 font-medium">予定を追加しました！</p>
            <button onClick={() => setAddSuccess(false)} className="ml-auto text-green-400 hover:text-green-600">✕</button>
          </div>
        )}

        {/* ══════════════════════ TODAY VIEW ══════════════════════════ */}
        {activeTab === "today" && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span>今日の予定
              </h2>
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="text-blue-600 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <span className={loading ? "animate-spin inline-block" : "inline-block"}>↻</span>
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
                {events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    checked={checkedItems.has(ev.id)}
                    onToggle={() => toggleCheck(ev.id)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════ WEEKLY VIEW ══════════════════════════ */}
        {activeTab === "weekly" && (
          <section className="mb-6">
            {/* Navigation */}
            <div className="flex items-center gap-2 mb-4">
              <NavBtn onClick={() => setWeekOffset((w) => w - 1)}>‹</NavBtn>
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-gray-800">{weekInfo.label}</p>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs text-blue-500 mt-0.5"
                  >
                    今週に戻る
                  </button>
                )}
              </div>
              <NavBtn
                onClick={() => fetchRangeEvents(weekInfo.start, weekInfo.end)}
                disabled={rangeLoading}
              >
                <span className={rangeLoading ? "animate-spin inline-block text-sm" : "text-sm"}>↻</span>
              </NavBtn>
              <NavBtn onClick={() => setWeekOffset((w) => w + 1)}>›</NavBtn>
            </div>

            {/* Day list */}
            {rangeLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-blue-400 animate-pulse text-2xl mb-2">⏳</div>
                <p className="text-gray-500 text-sm">読み込み中...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weekInfo.dates.map(({ key, month, day, dow }) => {
                  const dayEvents = weekEventMap.get(key) || [];
                  const isToday   = key === todayStr;
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <div key={key}>
                      {/* Day header */}
                      <div
                        className={`flex items-center gap-2 mb-1.5 ${
                          isToday
                            ? "text-blue-600"
                            : dow === 0
                            ? "text-red-500"
                            : dow === 6
                            ? "text-blue-500"
                            : "text-gray-700"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isToday ? "bg-blue-600 text-white" : ""
                          }`}
                        >
                          {day}
                        </div>
                        <span className="text-sm font-semibold">
                          {month + 1}月{day}日（{DOW_JA[dow]}）
                        </span>
                        {isToday && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            今日
                          </span>
                        )}
                        <span className="ml-auto text-xs text-gray-400">
                          {dayEvents.length > 0 ? `${dayEvents.length}件` : ""}
                        </span>
                      </div>

                      {/* Events or placeholder */}
                      {dayEvents.length === 0 ? (
                        <div
                          className={`rounded-xl px-4 py-3 text-sm border border-dashed ${
                            isWeekend
                              ? "bg-gray-50 border-gray-200 text-gray-300"
                              : "bg-white border-gray-200 text-gray-400"
                          }`}
                        >
                          予定なし
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {dayEvents.map((ev) => (
                            <EventCard
                              key={ev.id}
                              event={ev}
                              checked={checkedItems.has(ev.id)}
                              onToggle={() => toggleCheck(ev.id)}
                              formatTime={formatTime}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════ MONTHLY VIEW ══════════════════════════ */}
        {activeTab === "monthly" && (
          <section className="mb-6">
            {/* Navigation */}
            <div className="flex items-center gap-2 mb-4">
              <NavBtn onClick={() => setMonthOffset((m) => m - 1)}>‹</NavBtn>
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-gray-800">{monthInfo.label}</p>
                {monthOffset !== 0 && (
                  <button
                    onClick={() => setMonthOffset(0)}
                    className="text-xs text-blue-500 mt-0.5"
                  >
                    今月に戻る
                  </button>
                )}
              </div>
              <NavBtn
                onClick={() => fetchRangeEvents(monthInfo.start, monthInfo.end)}
                disabled={rangeLoading}
              >
                <span className={rangeLoading ? "animate-spin inline-block text-sm" : "text-sm"}>↻</span>
              </NavBtn>
              <NavBtn onClick={() => setMonthOffset((m) => m + 1)}>›</NavBtn>
            </div>

            {/* Mini Calendar */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {DOW_JA.map((label, i) => (
                  <div
                    key={label}
                    className={`text-center text-xs font-semibold py-1 ${
                      i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7">
                {/* Leading empty cells */}
                {Array.from({ length: monthInfo.firstDow }, (_, i) => (
                  <div key={`e${i}`} />
                ))}
                {/* Days */}
                {Array.from({ length: monthInfo.lastDay }, (_, i) => {
                  const dayNum = i + 1;
                  const key = `${monthInfo.year}-${String(monthInfo.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const hasEvents = monthEventMap.has(key);
                  const isToday   = key === todayStr;
                  const dow = (monthInfo.firstDow + i) % 7;
                  return (
                    <div key={key} className="flex flex-col items-center py-0.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                          isToday
                            ? "bg-blue-600 text-white font-bold"
                            : dow === 0
                            ? "text-red-500"
                            : dow === 6
                            ? "text-blue-500"
                            : "text-gray-700"
                        }`}
                      >
                        {dayNum}
                      </div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          hasEvents ? "bg-blue-400" : "bg-transparent"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Event List */}
            {rangeLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-blue-400 animate-pulse text-2xl mb-2">⏳</div>
                <p className="text-gray-500 text-sm">読み込み中...</p>
              </div>
            ) : monthDatesWithEvents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="text-gray-300 text-4xl mb-3">📅</div>
                <p className="text-gray-500 text-sm">この月に予定はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthDatesWithEvents.map((dateKey) => {
                  const dayEvs   = monthEventMap.get(dateKey)!;
                  const [, mStr, dStr] = dateKey.split("-");
                  const monthNum = parseInt(mStr);
                  const dayNum   = parseInt(dStr);
                  const dow      = dowFromKey(dateKey);
                  const isToday  = dateKey === todayStr;
                  return (
                    <div key={dateKey}>
                      {/* Day header */}
                      <div
                        className={`flex items-center gap-2 mb-1.5 ${
                          isToday
                            ? "text-blue-600"
                            : dow === 0
                            ? "text-red-500"
                            : dow === 6
                            ? "text-blue-500"
                            : "text-gray-700"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isToday ? "bg-blue-600 text-white" : ""
                          }`}
                        >
                          {dayNum}
                        </div>
                        <span className="text-sm font-semibold">
                          {monthNum}月{dayNum}日（{DOW_JA[dow]}）
                        </span>
                        {isToday && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            今日
                          </span>
                        )}
                        <span className="ml-auto text-xs text-gray-400">{dayEvs.length}件</span>
                      </div>
                      <div className="space-y-1.5">
                        {dayEvs.map((ev) => (
                          <EventCard
                            key={ev.id}
                            event={ev}
                            checked={checkedItems.has(ev.id)}
                            onToggle={() => toggleCheck(ev.id)}
                            formatTime={formatTime}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════ ADD EVENT ════════════════════════════ */}
        {!parsedEvent && !isParsingText && (
          <section className="bg-white rounded-2xl shadow-md p-4">
            <p className="text-gray-700 font-medium mb-1 flex items-center gap-2">
              <span>➕</span>予定を追加
            </p>
            <p className="text-gray-400 text-xs mb-3">
              例: 「明日10時から処置」「来週月曜に会議」
            </p>
            <div className="flex gap-2 mb-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="予定の内容を入力..."
                className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={2}
              />
              <button
                onClick={isRecording ? stopRecording : startVoiceInput}
                className={`w-14 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium flex-shrink-0 transition-all active:scale-95 ${
                  isRecording
                    ? "bg-red-500 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                <span className="text-xl">{isRecording ? "⏹" : "🎤"}</span>
                <span>{isRecording ? "停止" : "音声"}</span>
              </button>
            </div>
            {isRecording && (
              <p className="text-xs text-red-500 text-center mb-2 animate-pulse">
                🎙️ 録音中... 日本語で話してください
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isRecording}
              className="w-full bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors active:scale-95"
            >
              解析して追加
            </button>
          </section>
        )}

        {/* Parsing */}
        {isParsingText && (
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <div className="text-3xl mb-3 animate-bounce">🤖</div>
            <p className="text-gray-700 font-medium">AIが解析中...</p>
            {recognizedText && (
              <p className="text-gray-500 text-sm mt-2 italic">「{recognizedText}」</p>
            )}
          </div>
        )}

        {/* Parsed Event Confirmation */}
        {parsedEvent && !isParsingText && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>✨</span>解析結果を確認
            </h3>
            {recognizedText && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">認識されたテキスト:</p>
                <p className="text-sm text-gray-700 italic">「{recognizedText}」</p>
              </div>
            )}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0 pt-0.5">タイトル</span>
                <input
                  type="text"
                  value={parsedEvent.title}
                  onChange={(e) => setParsedEvent({ ...parsedEvent, title: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0 pt-0.5">日付</span>
                <div className="flex-1">
                  <input
                    type="date"
                    value={parsedEvent.date}
                    onChange={(e) => setParsedEvent({ ...parsedEvent, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-blue-600 mt-1">{formatDateJapanese(parsedEvent.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0">開始</span>
                <input
                  type="time"
                  value={parsedEvent.startTime}
                  onChange={(e) => setParsedEvent({ ...parsedEvent, startTime: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0">終了</span>
                <input
                  type="time"
                  value={parsedEvent.endTime}
                  onChange={(e) => setParsedEvent({ ...parsedEvent, endTime: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-sm w-16 flex-shrink-0 pt-0.5">詳細</span>
                <textarea
                  value={parsedEvent.description}
                  onChange={(e) => setParsedEvent({ ...parsedEvent, description: e.target.value })}
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
