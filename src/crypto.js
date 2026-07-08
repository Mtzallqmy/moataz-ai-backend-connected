import crypto from "crypto";
import { config } from "./config.js";

const key = crypto.createHash("sha256").update(config.encryptionKey).digest();

export function encryptSecret(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value) {
  if (!value) return null;
  const [ivB64, tagB64, encryptedB64] = String(value).split(":");
  if (!ivB64 || !tagB64 || !encryptedB64) return null;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hashKey(key) {
  return crypto.createHash("sha256").update(String(key)).digest("hex");
}

export function createPublicApiKey() {
  return `mk_${crypto.randomBytes(32).toString("hex")}`;
}

export function maskKey(key) {
  if (!key) return "";
  return `${String(key).slice(0, 6)}••••••••${String(key).slice(-4)}`;
}
