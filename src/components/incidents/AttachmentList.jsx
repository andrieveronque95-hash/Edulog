import React from "react";
import { Download, Eye, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadFile, formatFileSize, previewFile } from "@/lib/files";

export default function AttachmentList({ attachments = [], onRemove }) {
  if (!attachments.length) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center text-xs text-muted-foreground">
        No supporting documents attached to this case.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
      {attachments.map((file) => (
        <li key={file.id || file.file_uri} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{file.file_name}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatFileSize(file.file_size)}
              {file.uploaded_by_name ? ` · ${file.uploaded_by_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => previewFile(file.file_uri)}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => downloadFile(file.file_uri, file.file_name)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(file)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}