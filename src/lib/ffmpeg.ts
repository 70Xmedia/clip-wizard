import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    // Surface engine logs to the browser console so we can diagnose hangs.
    ffmpeg.on("log", ({ message }) => {
      // eslint-disable-next-line no-console
      console.log("[ffmpeg]", message);
    });
    // Single-threaded core (no SharedArrayBuffer / COOP-COEP required).
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
    } catch (e) {
      console.error("[ffmpeg] Failed to load core from unpkg, retrying via jsdelivr", e);
      const fallback = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${fallback}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${fallback}/ffmpeg-core.wasm`, "application/wasm"),
      });
    }
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
  "9:16": { label: "TikTok / Reels (9:16)", sublabel: "Best for vertical video", w: 720, h: 1280 },
  "1:1": { label: "Instagram Post (1:1)", sublabel: "Square feed post", w: 720, h: 720 },
  "4:5": { label: "Instagram Feed (4:5)", sublabel: "Most common IG format", w: 720, h: 900 },
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
  textOverlay?: TextOverlay | null;
  onProgress?: (pct: number) => void;
}

export interface TextOverlay {
  text: string;
  /** position relative to crop frame, normalized 0..1 (center of text) */
  posX: number;
  posY: number;
  /** font size in px relative to a 1080-tall reference frame */
  size: number;
  color: string; // hex like #ffffff
  bold: boolean;
  highlight: boolean;
}

// drawtext requires TTF/OTF. Fontsource ships static TTFs that work in ffmpeg.wasm.
const FONT_TTF_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.ttf";

let fontsLoaded = false;
async function ensureFonts(ffmpeg: FFmpeg) {
  if (fontsLoaded) return;
  try {
    const res = await fetch(FONT_TTF_URL);
    if (!res.ok) throw new Error(`Font fetch failed: HTTP ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    await ffmpeg.writeFile("font.ttf", buf);
    fontsLoaded = true;
  } catch (e) {
    console.warn("[ffmpeg] Could not load font, text overlay will be skipped:", e);
    throw e;
  }
}

function escapeDrawtext(s: string): string {
  // Escape characters special to drawtext: \ : ' %
  return s
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/,/g, "\\,");
}

function getReducedPreset(aspect: AspectRatio) {
  switch (aspect) {
    case "9:16":
      return { w: 540, h: 960 };
    case "1:1":
      return { w: 540, h: 540 };
    case "4:5":
      return { w: 540, h: 675 };
  }
}

function buildDrawtextFilter(textOverlay: TextOverlay, H: number) {
  const t = escapeDrawtext(textOverlay.text);
  const fontPx = Math.max(12, Math.round(textOverlay.size * (H / 600)));
  const x = `(w-text_w)/2 + (${textOverlay.posX} - 0.5)*w`;
  const y = `(h-text_h)/2 + (${textOverlay.posY} - 0.5)*h`;
  const box = textOverlay.highlight ? `:box=1:boxcolor=black@0.55:boxborderw=${Math.round(fontPx * 0.3)}` : "";
  const bold = textOverlay.bold && !textOverlay.highlight ? `:borderw=${Math.max(2, Math.round(fontPx * 0.06))}:bordercolor=black@0.7` : "";
  return `drawtext=fontfile=font.ttf:text='${t}':fontcolor=${textOverlay.color}:fontsize=${fontPx}:x=${x}:y=${y}${box}${bold}`;
}

function buildForegroundChain(W: number, H: number, zoom: number, offsetX: number, offsetY: number) {
  const z = Math.max(1, zoom);
  const fgScale = `scale=w=${W}*${z}:h=${H}*${z}:force_original_aspect_ratio=increase`;
  const cropX = `(in_w-${W})/2 + ${offsetX}*(in_w-${W})/2`;
  const cropY = `(in_h-${H})/2 + ${offsetY}*(in_h-${H})/2`;
  const fgCrop = `crop=${W}:${H}:${cropX}:${cropY}`;
  return { fgScale, fgCrop };
}

