import { Button } from "@/components/ui/button";
import { Upload, Scissors, Crop, Download, ShieldCheck, UserX, Share2 } from "lucide-react";

interface HowItWorksProps {
  onStart: () => void;
}

const steps = [
  {
    n: "01",
    icon: Upload,
    title: "Upload",
    text: "Drop in your video and preview it instantly. Your file stays on your device.",
    label: "Supports MP4, MOV, WebM",
    accent: "text-signal-blue",
    glow: "glow-blue",
    border: "hover:border-signal-blue",
  },
  {
    n: "02",
    icon: Scissors,
    title: "Trim",
    text: "Select the exact moment you want using the trim slider. Adjust start and end time in seconds.",
    label: "Perfect for short clips",
    accent: "text-signal-green",
    glow: "glow-green",
    border: "hover:border-signal-green",
  },
  {
    n: "03",
    icon: Crop,
    title: "Resize",
    text: "Choose TikTok/Reels (9:16), Instagram Post (1:1), or Feed (4:5). Drag and zoom to frame it perfectly.",
    label: "Includes blur background fill",
    accent: "text-foreground",
    glow: "",
    border: "hover:border-foreground",
  },
  {
    n: "04",
    icon: Download,
    title: "Export",
    text: "Export a clean MP4 ready to post. Download instantly when processing is complete.",
    label: "No watermark",
    accent: "text-signal-red",
    glow: "glow-red",
    border: "hover:border-signal-red",
  },
];

const trust = [
  { icon: ShieldCheck, title: "No Uploads", text: "Your video never leaves your device. Everything runs locally in your browser." },
  { icon: UserX, title: "No Account", text: "No login, no signup, no subscriptions required to start clipping." },
  { icon: Share2, title: "Social Ready", text: "Export formats optimized for TikTok, Instagram Reels, and feed posts." },
];

export function HowItWorks({ onStart }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="scroll-mt-20 max-w-7xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal-green glow-green">
          // Process
        </span>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold uppercase tracking-tight">
          How It Works
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Clip your video in 4 simple steps — no account, no uploads, no waiting.
        </p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ n, icon: Icon, title, text, label, accent, glow, border }) => (
          <li
            key={n}
            className={`group relative bg-surface border-2 border-border rounded-2xl p-6 shadow-lg shadow-black/30 transition-all ${border} hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between mb-6">
              <span className={`font-mono text-xs font-bold tracking-widest ${accent} ${glow}`}>
                STEP {n}
              </span>
              <Icon className={`size-5 ${accent}`} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-20">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold uppercase tracking-tight">Built for speed and privacy</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {trust.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="bg-surface/50 border border-border rounded-2xl p-6"
            >
              <Icon className="size-5 text-signal-green mb-3" />
              <h4 className="font-bold uppercase tracking-tight mb-2">{title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 rounded-2xl border-2 border-signal-green/40 bg-gradient-to-br from-signal-green/10 via-transparent to-signal-blue/10 p-8 sm:p-12 text-center shadow-glow-green">
        <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">
          Ready to clip your first video?
        </h3>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Upload a file and export a perfect social clip in under a minute.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button variant="signal" size="lg" onClick={onStart}>
            Start Clipping
          </Button>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Works best on Chrome, Safari, and Edge.
          </p>
        </div>
      </div>
    </section>
  );
}