import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ParsedEvent {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description: string;
}

// 日本語テキストから予定をルールベースで解析するフォールバック関数
function parseJapaneseEventFallback(text: string): ParsedEvent {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(now.getTime() + jstOffset + now.getTimezoneOffset() * 60000);

  // デフォルト日付（今日）
  let targetDate = new Date(jst);
  let startHour = 9;
  let startMinute = 0;
  let endHour = 10;
  let endMinute = 0;

  // 日付解析
  if (/明後日|あさって/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (/明日|あした|あす/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (/来週/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  // 曜日解析
  const weekdayMap: { [key: string]: number } = {
    "日曜": 0, "月曜": 1, "火曜": 2, "水曜": 3,
    "木曜": 4, "金曜": 5, "土曜": 6
  };
  for (const [name, day] of Object.entries(weekdayMap)) {
    if (text.includes(name)) {
      const current = targetDate.getDay();
      let diff = day - current;
      if (diff <= 0) diff += 7;
      targetDate.setDate(targetDate.getDate() + diff);
      break;
    }
  }

  const dateStr = targetDate.toISOString().split("T")[0];

  // 午前/午後判定
  const isAfternoon = /午後|夕方|夜/.test(text);
  const isMorning = /午前|朝/.test(text);

  // 開始時刻解析
  const startTimeMatch = text.match(/(\d{1,2})時(?:(\d{2})分)?(?:から|に|頃)?/);
  if (startTimeMatch) {
    startHour = parseInt(startTimeMatch[1]);
    startMinute = startTimeMatch[2] ? parseInt(startTimeMatch[2]) : 0;

    if (isAfternoon && startHour < 12) startHour += 12;
    else if (isMorning && startHour === 12) startHour = 0;
    else if (!isMorning && startHour >= 1 && startHour <= 7) startHour += 12;
  } else if (/朝|午前/.test(text)) {
    startHour = 9;
  } else if (/昼/.test(text)) {
    startHour = 12;
  } else if (/午後|夕方/.test(text)) {
    startHour = 14;
  } else if (/夜/.test(text)) {
    startHour = 19;
  }

  // 終了時刻解析
  const endTimeMatch = text.match(/(\d{1,2})時(?:(\d{2})分)?まで/);
  if (endTimeMatch) {
    endHour = parseInt(endTimeMatch[1]);
    endMinute = endTimeMatch[2] ? parseInt(endTimeMatch[2]) : 0;
    if (isAfternoon && endHour < 12) endHour += 12;
  } else {
    endHour = (startHour + 1) % 24;
    endMinute = startMinute;
  }

  const startTime = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
  const endTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

  // タイトル抽出（日時ワードを除去）
  let title = text
    .replace(/明後日|あさって|明日|あした|あす|今日|きょう|来週/g, "")
    .replace(/[日月火水木金土]曜日?/g, "")
    .replace(/午前|午後|朝|昼|夕方|夜/g, "")
    .replace(/\d{1,2}時\d{0,2}分?まで/g, "")
    .replace(/\d{1,2}時\d{0,2}分?/g, "")
    .replace(/から|まで|ごろ|頃|に|を|が|は|の|で|へ|と/g, "")
    .replace(/追加|登録|予定|入れて|して/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) title = text.trim();

  return {
    title,
    date: dateStr,
    startTime,
    endTime,
    description: `音声入力: 「${text}」`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Gemini APIを試みる
    if (apiKey) {
      try {
        const now = new Date();
        const jstOffset = 9 * 60;
        const utcOffset = now.getTimezoneOffset();
        const jstDate = new Date(now.getTime() + (jstOffset + utcOffset) * 60000);
        const todayStr = jstDate.toISOString().split("T")[0];
        const year = jstDate.getFullYear();
        const month = jstDate.getMonth() + 1;
        const day = jstDate.getDate();
        const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
        const weekday = weekdays[jstDate.getDay()];

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `
あなたは日本語の自然文から予定情報を抽出するアシスタントです。
今日の日付は ${year}年${month}月${day}日（${weekday}）です。

以下の日本語テキストから予定情報を抽出し、JSON形式で返してください。

入力テキスト: "${text}"

以下のルールに従ってください:
- 日付が指定されていない場合は今日の日付 (${todayStr}) を使用してください
- 「明日」は ${new Date(jstDate.getTime() + 86400000).toISOString().split("T")[0]} です
- 時刻が指定されていない場合は09:00を使用してください
- 終了時刻が指定されていない場合は開始時刻の1時間後を設定してください

必ず以下のJSON形式のみで返答してください:
{
  "title": "予定のタイトル",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "description": ""
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsedEvent: ParsedEvent = JSON.parse(jsonMatch[0]);
          if (parsedEvent.title && parsedEvent.date && parsedEvent.startTime && parsedEvent.endTime) {
            return NextResponse.json(parsedEvent);
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API失敗、ルールベース解析にフォールバック:", geminiError);
        // フォールバックに続く
      }
    }

    // Geminiが使えない場合はルールベース解析
    const fallbackResult = parseJapaneseEventFallback(text);
    return NextResponse.json({ ...fallbackResult, _fallback: true });

  } catch (error) {
    console.error("Error in gemini route:", error);
    return NextResponse.json({ error: "予定の解析に失敗しました" }, { status: 500 });
  }
}
