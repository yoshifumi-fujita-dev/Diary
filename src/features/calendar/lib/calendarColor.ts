/**
 * カレンダーの日付テキスト色を決定する
 * @param dayOfWeek 0=日曜, 6=土曜
 * @param isHoliday 祝日かどうか
 */
export function getDayColorType(
  dayOfWeek: number,
  isHoliday: boolean
): "red" | "blue" | "normal" {
  if (dayOfWeek === 0 || isHoliday) return "red";
  if (dayOfWeek === 6) return "blue";
  return "normal";
}
