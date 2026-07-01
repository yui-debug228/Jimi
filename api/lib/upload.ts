import path from "path";
import fs from "fs";
import type { Context } from "hono";

const UPLOAD_DIR = path.resolve(import.meta.dirname, "../../public/uploads");

// Allowed image MIME types and magic bytes (file signatures)
const ALLOWED_TYPES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
  "image/gif": [0x47, 0x49, 0x46, 0x38], // GIF8
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signature = ALLOWED_TYPES[mimeType];
  if (!signature) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
  const random = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  return `upload_${random}${safeExt}`;
}

export async function handleFileUpload(c: Context) {
  ensureUploadDir();

  const body = await c.req.parseBody({ all: false });
  const file = body.file;

  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided", url: null, filename: null };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File too large (max 10MB)", url: null, filename: null };
  }

  // Check MIME type
  if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
    return { success: false, error: "Unsupported file type. Only JPEG, PNG, WebP, GIF allowed", url: null, filename: null };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate file content (magic bytes)
  if (!validateMagicBytes(buffer, file.type)) {
    return { success: false, error: "File content does not match declared type", url: null, filename: null };
  }

  // Save with safe random filename
  const filename = generateSafeFilename(file.name);
  const filepath = path.join(UPLOAD_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  return { success: true, error: null, url: `/uploads/${filename}`, filename };
}
