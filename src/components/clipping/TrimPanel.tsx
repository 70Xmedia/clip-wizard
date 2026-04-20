import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/ffmpeg";

interface TrimPanelProps {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

export function TrimPanel({ duration, start, end, onChange }: TrimPanelProps) {
  const clipDuration = Math.max(0, end - start);
  const tooLong = clipDuration > 60;

  const adjust = (which: "start" | "end", delta: number) => {
    let s = start, e = end;
    if (which === "start") s = Math.max(0, Math.min(end - 0.1, s + delta));
    else e = Math.max(start + 0.1, Math.min(duration, e + delta));
    onChange(s, e);
  };

  return (
    <section className="bg-surface border-2 border-border p-6 sm:p-8" aria-labelledby="step-3">
      <header className="flex items-center justify-between mb-6">
        <h3 id="step-3" className="text-lg font-bold uppercase tracking-tight">3. Trim Clip</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          03 / Segment
        </span>
      </header>

      <p className="text-sm text-muted-foreground mb-4">Select your clip start and end time</p>

      <div className="flex justify-between font-mono text-sm mb-3">
        <span>
          <span className="text-muted-foreground">Start:</span>{" "}
          <span className="text-signal-green">{formatTime(start)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">End:</span>{" "}
          <span className="text-signal-green">{formatTime(end)}</span>
        </span>
      </div>

      <Slider
        min={0}
        max={Math.max(duration, 0.1)}
        step={0.1}
        value={[start, end]}
        onValueChange={(v) => {
          if (v.length === 2) onChange(v[0], v[1]);
        }}
        className="my-4"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        <Button variant="outline" size="sm" onClick={() => adjust("start", -1)}>-1s Start</Button>
        <Button variant="outline" size="sm" onClick={() => adjust("start", 1)}>+1s Start</Button>
        <Button variant="outline" size="sm" onClick={() => adjust("end", -1)}>-1s End</Button>
        <Button variant="outline" size="sm" onClick={() => adjust("end", 1)}>+1s End</Button>
      </div>

      <p className="mt-4 text-sm">
        <span className="text-muted-foreground">Clip Duration:</span>{" "}
        <span className="font-mono text-signal-green">{clipDuration.toFixed(1)} seconds</span>
      </p>
      {tooLong && (
        <p className="mt-2 text-xs text-signal-red">Tip: Shorter clips export faster.</p>
      )}
    </section>
  );
}