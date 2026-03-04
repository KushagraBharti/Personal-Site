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
exports.computeRetryDelayInterval = exports.failSyncJob = exports.completeSyncJob = exports.claimSyncJobs = exports.enqueueSyncJob = exports.getSupabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const parseJwtRole = (jwt) => {
    const parts = jwt.split(".");
    if (parts.length < 2)
        return null;
    try {
        const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
        const payloadJson = Buffer.from(padded, "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);
        return typeof payload.role === "string" ? payload.role : null;
    }
    catch (_a) {
        return null;
    }
};
const getSupabaseAdmin = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set");
    }
    // Supabase supports both newer sb_secret_* keys and legacy JWT service_role keys.
    // Reject clearly invalid frontend keys and JWT anon keys to avoid silent RLS failures.
    const looksLikePublishable = key.startsWith("sb_publishable_");
    if (looksLikePublishable) {
        throw new Error("Supabase server key is misconfigured. Use SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), not a publishable/anon key.");
    }
    if (key.startsWith("eyJ")) {
        const role = parseJwtRole(key);
        if (role && role !== "service_role") {
            throw new Error(`Supabase JWT key role is '${role}', expected 'service_role'. Set SUPABASE_SERVICE_ROLE_KEY to the service role key.`);
        }
    }
    return (0, supabase_js_1.createClient)(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
};
exports.getSupabaseAdmin = getSupabaseAdmin;
const enqueueSyncJob = (supabaseAdmin, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const payload = Object.assign({}, (input.payload || {}));
    if (input.dedupeKey) {
        payload.dedupe_key = input.dedupeKey;
    }
    const { error } = yield supabaseAdmin.from("tracker_google_sync_jobs").insert({
        user_id: input.userId,
        task_id: (_a = input.taskId) !== null && _a !== void 0 ? _a : null,
        list_id: (_b = input.listId) !== null && _b !== void 0 ? _b : null,
        job_type: input.jobType,
        priority: (_c = input.priority) !== null && _c !== void 0 ? _c : 100,
        payload,
        status: "pending",
    });
    // Deduped inserts will violate unique index by design; ignore.
    if (error && error.code !== "23505") {
        throw new Error(error.message);
    }
});
exports.enqueueSyncJob = enqueueSyncJob;
const claimSyncJobs = (supabaseAdmin_1, ...args_1) => __awaiter(void 0, [supabaseAdmin_1, ...args_1], void 0, function* (supabaseAdmin, batchSize = 25, userId) {
    const { data, error } = yield supabaseAdmin.rpc("claim_sync_jobs", {
        batch_size: batchSize,
        p_user_id: userId !== null && userId !== void 0 ? userId : null,
    });
    if (error)
        throw new Error(error.message);
    return (data !== null && data !== void 0 ? data : []);
});
exports.claimSyncJobs = claimSyncJobs;
const completeSyncJob = (supabaseAdmin, jobId) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabaseAdmin.rpc("complete_sync_job", { job_id: jobId });
    if (error)
        throw new Error(error.message);
});
exports.completeSyncJob = completeSyncJob;
const failSyncJob = (supabaseAdmin, jobId, err, retryDelay) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = yield supabaseAdmin.rpc("fail_sync_job", {
        job_id: jobId,
        err,
        retry_delay: retryDelay,
    });
    if (error)
        throw new Error(error.message);
});
exports.failSyncJob = failSyncJob;
const computeRetryDelayInterval = (attemptCount) => {
    const seconds = Math.min(Math.pow(2, Math.max(attemptCount, 0)) * 15, 6 * 60 * 60);
    return `${Math.round(seconds)} seconds`;
};
exports.computeRetryDelayInterval = computeRetryDelayInterval;
