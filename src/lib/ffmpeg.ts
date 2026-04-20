import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

export { fetchFile };

export type AspectRatio = "9:16" | "1:1" | "4:5";

export const ASPECT_PRESETS: Record<
  AspectRatio,
  { label: string; sublabel: string; w: number; h: number }
> = {
  "9:16": { label: "TikTok / Reels (9:16)", sublabel: "Best for vertical video", w: 1080, h: 1920 },
  "1:1": { label: "Instagram Post (1:1)", sublabel: "Square feed post", w: 1080, h: 1080 },
  "4:5": { label: "Instagram Feed (4:5)", sublabel: "Most common IG format", w: 1080, h: 1350 },
};

export function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export interface ExportOptions {
  file: File;
  start: number;
  end: number;
  aspect: AspectRatio;
  /** zoom 1 = fit, >1 zoom in */
  zoom: number;
  /** offset in normalized coords -1..1 of the source (after object-fit cover style) */
  offsetX: number;
  offsetY: number;
  blurBackground: boolean;
  onProgress?: (pct: number) => void;
}

export async function exportClip(opts: ExportOptions): Promise<Blob> {
  const { file, start, end, aspect, zoom, offsetX, offsetY, blurBackground, onProgress } = opts;
  const ffmpeg = await getFFmpeg();
  const preset = ASPECT_PRESETS[aspect];
  const W = preset.w;
  const H = preset.h;
  const duration = Math.max(0.1, end - start);

  // Progress: prefer log-based parsing (reliable across versions), fall back to native event
  let lastPct = 0;
  const report = (pct: number) => {
    if (!onProgress) return;
    const v = Math.min(99, Math.max(lastPct, Math.round(pct)));
    if (v !== lastPct) {
      lastPct = v;
      onProgress(v);
    }
  };
  const progressHandler = ({ progress }: { progress: number }) => {
    if (isFinite(progress) && progress > 0) report(progress * 100);
  };
  const logHandler = ({ message }: { message: string }) => {
    // Parse "time=00:00:01.23"
    const m = message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) {
      const t = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
      report((t / duration) * 100);
    }
  };
  ffmpeg.on("progress", progressHandler);
  ffmpeg.on("log", logHandler);
  // Kick progress so the UI doesn't sit at 0
  if (onProgress) onProgress(1);

  const inputName = "input." + (file.name.split(".").pop() || "mp4");
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Build filter graph
  // Foreground: scale to cover the target frame with `zoom` * cover scale, then translate by offsets, then crop to W x H
  // We use scale to cover then crop.
  // For "cover" we compute scaleExpr at runtime via ffmpeg expressions:
  //   scale=w='if(gt(a,A),-2,W*z)':h='if(gt(a,A),H*z,-2)' where A = W/H, z = zoom
  // Simpler: scale the longer needed dimension. Use force_original_aspect_ratio=increase then crop.
  const z = Math.max(1, zoom);
  const fgScale = `scale=w=${W}*${z}:h=${H}*${z}:force_original_aspect_ratio=increase`;
  // After scale, dimensions are >= W*z x H*z. Crop to W x H with offset.
  // Offset range: -1..1 maps to remaining slack (in_w - W) / 2.
  const cropX = `(in_w-${W})/2 + ${offsetX}*(in_w-${W})/2`;
  const cropY = `(in_h-${H})/2 + ${offsetY}*(in_h-${H})/2`;
  const fgCrop = `crop=${W}:${H}:${cropX}:${cropY}`;

  let filter: string;
  if (blurBackground) {
    filter =
      `[0:v]split=2[bg][fg];` +
      `[bg]scale=w=${W}:h=${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=luma_radius=40:luma_power=2[bgb];` +
      `[fg]${fgScale},${fgCrop}[fgc];` +
      `[bgb][fgc]overlay=(W-w)/2:(H-h)/2[outv]`;
  } else {
    filter = `[0:v]${fgScale},${fgCrop}[outv]`;
  }

  const outputName = "output.mp4";
  // Input-side seek (-ss before -i) is fast; -t limits duration for both progress + output
  const args = [
    "-ss", String(start),
    "-i", inputName,
    "-t", String(duration),
    "-filter_complex", filter,
    "-map", "[outv]",
    "-map", "0:a?",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "fastdecode",
    "-crf", "26",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ];

  await ffmpeg.exec(args);
  const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
  ffmpeg.off("progress", progressHandler);
  ffmpeg.off("log", logHandler);

  // Cleanup
  try { await ffmpeg.deleteFile(inputName); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  if (onProgress) onProgress(100);
  return new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" });
}