"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeGoogleOAuthCode = exports.createGoogleOAuthUrl = exports.parseGoogleOAuthState = exports.createGoogleOAuthState = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const requiredEnv = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`${key} must be set`);
    return value;
};
const base64UrlEncode = (input) => Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
const base64UrlDecode = (input) => {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    return Buffer.from(padded, "base64");
};
const sign = (value) => base64UrlEncode((0, crypto_1.createHmac)("sha256", requiredEnv("GOOGLE_OAUTH_STATE_SECRET")).update(value).digest());
const createGoogleOAuthState = (userId) => {
    const payload = {
        userId,
        nonce: (0, crypto_1.randomBytes)(16).toString("hex"),
        exp: Date.now() + 10 * 60 * 1000,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
};
exports.createGoogleOAuthState = createGoogleOAuthState;
const parseGoogleOAuthState = (state) => {
    const [encodedPayload, signature] = state.split(".");
    if (!encodedPayload || !signature) {
        throw new Error("Invalid OAuth state");
    }
    const expected = sign(encodedPayload);
    if (signature !== expected) {
        throw new Error("Invalid OAuth state signature");
    }
    const payloadText = base64UrlDecode(encodedPayload).toString("utf8");
    const payload = JSON.parse(payloadText);
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
        throw new Error("Expired or malformed OAuth state");
    }
    return payload.userId;
};
exports.parseGoogleOAuthState = parseGoogleOAuthState;
const createGoogleOAuthUrl = (state) => {
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
exports.createGoogleOAuthUrl = createGoogleOAuthUrl;
const exchangeGoogleOAuthCode = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = new URLSearchParams({
        code,
        client_id: requiredEnv("GOOGLE_CLIENT_ID"),
        client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
        redirect_uri: requiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
        grant_type: "authorization_code",
    });
    const response = yield axios_1.default.post(GOOGLE_OAUTH_TOKEN_URL, payload.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = response.data;
    if (!data.access_token) {
        throw new Error("Google OAuth exchange returned no access token");
    }
    return data;
});
exports.exchangeGoogleOAuthCode = exchangeGoogleOAuthCode;
