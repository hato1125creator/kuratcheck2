import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, ShieldCheck, AlertTriangle, Settings, Save, Copy, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import { analyzeApplication } from './services/geminiService';
import { cn } from './lib/utils';

function CopyableDraft({ text, children }: { text: string, children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group mt-2.5">
      <div className="bg-[#eff6ff] border border-[#bfdbfe] p-3 rounded-md text-[13px] text-[#1e40af] whitespace-pre-wrap font-sans pr-10">
        {children}
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 text-[#1e40af] bg-white/50 hover:bg-white rounded border border-[#bfdbfe] opacity-0 group-hover:opacity-100 transition-opacity"
        title="コピー"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

const DEFAULT_RULEBOOK = `* モチーフ：おとぎの国（ファンタジー）
* 団体Tシャツ：全員着用必須、ロゴの模倣・トレース禁止、個人加工禁止、追加装飾（サングラス等）禁止。
* 異装届：企画コンセプトに沿うこと。教室外での着用は原則禁止。
* 特例：業者「アスフィール株式会社」を利用する場合は著作権審査を免除（ただし発注エビデンスの確認が必要）。
* 重要：承認前の購入・注文は厳禁。
* 過去のトラブル：サッカーチームのロゴを模倣した悪質なデザイン。`;

export default function App() {
  const [rulebook, setRulebook] = useState(DEFAULT_RULEBOOK);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string; url: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロード可能です。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 data and mime type
      const match = result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        setImage({
          mimeType: match[1],
          data: match[2],
          url: result
        });
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) {
      setError('申請内容（テキスト）または画像を入力してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeApplication(text, rulebook, image?.data, image?.mimeType);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f2f4f7] text-[#0f172a] font-sans overflow-hidden">
      <header className="bg-[#1e293b] text-white px-6 py-3 flex justify-between items-center h-[60px] shrink-0">
        <div className="text-[18px] font-bold tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          2026年 梨花祭実行委員会 | 運営判断サポートAI
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 text-[12px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
            ルール設定
          </button>
          <div className="text-[12px] opacity-80 font-mono">
            SYS_VER: 2.1.0-STABLE
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 p-4 flex-1 overflow-hidden max-w-none mx-0">
        {/* Left Panel */}
        <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden h-full">
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] font-semibold text-[13px] uppercase flex justify-between items-center text-[#0f172a]">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              提出内容入力
            </div>
            <span className="opacity-60 font-mono">ID: NEW</span>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-[#64748b]">
                  デザイン画像・添付資料
                </label>
                
                {!image ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full aspect-square bg-[#e5e7eb] border border-[#e2e8f0] rounded flex flex-col items-center justify-center text-[#64748b] text-[12px] cursor-pointer transition-colors",
                      isDragging ? "border-[#1e293b] bg-slate-200" : "hover:bg-slate-200"
                    )}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p>クリックまたはドラッグ＆ドロップ</p>
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-[#e5e7eb] border border-[#e2e8f0] rounded relative flex items-center justify-center overflow-hidden">
                    <img 
                      src={image.url} 
                      alt="Uploaded design" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-white/90 text-[#0f172a] p-1.5 rounded shadow-sm hover:bg-[#ef4444] hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label htmlFor="application-text" className="block text-[12px] font-medium text-[#64748b]">
                  申請内容・備考 <span className="text-[#ef4444]">*</span>
                </label>
                <textarea
                  id="application-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="例: 3年A組のクラスTシャツデザイン案です。背面にキャラクターのパロディを含みます。アスフィール株式会社に発注予定です。"
                  className="w-full h-32 px-3 py-2 border border-[#e2e8f0] rounded focus:outline-none focus:border-[#1e293b] resize-none text-[13px] bg-[#f8fafc]"
                />
              </div>

              {error && (
                <div className="bg-[#ef4444]/10 text-[#ef4444] p-2.5 rounded border border-[#ef4444]/20 text-[12px] flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!text.trim() && !image)}
                className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded text-[12px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    コンプライアンス審査を実行
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Panel */}
        <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden h-full">
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] font-semibold text-[13px] uppercase flex justify-between items-center text-[#0f172a]">
            AI判定レポート
          </div>
          
          <div className="p-4 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-[#64748b] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e293b]" />
                <p className="text-[13px] font-medium animate-pulse">AIがルールブックと照合中...</p>
              </div>
            ) : result ? (
              <div className="text-[13px] text-[#0f172a]">
                <Markdown
                  components={{
                    h2: ({node, ...props}) => {
                      const text = String(props.children);
                      if (text.includes('総合判定')) return null;
                      return <div className="text-[14px] font-bold my-4 flex items-center gap-2 before:content-[''] before:w-1 before:h-3.5 before:bg-[#1e293b] before:block" {...props} />
                    },
                    p: ({node, ...props}) => {
                      const extractText = (children: any): string => {
                        if (typeof children === 'string') return children;
                        if (Array.isArray(children)) return children.map(extractText).join('');
                        if (children?.props?.children) return extractText(children.props.children);
                        return '';
                      };
                      
                      const text = extractText(props.children);
                      const isDraft = text.includes('承認前の購入は厳禁') || text.startsWith('「');
                      const isJudge = text.includes('【OK') || text.includes('【保留') || text.includes('【NG');
                      
                      if (isJudge) {
                        let badgeClass = "bg-[#f8fafc] text-[#0f172a] border-[#e2e8f0]";
                        if (text.includes('OK')) badgeClass = "bg-[#d1fae5] text-[#065f46] border-[#10b981]";
                        if (text.includes('保留')) badgeClass = "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]";
                        if (text.includes('NG')) badgeClass = "bg-[#fee2e2] text-[#991b1b] border-[#ef4444]";
                        
                        return (
                          <div className="flex gap-4 mb-5">
                            <div className={cn("px-4 py-2 rounded-md font-extrabold text-xl flex-1 text-center border-2", badgeClass)}>
                              {props.children}
                            </div>
                          </div>
                        );
                      }

                      if (isDraft) {
                        return <CopyableDraft text={text}>{props.children}</CopyableDraft>;
                      }
                      return <div className="text-[13px] leading-relaxed bg-[#f8fafc] p-3 rounded-md border border-[#e2e8f0] mb-4" {...props} />
                    },
                    ul: ({node, ...props}) => {
                      return <ul className="text-[13px] leading-relaxed bg-[#f8fafc] p-3 rounded-md border border-[#e2e8f0] list-none pl-0 mb-4" {...props} />
                    },
                    li: ({node, ...props}) => (
                      <li className="relative pl-3.5 mb-1 before:content-['•'] before:absolute before:left-0 before:text-[#64748b]" {...props} />
                    ),
                    strong: ({node, ...props}) => (
                      <span className="text-[#ef4444] font-bold" {...props} />
                    )
                  }}
                >
                  {result}
                </Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#64748b] space-y-3">
                <ShieldCheck className="w-12 h-12 opacity-20" />
                <p className="text-[13px]">申請情報を入力し、審査を実行してください。</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="font-bold text-[14px] text-[#0f172a] flex items-center gap-2">
                <Settings className="w-4 h-4" />
                ルールブック設定
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1">
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">
                審査基準となるルールブックの内容を入力してください
              </label>
              <textarea
                value={rulebook}
                onChange={(e) => setRulebook(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-[#e2e8f0] rounded focus:outline-none focus:border-[#1e293b] resize-none text-[13px] bg-[#f8fafc] font-sans"
              />
            </div>
            <div className="p-4 border-t border-[#e2e8f0] flex justify-end gap-3 bg-[#f8fafc]">
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="px-4 py-2 rounded text-[12px] border border-[#e2e8f0] bg-white font-semibold text-[#0f172a] hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="px-4 py-2 rounded text-[12px] border-none bg-[#1e293b] font-semibold text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                保存して閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
