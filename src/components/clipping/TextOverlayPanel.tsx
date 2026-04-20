import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { TextOverlay } from "@/lib/ffmpeg";
import { Type } from "lucide-react";

interface TextOverlayPanelProps {
  overlay: TextOverlay | null;
  onChange: (o: TextOverlay | null) => void;
}

const DEFAULT_OVERLAY: TextOverlay = {
  text: "",
  posX: 0.5,
  posY: 0.85,
  size: 48,
  color: "#ffffff",
  bold: true,
  highlight: false,
};

export function TextOverlayPanel({ overlay, onChange }: TextOverlayPanelProps) {
  const update = (patch: Partial<TextOverlay>) => {
    onChange({ ...(overlay ?? DEFAULT_OVERLAY), ...patch });
  };

  return (
    <section className="bg-surface border-2 border-border p-6 sm:p-8" aria-labelledby="step-optional">
      <header className="flex items-center justify-between mb-6">
        <h3 id="step-optional" className="text-lg font-bold uppercase tracking-tight">
          Optional: Add Text
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Overlay
        </span>
      </header>

      {!overlay ? (
        <Button variant="outline" onClick={() => onChange(DEFAULT_OVERLAY)}>
          <Type className="size-4" /> + Add Text
        </Button>
      ) : (
        <div className="space-y-5">
          <input
            type="text"
            value={overlay.text}
            placeholder="Type your text here…"
            onChange={(e) => update({ text: e.target.value })}
            className="w-full bg-background border border-border px-3 py-2 text-base focus:outline-none focus:border-signal-green"
          />

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Size</span>
              <span className="font-mono text-signal-green">{overlay.size}px</span>
            </div>
            <Slider
              min={16}
              max={120}
              step={1}
              value={[overlay.size]}
              onValueChange={([v]) => update({ size: v })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <span>Color</span>
              <input
                type="color"
                value={overlay.color}
                onChange={(e) => update({ color: e.target.value })}
                className="size-9 bg-transparent border border-border cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={overlay.bold}
                onCheckedChange={(v) => update({ bold: !!v })}
              />
              <span>Bold</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={overlay.highlight}
                onCheckedChange={(v) => update({ highlight: !!v })}
              />
              <span>Background Highlight</span>
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Drag text in the preview to position it.
          </p>

          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove Text
          </Button>
        </div>
      )}
    </section>
  );
}