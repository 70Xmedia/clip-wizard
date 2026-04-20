import { Button } from "@/components/ui/button";
import { ASPECT_PRESETS, type AspectRatio } from "@/lib/ffmpeg";
import { Download, Loader2 } from "lucide-react";

export type ExportState =
  | { status: "idle" }
  | { status: "exporting"; progress: number }
  | { status: "done"; url: string; filename: string }
  | { status: "error"; message: string };

interface ExportPanelProps {
  aspect: AspectRatio;
  duration: number;
  state: ExportState;
  onExport: () => void;
  onReset: () => void;
}

export function ExportPanel({ aspect, duration, state, onExport, onReset }: ExportPanelProps) {
  const preset = ASPECT_PRESETS[aspect];
  const exporting = state.status === "exporting";

  return (
    <section className="bg-surface border-2 border-border p-6 sm:p-8" aria-labelledby="step-4">
      <header className="flex items-center justify-between mb-6">
        <h3 id="step-4" className="text-lg font-bold uppercase tracking-tight">
          4. Export & Download
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          04 / Transmit
        </span>
      </header>

      <ul className="space-y-2 text-sm font-mono mb-6 border border-border bg-background p-4">
        <li className="flex justify-between"><span className="text-muted-foreground">Format:</span><span>{preset.label}</span></li>
        <li className="flex justify-between"><span className="text-muted-foreground">Resolution:</span><span>{preset.w} × {preset.h}</span></li>
        <li className="flex justify-between"><span className="text-muted-foreground">Estimated Duration:</span><span>{duration.toFixed(1)}s</span></li>
        <li className="flex justify-between"><span className="text-muted-foreground">Output:</span><span>MP4</span></li>
      </ul>

      {state.status === "idle" && (
        <>
          <Button variant="signal-red" size="lg" className="w-full" onClick={onExport}>
            Export MP4
          </Button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Export happens on your device. Your video is never uploaded.
          </p>
        </>
      )}

      {exporting && (
        <div className="space-y-3">
          <Button variant="signal-red" size="lg" className="w-full" disabled>
            <Loader2 className="mr-2 size-4 animate-spin" /> Exporting…
          </Button>
          <div className="h-2 bg-secondary overflow-hidden">
            <div
              className="h-full bg-signal-red transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted-foreground">Processing video… please keep this tab open.</span>
            <span className="text-signal-red">{state.progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Large files may take a minute depending on your device.
          </p>
        </div>
      )}

      {state.status === "done" && (
        <div className="space-y-3">
          <p className="font-bold text-signal-green glow-green">Export complete. Your clip is ready.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="signal" size="lg" className="flex-1" asChild>
              <a href={state.url} download={state.filename}>
                <Download className="mr-2 size-4" /> Download MP4
              </a>
            </Button>
            <Button variant="outline" size="lg" onClick={onReset}>
              Export Another Clip
            </Button>
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-3">
          <p className="font-bold text-signal-red glow-red">Export failed</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Button variant="signal-red" size="lg" className="w-full" onClick={onExport}>
            Try Again
          </Button>
        </div>
      )}
    </section>
  );
}