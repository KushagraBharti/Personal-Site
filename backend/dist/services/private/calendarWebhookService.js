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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGoogleWebhook = void 0;
const crypto_1 = require("crypto");
const calendarSyncQueueService_1 = require("./calendarSyncQueueService");
const normalizeHeader = (value) => {
    var _a;
    if (!value)
        return null;
    if (Array.isArray(value))
        return (_a = value[0]) !== null && _a !== void 0 ? _a : null;
    return value;
};
const hashToken = (token) => (0, crypto_1.createHash)("sha256").update(token).digest("hex");
const handleGoogleWebhook = (supabaseAdmin, headers) => __awaiter(void 0, void 0, void 0, function* () {
    const channelId = normalizeHeader(headers["x-goog-channel-id"]);
    const resourceId = normalizeHeader(headers["x-goog-resource-id"]);
    const channelToken = normalizeHeader(headers["x-goog-channel-token"]);
    const resourceState = normalizeHeader(headers["x-goog-resource-state"]);
    const messageNumber = normalizeHeader(headers["x-goog-message-number"]);
    if (!channelId || !resourceId || !channelToken) {
        throw new Error("Missing required Google webhook headers");
    }
    const { data: secretRow, error } = yield supabaseAdmin
        .from("tracker_google_calendar_connections_secrets")
        .select("user_id, channel_token_hash, channel_id, channel_resource_id")
        .eq("channel_id", channelId)
        .eq("channel_resource_id", resourceId)
        .maybeSingle();
    if (error || !secretRow) {
        throw new Error("Webhook channel not recognized");
    }
    const expected = secretRow.channel_token_hash;
    if (!expected || expected !== hashToken(channelToken)) {
        throw new Error("Invalid webhook channel token");
    }
    // Initial sync notification does not imply actual changes; still queue delta to be safe.
    yield (0, calendarSyncQueueService_1.enqueueSyncJob)(supabaseAdmin, {
        userId: secretRow.user_id,
        jobType: "inbound_delta",
        priority: resourceState === "sync" ? 70 : 80,
        payload: {
            source: "google_webhook",
            resource_state: resourceState || "exists",
            channel_id: channelId,
            resource_id: resourceId,
            message_number: messageNumber || null,
            chain_id: messageNumber
                ? `webhook_${channelId}_${messageNumber}`
                : `webhook_${channelId}_${Date.now()}`,
        },
        dedupeKey: messageNumber
            ? `webhook:${secretRow.user_id}:${channelId}:${messageNumber}`
            : `webhook:${secretRow.user_id}:${channelId}:${resourceId}:${Date.now()}`,
    });
    return {
        userId: secretRow.user_id,
        resourceState: resourceState || "exists",
    };
});
exports.handleGoogleWebhook = handleGoogleWebhook;
