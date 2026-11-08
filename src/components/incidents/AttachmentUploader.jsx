import React, { useRef, useState } from "react";
import { FileUp, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_FILE_TYPES, MAX_FILE_MB, formatFileSize, uploadPrivate, validateFile } from "@/lib/files";

export default function AttachmentUploader({ files, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (event) => {
    const selected = Array.from(event.target.files || []);
    setError("");
    const accepted = [];
    for (const file of selected) {
      const problem = validateFile(file);
      if (problem) setError(problem);
      else accepted.push(file);
    }
    if (!accepted.length) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const uploaded = [];
      for (const file of accepted) {
        const { file_uri } = await uploadPrivate(file);
        uploaded.push({
          file_name: file.name,
          file_uri,
          file_type: file.type || file.name.split(".").pop(),
          file_size: file.size,
        });
      }
      onChange([...files, ...uploaded]);
    } catch (uploadError) {
      setError("The upload did not complete. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleSelect}
          className="hidden"
          id="incident-attachments"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {busy ? "Uploading…" : "Attach demerit form or document"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          PDF, Word, Excel, PNG or JPG · up to {MAX_FILE_MB}MB each. Files are stored privately.
        </span>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

      {files.length > 0 && (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card">
          {files.map((file) => (
            <li key={file.file_uri} className="flex items-center gap-3 px-3 py-2.5">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{file.file_name}</p>
                <p className="text-[11px] text-muted-foreground">{formatFileSize(file.file_size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(files.filter((item) => item.file_uri !== file.file_uri))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}