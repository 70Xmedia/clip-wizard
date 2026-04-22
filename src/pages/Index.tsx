import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/clipping/TopBar";
import { Hero } from "@/components/clipping/Hero";
import { HowItWorks } from "@/components/clipping/HowItWorks";
import { UploadPanel } from "@/components/clipping/UploadPanel";
import { PreviewPanel } from "@/components/clipping/PreviewPanel";
import { FormatPanel } from "@/components/clipping/FormatPanel";
import { TrimPanel } from "@/components/clipping/TrimPanel";
import { ExportPanel, type ExportState } from "@/components/clipping/ExportPanel";
import { TextOverlayPanel } from "@/components/clipping/TextOverlayPanel";
import { Faq } from "@/components/clipping/Faq";
import { Footer } from "@/components/clipping/Footer";
import { exportClip, type AspectRatio, type TextOverlay } from "@/lib/ffmpeg";
import { toast } from "sonner";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const [aspect, setAspect] = useState<AspectRatio>("9:16");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [blurBackground, setBlurBackground] = useState(true);
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);

  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });
  const editorRef = useRef<HTMLDivElement>(null);

  // Manage object URL
  useEffect(() => {
    if (!file) { setUrl(""); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    setExportState({ status: "idle" });
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const onDuration = (d: number) => {
    if (!isFinite(d)) return;
    setDuration(d);
    setStart(0);
    setEnd(Math.min(d, 15));
  };

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleExport = async () => {
    if (!file) return;
    setExportState({ status: "exporting", progress: 0 });
    try {
      const blob = await exportClip({
        file,
        start,
        end,
        aspect,
        zoom,
        offsetX,
        offsetY,
        blurBackground,
        textOverlay,
        onProgress: (p) => setExportState({ status: "exporting", progress: p }),
      });
      const u = URL.createObjectURL(blob);
      const filename = `clip-${aspect.replace(":", "x")}-${Date.now()}.mp4`;
      setExportState({ status: "done", url: u, filename });
      toast.success("Export complete. Your clip is ready.");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error
        ? err.message.slice(0, 280)
        : "Something went wrong while processing your video. Try a shorter clip or a smaller source file.";
      setExportState({
        status: "error",
        message,
      });
      toast.error("Export failed");
    }
  };

  const exportDuration = useMemo(() => Math.max(0, end - start), [start, end]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* CRT scanline overlay */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-15" aria-hidden />

      <TopBar onStart={scrollToEditor} />
      <Hero onStart={scrollToEditor} />
      <HowItWorks onStart={scrollToEditor} />

      <div ref={editorRef} className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight">Editor</h2>
          <p className="text-muted-foreground mt-2">
            Upload a video and export a perfect clip for Reels, TikTok, or Instagram.
          </p>
        </div>

        <div className="grid gap-6">
          <UploadPanel file={file} onFile={setFile} />

          {file && url && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <PreviewPanel
                  url={url}
                  aspect={aspect}
                  zoom={zoom}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  onOffsetChange={(x, y) => { setOffsetX(x); setOffsetY(y); }}
                  blurBackground={blurBackground}
                  startTime={start}
                  endTime={end}
                  onDurationLoaded={onDuration}
                  textOverlay={textOverlay}
                  onTextPosChange={(x, y) => setTextOverlay((o) => o ? { ...o, posX: x, posY: y } : o)}
                />
                <FormatPanel
                  aspect={aspect}
                  onAspect={setAspect}
                  blurBackground={blurBackground}
                  onBlur={setBlurBackground}
                  zoom={zoom}
                  onZoom={setZoom}
                  onCenter={() => { setOffsetX(0); setOffsetY(0); }}
                  onReset={() => { setOffsetX(0); setOffsetY(0); setZoom(1); }}
                />
              </div>

              <TrimPanel
                duration={duration}
                start={start}
                end={end}
                onChange={(s, e) => { setStart(s); setEnd(e); }}
                url={url}
              />

              <TextOverlayPanel overlay={textOverlay} onChange={setTextOverlay} />

              <ExportPanel
                aspect={aspect}
                duration={exportDuration}
                state={exportState}
                onExport={handleExport}
                onReset={() => setExportState({ status: "idle" })}
              />
            </>
          )}
        </div>
      </div>

      <Faq />
      <Footer />
    </div>
  );
};

export default Index;