export async function exportClip(opts: ExportOptions): Promise<Blob> {
  const { file, start, end, aspect, zoom, offsetX, offsetY, blurBackground, textOverlay, onProgress } = opts;
  console.log("[export] starting", { name: file.name, size: file.size, start, end, aspect, zoom, blurBackground });
  if (onProgress) onProgress(1);
  const ffmpeg = await getFFmpeg();
  console.log("[export] ffmpeg ready");
  if (onProgress) onProgress(3);
  const preset = ASPECT_PRESETS[aspect];
  const duration = Math.max(0.1, end - start);
  const recentLogs: string[] = [];

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
    recentLogs.push(message);
    if (recentLogs.length > 80) recentLogs.shift();
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
  if (onProgress) onProgress(5);

  const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const inputName = "input." + (ext || "mp4");
  console.log("[export] writing input file to FS:", inputName);
  const buf = new Uint8Array(await file.arrayBuffer());
  await ffmpeg.writeFile(inputName, buf);
  console.log("[export] input written, bytes:", buf.byteLength);
  if (onProgress) onProgress(8);

  let canUseText = Boolean(textOverlay && textOverlay.text.trim());
  if (canUseText) {
    try {
      await ensureFonts(ffmpeg);
    } catch {
      canUseText = false;
    }
  }

  const outputName = "output.mp4";
  const reduced = getReducedPreset(aspect);
  const strategies = [
    { label: "simple-copy-audio", w: preset.w, h: preset.h, blur: false, text: false, useCopyAudio: true, useNativeMpeg4: false },
    { label: "simple-aac", w: preset.w, h: preset.h, blur: false, text: false, useCopyAudio: false, useNativeMpeg4: false },
    { label: "simple-mpeg4-copy-audio", w: preset.w, h: preset.h, blur: false, text: false, useCopyAudio: true, useNativeMpeg4: true },
    { label: "simple-mpeg4-aac", w: preset.w, h: preset.h, blur: false, text: false, useCopyAudio: false, useNativeMpeg4: true },
    { label: "reduced-text", w: reduced.w, h: reduced.h, blur: false, text: canUseText, useCopyAudio: true, useNativeMpeg4: false },
    { label: "reduced-blur", w: reduced.w, h: reduced.h, blur: blurBackground, text: false, useCopyAudio: true, useNativeMpeg4: false },
    { label: "reduced-blur-mpeg4", w: reduced.w, h: reduced.h, blur: blurBackground, text: false, useCopyAudio: true, useNativeMpeg4: true },
    { label: "reduced-last-resort", w: reduced.w, h: reduced.h, blur: false, text: false, useCopyAudio: false, useNativeMpeg4: true },
  ];

  try {
    for (let i = 0; i < strategies.length; i += 1) {
      const strategy = strategies[i];
      const { fgScale, fgCrop } = buildForegroundChain(strategy.w, strategy.h, zoom, offsetX, offsetY);
      const drawtext = strategy.text && textOverlay ? `,${buildDrawtextFilter(textOverlay, strategy.h)}` : "";

      let args: string[];
      if (strategy.blur) {
        const filter =
          `[0:v]split=2[bg][fg];` +
          `[bg]scale=w=${strategy.w}:h=${strategy.h}:force_original_aspect_ratio=increase,crop=${strategy.w}:${strategy.h},boxblur=luma_radius=18:luma_power=1[bgb];` +
          `[fg]${fgScale},${fgCrop}[fgc];` +
          `[bgb][fgc]overlay=(W-w)/2:(H-h)/2${drawtext}[outv]`;

        args = [
          "-ss", String(start),
          "-i", inputName,
          "-t", String(duration),
          "-filter_complex", filter,
          "-map", "[outv]",
          "-map", "0:a?",
          "-c:v", strategy.useNativeMpeg4 ? "mpeg4" : "libx264",
          "-preset", "ultrafast",
          ...(strategy.useNativeMpeg4 ? ["-q:v", strategy.w < preset.w ? "10" : "8"] : ["-crf", strategy.w < preset.w ? "31" : "29"]),
          "-pix_fmt", "yuv420p",
          ...(strategy.useCopyAudio ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "96k"]),
          "-movflags", "+faststart",
          outputName,
        ];
      } else {
        const vf = `${fgScale},${fgCrop}${drawtext}`;
        args = [
          "-ss", String(start),
          "-i", inputName,
          "-t", String(duration),
          "-vf", vf,
          "-map", "0:v:0",
          "-map", "0:a?",
          "-c:v", strategy.useNativeMpeg4 ? "mpeg4" : "libx264",
          "-preset", "ultrafast",
          ...(strategy.useNativeMpeg4 ? ["-q:v", strategy.w < preset.w ? "10" : "8"] : ["-crf", strategy.w < preset.w ? "31" : "29"]),
          "-pix_fmt", "yuv420p",
          ...(strategy.useCopyAudio ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "96k"]),
          "-movflags", "+faststart",
          outputName,
        ];
      }

      try {
        if (onProgress) onProgress(Math.max(lastPct, 10 + i * 5));
        console.log("[export] attempting strategy", strategy, args.join(" "));
        try { await ffmpeg.deleteFile(outputName); } catch {}
        const code = await ffmpeg.exec(args);
        if (code !== 0) throw new Error(`FFmpeg exited with code ${code}`);
        const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
        console.log("[export] strategy succeeded", strategy.label, data.byteLength);
        if (onProgress) onProgress(100);
        return new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" });
      } catch (error) {
        console.error("[export] strategy failed", strategy.label, error, recentLogs.slice(-12));
      }
    }

    throw new Error(`All export strategies failed. Recent ffmpeg logs: ${recentLogs.slice(-8).join(" | ")}`);
  } finally {
    ffmpeg.off("progress", progressHandler);
    ffmpeg.off("log", logHandler);
    try { await ffmpeg.deleteFile(inputName); } catch {}
    try { await ffmpeg.deleteFile(outputName); } catch {}
  }
}