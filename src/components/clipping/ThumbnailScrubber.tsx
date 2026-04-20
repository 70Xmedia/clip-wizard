import { useEffect, useRef, useState } from "react";

interface ThumbnailScrubberProps {
  url: string;
  duration: number;
  count?: number;
}

/**
 * Generates `count` thumbnail frames from the video using a hidden video + canvas.
 * Lightweight (no ffmpeg roundtrip) and runs once per (url, duration).
 */
export function ThumbnailScrubber({ url, duration, count = 10 }: ThumbnailScrubberProps) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const canceledRef = useRef(false);

  useEffect(() => {
    canceledRef.current = false;
    setThumbs([]);
    if (!url || !duration || !isFinite(duration)) return;

    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const canvas = document.createElement("canvas");
    const W = 160;
    const H = 90;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const captureAt = (t: number) =>
      new Promise<string>((resolve, reject) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          if (!ctx) return reject(new Error("no ctx"));
          try {
            // cover-fit
            const vr = video.videoWidth / video.videoHeight;
            const cr = W / H;
            let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
            if (vr > cr) {
              sw = video.videoHeight * cr;
              sx = (video.videoWidth - sw) / 2;
            } else {
              sh = video.videoWidth / cr;
              sy = (video.videoHeight - sh) / 2;
            }
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
            resolve(canvas.toDataURL("image/jpeg", 0.55));
          } catch (e) {
            reject(e);
          }
        };
        video.addEventListener("seeked", onSeeked, { once: true });
        video.currentTime = Math.min(Math.max(t, 0), Math.max(0, duration - 0.05));
      });

    const run = async () => {
      await new Promise<void>((res) => {
        if (video.readyState >= 1) res();
        else video.addEventListener("loadedmetadata", () => res(), { once: true });
      });
      const out: string[] = [];
      for (let i = 0; i < count; i++) {
        if (canceledRef.current) return;
        const t = (i + 0.5) * (duration / count);
        try {
          const url = await captureAt(t);
          out.push(url);
          if (!canceledRef.current) setThumbs([...out]);
        } catch {
          // skip
        }
      }
    };

    run();

    return () => {
      canceledRef.current = true;
      video.src = "";
    };
  }, [url, duration, count]);

  return (
    <div className="mt-3 grid gap-[2px] bg-border border border-border" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-video bg-background overflow-hidden">
          {thumbs[i] ? (
            <img src={thumbs[i]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}