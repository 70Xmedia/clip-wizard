import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ASPECT_PRESETS, type AspectRatio } from "@/lib/ffmpeg";

interface FormatPanelProps {
  aspect: AspectRatio;
  onAspect: (a: AspectRatio) => void;
  blurBackground: boolean;
  onBlur: (b: boolean) => void;
  zoom: number;
  onZoom: (z: number) => void;
  onCenter: () => void;
  onReset: () => void;
}

const ORDER: AspectRatio[] = ["9:16", "1:1", "4:5"];

export function FormatPanel({
  aspect, onAspect, blurBackground, onBlur, zoom, onZoom, onCenter, onReset,
}: FormatPanelProps) {
  return (
    <section className="bg-surface border-2 border-border p-6 sm:p-8" aria-labelledby="step-2">
      <header className="flex items-center justify-between mb-6">
        <h3 id="step-2" className="text-lg font-bold uppercase tracking-tight">
          2. Choose Platform Format
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          02 / Encode
        </span>
      </header>

      <div className="space-y-2">
        {ORDER.map((a) => {
          const p = ASPECT_PRESETS[a];
          const active = aspect === a;
          return (
            <button
              key={a}
              onClick={() => onAspect(a)}
              className={`w-full text-left border-2 px-4 py-3 transition-colors ${
                active
                  ? "border-signal-green bg-signal-green/10"
                  : "border-border bg-background hover:border-signal-green/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.sublabel}</div>
                </div>
                <div className={`font-mono text-xs ${active ? "text-signal-green" : "text-muted-foreground"}`}>
                  {p.w}×{p.h}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Frame Settings
        </h4>

        <div className="flex items-center justify-between mb-2">
          <div>
            <label htmlFor="blur" className="font-medium">Blur Background Fill</label>
            <p className="text-xs text-muted-foreground">
              Fills empty space using a blurred version of your video.
            </p>
          </div>
          <Switch id="blur" checked={blurBackground} onCheckedChange={onBlur} />
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Zoom</span>
            <span className="font-mono text-signal-green">{Math.round(zoom * 100)}%</span>
          </div>
          <Slider
            min={100}
            max={300}
            step={1}
            value={[Math.round(zoom * 100)]}
            onValueChange={([v]) => onZoom(v / 100)}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use zoom to crop tighter or show more of the frame.
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" size="sm" onClick={onCenter}>Center Video</Button>
          <Button variant="ghost" size="sm" onClick={onReset}>Reset Frame</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Drag the video inside the frame to reposition it.
        </p>
      </div>
    </section>
  );
}