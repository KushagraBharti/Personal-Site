import { createDecipheriv, createCipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

const parseKey = (raw: string): Buffer => {
  // Preferred: base64-encoded 32 bytes
  try {
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
  } catch {
    // ignore
  }

  // Hex-encoded 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  // Fallback: treat as UTF-8 (must still be 32 bytes)
  const utf8 = Buffer.from(raw, "utf8");
  return utf8;
};

let cachedKey: Buffer | null = null;

const getKey = (): Buffer => {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }

  const key = parseKey(raw);
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes (base64/hex/utf8). Got ${key.length} bytes after decoding.`
    );
  }

  cachedKey = key;
  return key;
};

export const encryptToBase64 = (plaintext: string): string => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  if (tag.length !== TAG_BYTES) {
    // Node should always produce 16 bytes for GCM tags, but keep the invariant explicit.
    throw new Error("Unexpected auth tag length");
  }

  return Buffer.concat([iv, ciphertext, tag]).toString("base64");
};

export const decryptFromBase64 = (payloadB64: string): string => {
  const buf = Buffer.from(payloadB64, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Invalid ciphertext payload");
  }

  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(buf.length - TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);

  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
};
