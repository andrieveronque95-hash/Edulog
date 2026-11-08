import { base44 } from "@/api/base44Client";

export const MAX_FILE_MB = 5;
export const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx";
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg", "xls", "xlsx"];

export function validateFile(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return `${file.name}: unsupported format. Use PDF, Word, Excel, PNG or JPG.`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `${file.name}: file is larger than ${MAX_FILE_MB}MB.`;
  }
  return null;
}

export function dataUrlToFile(dataUrl, filename) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export async function uploadPrivate(file) {
  return base44.integrations.Core.UploadPrivateFile({ file });
}

export async function getSignedUrl(fileUri) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
    file_uri: fileUri,
    expires_in: 600,
  });
  return signed_url;
}

export async function previewFile(fileUri) {
  const url = await getSignedUrl(fileUri);
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function downloadFile(fileUri, fileName) {
  const url = await getSignedUrl(fileUri);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "document";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function uploadSignatureImage(dataUrl, role) {
  const file = dataUrlToFile(dataUrl, `signature-${role}-${Date.now()}.png`);
  const { file_uri } = await uploadPrivate(file);
  return file_uri;
}

export const formatFileSize = (bytes = 0) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};