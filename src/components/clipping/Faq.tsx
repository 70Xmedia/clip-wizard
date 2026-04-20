import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const items = [
  { q: "Do you upload my videos?", a: "No. Everything runs locally in your browser. Your video never leaves your device." },
  { q: "Does this work on mobile?", a: "Yes. ClippingTools is optimized for both desktop and mobile browsers." },
  { q: "Why does export take time?", a: "Export speed depends on your device and video size. Shorter clips export faster." },
  { q: "What format does it export?", a: "MP4, optimized for TikTok and Instagram." },
];

export function Faq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-8">FAQ</h2>
      <Accordion type="single" collapsible className="border border-border">
        {items.map((it) => (
          <AccordionItem key={it.q} value={it.q} className="border-border">
            <AccordionTrigger className="px-4 text-left hover:text-signal-green">{it.q}</AccordionTrigger>
            <AccordionContent className="px-4 text-muted-foreground">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}