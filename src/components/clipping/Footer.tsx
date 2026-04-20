export function Footer() {
  return (
    <footer id="contact" className="border-t-2 border-border mt-12 py-12">
      <div className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-3 items-start">
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold uppercase tracking-tight mb-2">
            Fast clipping. No sign-up. No uploads.
          </h3>
          <p className="text-xs text-muted-foreground max-w-md">
            ClippingTools runs entirely in your browser. Videos are processed locally on your device.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-muted-foreground md:justify-end">
          <li><a href="#" className="hover:text-signal-green">Terms</a></li>
          <li><a href="#privacy" className="hover:text-signal-green">Privacy Policy</a></li>
          <li><a href="#contact" className="hover:text-signal-green">Contact</a></li>
          <li><a href="#faq" className="hover:text-signal-green">FAQ</a></li>
        </ul>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
        <span>© 2025 ClippingTools</span>
        <span>v1.0.0 · Local Engine</span>
      </div>
    </footer>
  );
}