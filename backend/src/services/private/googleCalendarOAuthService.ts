import axios from "axios";
import { createHmac, randomBytes } from "crypto";

const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} must be set`);
  return value;
};

const base64UrlEncode = (input: string | Buffer) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
};

const sign = (value: string) =>
  base64UrlEncode(createHmac("sha256", requiredEnv("GOOGLE_OAUTH_STATE_SECRET")).update(value).digest());

export const createGoogleOAuthState = (userId: string) => {
  const payload = {
    userId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const parseGoogleOAuthState = (state: string) => {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid OAuth state");
  }
  const expected = sign(encodedPayload);
  if (signature !== expected) {
    throw new Error("Invalid OAuth state signature");
  }

  const payloadText = base64UrlDecode(encodedPayload).toString("utf8");
  const payload = JSON.parse(payloadText) as {
    userId?: string;
    nonce?: string;
    exp?: number;
  };

  if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
    throw new Error("Expired or malformed OAuth state");
  }

  return payload.userId;
};

export const createGoogleOAuthUrl = (state: string) => {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const redirectUri = requiredEnv("GOOGLE_OAUTH_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  });

  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
};

export const exchangeGoogleOAuthCode = async (code: string) => {
  const payload = new URLSearchParams({
    code,
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: requiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
    grant_type: "authorization_code",
  });

  const response = await axios.post(GOOGLE_OAUTH_TOKEN_URL, payload.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = response.data as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
  };

  if (!data.access_token) {
    throw new Error("Google OAuth exchange returned no access token");
  }

  return data;
};
