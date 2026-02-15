import { createHash } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { enqueueSyncJob } from "./calendarSyncQueueService";

const normalizeHeader = (value: string | string[] | undefined) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const handleGoogleWebhook = async (
  supabaseAdmin: SupabaseClient,
  headers: Record<string, string | string[] | undefined>
) => {
  const channelId = normalizeHeader(headers["x-goog-channel-id"]);
  const resourceId = normalizeHeader(headers["x-goog-resource-id"]);
  const channelToken = normalizeHeader(headers["x-goog-channel-token"]);
  const resourceState = normalizeHeader(headers["x-goog-resource-state"]);

  if (!channelId || !resourceId || !channelToken) {
    throw new Error("Missing required Google webhook headers");
  }

  const { data: secretRow, error } = await supabaseAdmin
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
  await enqueueSyncJob(supabaseAdmin, {
    userId: secretRow.user_id,
    jobType: "inbound_delta",
    priority: resourceState === "sync" ? 70 : 80,
    payload: {
      source: "google_webhook",
      resource_state: resourceState || "exists",
      channel_id: channelId,
      resource_id: resourceId,
    },
    dedupeKey: `inbound:${secretRow.user_id}:${resourceId}:${new Date().toISOString().slice(0, 16)}`,
  });
};

