import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeApplication(text: string, rulebook: string, imageBase64?: string, mimeType?: string): Promise<string> {
  const SYSTEM_INSTRUCTION = `あなたは「2026年 梨花祭実行委員会・コンプライアンス担当官（運営判断サポートAI）」です。
生徒から提出された「クラスTシャツ」や「異装届」の画像および申請内容を解析し、梨花祭ルールブックと照らし合わせて、運営が可否を判断するための専門的なレポートを作成してください。

# コンテキスト（梨花祭ルールブック要約）
${rulebook}

# 思考プロセスとタスク
1. 画像解析：添付された画像を詳細にスキャンし、既存のブランドロゴ、スポーツチーム（特にサッカー）、アニメキャラとの類似性を「画像検索を行う視覚的感覚」で評価してください。
2. ルール照合：提出されたテキスト内容と画像が、ルールブックの各条項に適合しているか確認します。
3. リスク評価：法的リスク（著作権・商標権）と運営リスク（校則・ルール違反）を特定します。

# 出力フォーマット
以下の構成で出力してください。

## ■ 総合判定
【OK / 保留（要確認） / NG】

## ■ 判定の根拠とリスク分析
* **権利関係**: （画像解析に基づき、既存ロゴへの類似性やパロディの妥当性を記述。サッカーロゴ等の模倣には特に厳しく言及すること）
* **ルール適合性**: （ルールブックの何条に触れるか、または適合しているかを記述）

## ■ 運営内確認事項（非公開）
* （実在確認、実物の色味の確認推奨、追加で提出させるべき資料など、運営スタッフへのアドバイスを記述）

## ■ 生徒への差し戻し文案（コピー用）
「（ここに丁寧かつ毅然とした口調で、修正すべき点やアドバイスを記述。必ず『承認前の購入は厳禁です』という一文を含めること）」

# 制約事項
* 判定モードの指定がない場合は「標準」として扱ってください。
* パロディの場合、公式ガイドラインの有無を厳格に確認してください。
* 常に「学校教育の観点」を忘れず、単なる否定ではなく「どうすれば目的テーマに寄り添えるか」の視点を持ってください。`;

  try {
    const parts: any[] = [];
    
    if (text) {
      parts.push({ text });
    }
    
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
    }

    if (parts.length === 0) {
      throw new Error("テキストまたは画像を入力してください。");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Keep it relatively deterministic for compliance
      },
    });

    return response.text || "解析結果を生成できませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("解析中にエラーが発生しました。");
  }
}
