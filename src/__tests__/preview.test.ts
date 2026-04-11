import { describe, it, expect } from "vitest";
import { makePreview } from "@/features/entries/lib/preview";
import { stripHtml } from "@/features/entries/lib/text";

describe("stripHtml", () => {
  it("pタグを除去する", () => {
    expect(stripHtml("<p>こんにちは</p>")).toBe("こんにちは");
  });

  it("複数のpタグをスペース区切りにまとめる", () => {
    const result = stripHtml("<p>一段落目</p><p>二段落目</p>");
    expect(result).toContain("一段落目");
    expect(result).toContain("二段落目");
  });

  it("brタグを改行に変換する", () => {
    const result = stripHtml("line1<br>line2");
    expect(result).toContain("line1");
    expect(result).toContain("line2");
  });

  it("その他のHTMLタグを除去する", () => {
    expect(stripHtml("<strong>太字</strong>")).toBe("太字");
  });

  it("空文字を返す（空HTML）", () => {
    expect(stripHtml("<p></p>")).toBe("");
  });

  it("前後の余分なスペースをトリムする", () => {
    expect(stripHtml("  <p>  text  </p>  ")).toBe("text");
  });

  it("タグなしのテキストはそのまま返す", () => {
    expect(stripHtml("プレーンテキスト")).toBe("プレーンテキスト");
  });
});

describe("makePreview", () => {
  it("制限以下なら全文を返す", () => {
    expect(makePreview("<p>短い文章</p>", 100)).toBe("短い文章");
  });

  it("制限を超えたら末尾を…で切り詰める", () => {
    const longText = "あ".repeat(100);
    const result = makePreview(`<p>${longText}</p>`, 10);
    expect(result).toBe("あ".repeat(10) + "…");
  });

  it("ちょうど制限文字数なら切り詰めない", () => {
    const text = "あ".repeat(10);
    expect(makePreview(`<p>${text}</p>`, 10)).toBe(text);
  });

  it("HTMLを除去した上で長さを計算する", () => {
    // タグ込みで長くても、テキストが短ければ切り詰めない
    const html = "<strong><em><p>短い</p></em></strong>";
    expect(makePreview(html, 10)).toBe("短い");
  });
});
