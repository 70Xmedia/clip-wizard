import { Button } from "@/components/ui/button";

interface TopBarProps {
  onStart: () => void;
}

export function TopBar({ onStart }: TopBarProps) {
  return (
    <nav className="sticky top-0 z-40 border-b-2 border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-7 bg-signal-red rounded-sm animate-pulse" aria-hidden />
          <span className="text-xl font-bold tracking-tighter uppercase font-mono">
            Clipping<span className="text-signal-green">Tools</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
        </div>
        <Button variant="signal" size="sm" onClick={onStart}>
          Start Clipping
        </Button>
      </div>
    </nav>
  );
}