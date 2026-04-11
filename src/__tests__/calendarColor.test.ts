import { describe, it, expect } from "vitest";
import { getDayColorType } from "@/lib/calendarColor";

describe("getDayColorType", () => {
  describe("祝日でない場合", () => {
    it("日曜（0）は red", () => {
      expect(getDayColorType(0, false)).toBe("red");
    });

    it("月曜（1）は normal", () => {
      expect(getDayColorType(1, false)).toBe("normal");
    });

    it("火曜（2）は normal", () => {
      expect(getDayColorType(2, false)).toBe("normal");
    });

    it("水曜（3）は normal", () => {
      expect(getDayColorType(3, false)).toBe("normal");
    });

    it("木曜（4）は normal", () => {
      expect(getDayColorType(4, false)).toBe("normal");
    });

    it("金曜（5）は normal", () => {
      expect(getDayColorType(5, false)).toBe("normal");
    });

    it("土曜（6）は blue", () => {
      expect(getDayColorType(6, false)).toBe("blue");
    });
  });

  describe("祝日の場合", () => {
    it("祝日の平日（月〜金）は red", () => {
      expect(getDayColorType(1, true)).toBe("red");
      expect(getDayColorType(3, true)).toBe("red");
      expect(getDayColorType(5, true)).toBe("red");
    });

    it("祝日の土曜は red（土曜色より祝日色が優先）", () => {
      expect(getDayColorType(6, true)).toBe("red");
    });

    it("祝日の日曜は red（バグ修正確認: 以前は白くなっていた）", () => {
      // 5月4日みどりの日が日曜に重なるケースなど
      expect(getDayColorType(0, true)).toBe("red");
    });
  });
});
