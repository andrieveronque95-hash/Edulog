import React, { useEffect, useState } from "react";
import { getSignedUrl } from "@/lib/files";

export default function SignatureImage({ fileUri, className = "h-12" }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!fileUri) {
      setUrl(null);
      return undefined;
    }
    getSignedUrl(fileUri).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => {
      cancelled = true;
    };
  }, [fileUri]);

  if (!fileUri) return null;
  if (!url) return <div className={`${className} w-full animate-pulse rounded bg-secondary`} />;

  return <img src={url} alt="Signature" className={`${className} w-auto max-w-full object-contain`} />;
}