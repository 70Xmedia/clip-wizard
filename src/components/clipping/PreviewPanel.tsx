import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ASPECT_PRESETS, type AspectRatio } from "@/lib/ffmpeg";

interface PreviewPanelProps {
  url: string;
  aspect: AspectRatio;
  zoom: number;
  offsetX: number;
  offsetY: number;
  onOffsetChange: (x: number, y: number) => void;
  blurBackground: boolean;
  startTime: number;
  endTime: number;
  onDurationLoaded: (d: number) => void;
}

export function PreviewPanel({
  url, aspect, zoom, offsetX, offsetY, onOffsetChange,
  blurBackground, startTime, endTime, onDurationLoaded,
}: PreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [safeZone, setSafeZone] = useState(true);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(true);
  const [dragging, setDragging] = useState(false);

  const preset = ASPECT_PRESETS[aspect];
  const aspectRatio = preset.w / preset.h;

  // Loop trim region
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (loop && v.currentTime >= endTime) {
        v.currentTime = startTime;
        v.play().catch(() => {});
      }
      // Sync background video
      if (bgRef.current && Math.abs(bgRef.current.currentTime - v.currentTime) > 0.2) {
        bgRef.current.currentTime = v.currentTime;
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [loop, startTime, endTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (v && v.currentTime < startTime) v.currentTime = startTime;
  }, [startTime]);

  // Drag handling
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // movementX/Y for incremental drag mapped to -1..1 normalized over container
      const dx = (e.movementX / rect.width) * 2;
      const dy = (e.movementY / rect.height) * 2;
      const nx = Math.max(-1, Math.min(1, offsetX + dx));
      const ny = Math.max(-1, Math.min(1, offsetY + dy));
      onOffsetChange(nx, ny);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, offsetX, offsetY, onOffsetChange]);

  // Foreground transform: scale + translate
  const translateX = offsetX * 50; // -50% .. 50%
  const translateY = offsetY * 50;

  return (
    <section className="bg-surface border-2 border-border p-6 sm:p-8" aria-labelledby="preview-heading">
      <header className="flex items-center justify-between mb-4">
        <h3 id="preview-heading" className="text-lg font-bold uppercase tracking-tight">Preview</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {preset.w}×{preset.h}
        </span>
      </header>

      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="relative bg-black overflow-hidden border border-border-glow w-full"
          style={{ aspectRatio: `${aspectRatio}`, maxHeight: "60vh", maxWidth: aspectRatio < 1 ? "min(100%, 360px)" : "100%" }}
          onPointerDown={(e) => { e.preventDefault(); setDragging(true); }}
        >
          {/* Blur background layer */}
          {blurBackground && (
            <video
              ref={bgRef}
              src={url}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "blur(28px)", transform: "scale(1.2)" }}
              autoPlay
              muted
              playsInline
              loop
            />
          )}
          {/* Foreground video */}
          <video
            ref={videoRef}
            src={url}
            onLoadedMetadata={(e) => onDurationLoaded(e.currentTarget.duration)}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${translateX}%, ${translateY}%) scale(${zoom})`,
              transformOrigin: "center center",
            }}
            autoPlay
            playsInline
            loop={loop}
            muted={muted}
          />

          {/* Safe zone overlay (TikTok UI safe area approx) */}
          {safeZone && aspect === "9:16" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-4 top-[10%] bottom-[18%] border border-signal-green/40 border-dashed" />
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Preview updates instantly. Export will match your selected format.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={safeZone} onCheckedChange={(v) => setSafeZone(!!v)} />
          <span title="Shows TikTok/Reels UI-safe areas (not included in export).">Safe Zone</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={loop} onCheckedChange={(v) => setLoop(!!v)} />
          <span>Loop Preview</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={muted} onCheckedChange={(v) => setMuted(!!v)} />
          <span>Mute Preview</span>
        </label>
      </div>
    </section>
  );
}