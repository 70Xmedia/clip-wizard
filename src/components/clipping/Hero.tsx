import { Button } from "@/components/ui/button";
import { Scissors, Crop, Layers, ShieldCheck } from "lucide-react";

interface HeroProps {
  onStart: () => void;
}

const features = [
  { icon: Scissors, label: "Trim & export instantly" },
  { icon: Crop, label: "Resize to 9:16, 1:1, 4:5" },
  { icon: Layers, label: "Blur background fill included" },
  { icon: ShieldCheck, label: "No sign-up required" },
];

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] uppercase mb-6">
            Clip videos for{" "}
            <span className="text-signal-green glow-green">TikTok</span> &{" "}
            <span className="text-signal-blue glow-blue">Instagram</span> in seconds.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-[55ch] leading-relaxed mb-3">
            Trim, resize, and export social-ready clips directly in your browser. No account. No uploads.
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-signal-green/80 mb-8">
            Everything runs locally on your device for speed and privacy.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="signal" onClick={onStart}>
              Start Clipping
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-end">
          <div className="border-t-2 border-signal-red/30 pt-4 font-mono text-xs">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground uppercase">System Status</span>
              <span className="text-signal-red font-bold uppercase glow-red">● Live</span>
            </div>
            <div className="w-full h-1 bg-secondary overflow-hidden">
              <div className="h-full bg-signal-red w-2/3" />
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 border border-border bg-surface px-4 py-3"
          >
            <Icon className="size-4 text-signal-green shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}