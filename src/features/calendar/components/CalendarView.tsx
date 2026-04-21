"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import * as HolidayJP from "@holiday-jp/holiday_jp";
import { getDayColorType } from "@/features/calendar/lib/calendarColor";

interface CalendarViewProps {
  entryDates: string[]; // YYYY-MM-DD[]
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayStr(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CalendarView({ entryDates }: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showAutoLockNotice, setShowAutoLockNotice] = useState(false);
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const entrySet = new Set(entryDates);
  const todayStr = getTodayStr();

  // 当月の祝日マップ { "YYYY-MM-DD": "祝日名" }
  const holidayMap = useMemo(() => {
    const map: Record<string, string> = {};
    const holidays = HolidayJP.between(
      new Date(year, month, 1),
      new Date(year, month + 1, 0)
    );
    for (const h of holidays) {
      const d = new Date(h.date);
      const key = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      map[key] = h.name;
    }
    return map;
  }, [year, month]);

  // カレンダー計算
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const isFutureMonth =
    year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  function isFutureDay(day: number): boolean {
    return toDateStr(year, month, day) > todayStr;
  }

  function setMonthWithFocus(newYear: number, newMonth: number, preferredDay?: number) {
    setYear(newYear);
    setMonth(newMonth);
    const targetDaysInMonth = new Date(newYear, newMonth + 1, 0).getDate();
    let nextDay = preferredDay ?? 1;
    if (nextDay > targetDaysInMonth) nextDay = targetDaysInMonth;

    const isTargetFuture =
      newYear > today.getFullYear() ||
      (newYear === today.getFullYear() && newMonth > today.getMonth()) ||
      (newYear === today.getFullYear() && newMonth === today.getMonth() && nextDay > today.getDate());

    setFocusedDay(isTargetFuture ? null : nextDay);
  }

  function prevMonth() {
    if (month === 0) setMonthWithFocus(year - 1, 11, focusedDay ?? 1);
    else setMonthWithFocus(year, month - 1, focusedDay ?? 1);
  }

  function nextMonth() {
    if (month === 11) setMonthWithFocus(year + 1, 0, focusedDay ?? 1);
    else setMonthWithFocus(year, month + 1, focusedDay ?? 1);
  }

  function handleDateClick(day: number) {
    const dateStr = toDateStr(year, month, day);
    setSelectedDate(dateStr);
    setPassword("");
    setError("");
    setShowModal(true);
  }

  function goToToday() {
    setMonthWithFocus(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function handleGridKeyDown(e: React.KeyboardEvent) {
    if (showModal || showPicker) return;
    if (focusedDay == null) return;

    let nextDay = focusedDay;
    let handled = true;

    switch (e.key) {
      case "ArrowLeft":
        nextDay -= 1;
        break;
      case "ArrowRight":
        nextDay += 1;
        break;
      case "ArrowUp":
        nextDay -= 7;
        break;
      case "ArrowDown":
        nextDay += 7;
        break;
      case "Home":
        nextDay = 1;
        break;
      case "End":
        nextDay = daysInMonth;
        break;
      case "Enter":
      case " ":
        if (!isFutureDay(focusedDay)) handleDateClick(focusedDay);
        break;
      default:
        handled = false;
    }

    if (!handled) return;
    e.preventDefault();

    if (e.key === "Enter" || e.key === " ") return;

    if (nextDay < 1) {
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthIndex = month === 0 ? 11 : month - 1;
      const prevDays = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
      const targetDay = prevDays + nextDay;
      setMonthWithFocus(prevYear, prevMonthIndex, targetDay);
      return;
    }

    if (nextDay > daysInMonth) {
      const nextYear = month === 11 ? year + 1 : year;
      const nextMonthIndex = month === 11 ? 0 : month + 1;
      const targetDay = nextDay - daysInMonth;
      setMonthWithFocus(nextYear, nextMonthIndex, targetDay);
      return;
    }

    if (isFutureDay(nextDay)) {
      setFocusedDay(today.getDate());
      return;
    }

    setFocusedDay(nextDay);
  }

  useEffect(() => {
    if (isFutureMonth) {
      setFocusedDay(null);
      return;
    }
    if (year === today.getFullYear() && month === today.getMonth()) {
      if (focusedDay == null) {
        setFocusedDay(today.getDate());
      } else if (isFutureDay(focusedDay)) {
        setFocusedDay(today.getDate());
      }
    } else if (focusedDay == null) {
      setFocusedDay(1);
    }
  }, [year, month, isFutureMonth]);

  useEffect(() => {
    if (focusedDay == null) return;
    const button = gridRef.current?.querySelector<HTMLButtonElement>(
      `button[data-day="${focusedDay}"]`
    );
    button?.focus();
  }, [focusedDay, year, month]);

  useEffect(() => {
    const autoLock = searchParams.get("autolock");
    if (autoLock === "1") {
      setShowAutoLockNotice(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("autolock");
      const next = params.toString();
      router.replace(next ? `/?${next}` : "/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (showModal || showPicker) return;
    if (focusedDay == null) return;
    const id = requestAnimationFrame(() => {
      const button = gridRef.current?.querySelector<HTMLButtonElement>(
        `button[data-day="${focusedDay}"]`
      );
      button?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [showModal, showPicker, focusedDay, year, month]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError("");

    const res = await fetch("/api/auth/verify-diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setShowModal(false);
      router.push(`/entries/${selectedDate}/edit`);
    } else {
      setError("パスワードが違います");
    }
    setVerifying(false);
  }

  return (
    <div>
      {/* 月ナビゲーション */}
      <div className="flex items-center mb-6">
        <div className="flex-1">
          <Link
            href="/entries"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            日記一覧
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors text-xl"
          >
            ‹
          </button>

          {/* 年月クリックでピッカー表示 */}
          <button
            onClick={() => { setPickerYear(year); setShowPicker(true); }}
            className="text-zinc-100 font-semibold text-lg hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            {year}年{month + 1}月
          </button>

          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors text-xl"
          >
            ›
          </button>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1">
          <Link
            href="/settings"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            設定
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="border border-zinc-800 rounded-2xl p-4">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-center text-xs py-2 font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-zinc-500"
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div
        ref={gridRef}
        className="grid grid-cols-7 gap-2"
        onKeyDown={handleGridKeyDown}
      >
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
          const dateStr = toDateStr(year, month, day);
          const isToday = dateStr === todayStr;
          const hasEntry = entrySet.has(dateStr);
          const dayOfWeek = idx % 7;
          const isFuture = dateStr > todayStr;
          const holidayName = holidayMap[dateStr];
          const isHoliday = !!holidayName;
          const isFocused = focusedDay === day;

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              disabled={isFuture}
              data-day={day}
              tabIndex={isFuture ? -1 : isFocused ? 0 : -1}
              onFocus={() => setFocusedDay(day)}
              title={holidayName}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-2xl text-base
                transition-colors
                ${isFuture ? "opacity-25 cursor-default" : "hover:bg-zinc-800 cursor-pointer"}
                ${hasEntry && !isToday ? "bg-zinc-800 ring-1 ring-zinc-600" : ""}
                ${isToday ? "bg-zinc-700 font-bold ring-1 ring-zinc-400" : ""}
                ${getDayColorType(dayOfWeek, isHoliday) === "red" ? "text-red-400" : getDayColorType(dayOfWeek, isHoliday) === "blue" ? "text-blue-400" : "text-zinc-300"}
              `}
            >
              <span className="leading-none">{day}</span>
              {isHoliday && (
                <span className="mt-1 text-[10px] leading-none text-red-400">
                  {holidayName}
                </span>
              )}
              {hasEntry && (
                <span className={`absolute bottom-1 text-[10px] leading-none ${isHoliday ? "text-red-400" : "text-zinc-400"}`}>
                  ！＼(◎o◎)／！
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>{/* /カレンダー本体 */}

      {/* 凡例 */}
      <div className="flex items-center gap-4 mt-4 justify-end">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-4 h-4 rounded-md bg-zinc-800 ring-1 ring-zinc-600 inline-block" />
          日記あり
        </div>
        <button
          type="button"
          onClick={goToToday}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <span className="w-4 h-4 rounded-md bg-zinc-700 ring-1 ring-zinc-400 inline-block" />
          今日
        </button>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
          祝日
        </div>
      </div>

      {/* 年月ピッカーモーダル */}
      {showPicker && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPicker(false); }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-zinc-100 font-semibold text-sm mb-4">年月を選択</h2>

            {/* 年選択 */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <button
                onClick={() => setPickerYear(y => y - 1)}
                disabled={pickerYear <= 2000}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full disabled:opacity-30"
              >
                ‹
              </button>
              <select
                value={pickerYear}
                onChange={(e) => setPickerYear(Number(e.target.value))}
                className="flex-1 text-center bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:border-zinc-500"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="text-zinc-100">
                    {y}年
                  </option>
                ))}
              </select>
              <button
                onClick={() => setPickerYear(y => y + 1)}
                disabled={pickerYear >= currentYear}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full disabled:opacity-30"
              >
                ›
              </button>
            </div>

            {/* 月選択グリッド */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {MONTHS.map((m) => {
                const isSelected = pickerYear === year && m === month + 1;
                const isFutureMonth = pickerYear === currentYear && m > today.getMonth() + 1;
                return (
                  <button
                    key={m}
                    disabled={isFutureMonth}
                    onClick={() => {
                      setYear(pickerYear);
                      setMonth(m - 1);
                      setShowPicker(false);
                    }}
                    className={`
                      py-2 rounded-lg text-sm transition-colors
                      ${isSelected ? "bg-zinc-600 text-zinc-100 font-bold" : "text-zinc-300 hover:bg-zinc-800"}
                      ${isFutureMonth ? "opacity-25 cursor-default" : ""}
                    `}
                  >
                    {m}月
                  </button>
                );
              })}
            </div>

            {/* 今月に戻るボタン */}
            <button
              onClick={() => {
                setYear(today.getFullYear());
                setMonth(today.getMonth());
                setShowPicker(false);
              }}
              className="w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 text-sm transition-colors"
            >
              今月に戻る
            </button>
          </div>
        </div>
      )}

      {/* パスワードモーダル */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <p className="text-zinc-500 text-xs mb-1">{selectedDate}</p>
            <h2 className="text-zinc-100 font-semibold text-base mb-4">日記パスワードを入力</h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
                placeholder="パスワード"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-2.5 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {verifying ? "確認中..." : "開く"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 自動ロック通知 */}
      {showAutoLockNotice && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAutoLockNotice(false); }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-zinc-100 font-semibold text-base mb-2">自動ロックしました</h2>
            <p className="text-zinc-400 text-sm mb-4">
              操作がなかったため、日記入力を終了しました。
            </p>
            <button
              type="button"
              onClick={() => setShowAutoLockNotice(false)}
              className="w-full py-2.5 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors text-sm font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
