import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileVideo } from "lucide-react";

interface UploadPanelProps {
  file: File | null;
  onFile: (file: File | null) => void;
}

export function UploadPanel({ file, onFile }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("video/")) return;
    onFile(f);
  }, [onFile]);

  return (
    <section
      id="editor"
      className="bg-surface border-2 border-border p-6 sm:p-8"
      aria-labelledby="step-1"
    >
      <header className="flex items-center justify-between mb-6">
        <h3 id="step-1" className="text-lg font-bold uppercase tracking-tight">
          1. Upload Video
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          01 / Source
        </span>
      </header>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed transition-colors rounded-sm flex flex-col items-center justify-center text-center min-h-[260px] px-6 ${
            drag ? "border-signal-blue bg-signal-blue/5" : "border-border hover:border-signal-blue/60 hover:bg-signal-blue/5"
          }`}
        >
          <div className="size-14 rounded-full bg-signal-blue/10 flex items-center justify-center mb-4">
            <Upload className="size-6 text-signal-blue" />
          </div>
          <p className="text-base font-semibold">Drag & drop a video here</p>
          <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Supports MP4, MOV, WebM
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="border border-border bg-background p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="size-10 rounded-sm bg-signal-green/10 flex items-center justify-center shrink-0">
              <FileVideo className="size-5 text-signal-green" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Loaded Video
              </p>
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Replace Video
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onFile(null)}>
              Remove
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>
      )}
    </section>
  );
}