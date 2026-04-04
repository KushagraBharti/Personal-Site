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
const getSupabaseErrorMessage = (error) => typeof (error === null || error === void 0 ? void 0 : error.message) === "string" ? error.message : "";
const isLegacyQueueSchemaError = (error) => {
    const message = getSupabaseErrorMessage(error).toLowerCase();
    const code = (error === null || error === void 0 ? void 0 : error.code) || "";
    if (code === "42703" || code === "42883" || code === "42P01")
        return true;
    return (message.includes("column") ||
        message.includes("run_id") ||
        message.includes("lane") ||
        message.includes("dedupe_key") ||
        message.includes("google_event_id") ||
        message.includes("source") ||
        message.includes("p_lanes") ||
        message.includes("function claim_sync_jobs") ||
        message.includes("tracker_google_sync_runs") ||
        message.includes("tracker_google_sync_jobs_job_type_check"));
};
const toLegacyJobType = (jobType) => {
    if (jobType === "reconcile_app_page")
        return "full_backfill";
    return jobType;
};
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const payload = Object.assign({}, (input.payload || {}));
    const nextRow = {
        user_id: input.userId,
        run_id: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
        lane: (_b = input.lane) !== null && _b !== void 0 ? _b : "system",
        task_id: (_c = input.taskId) !== null && _c !== void 0 ? _c : null,
        google_event_id: (_d = input.googleEventId) !== null && _d !== void 0 ? _d : null,
        list_id: (_e = input.listId) !== null && _e !== void 0 ? _e : null,
        job_type: input.jobType,
        source: (_f = input.source) !== null && _f !== void 0 ? _f : null,
        dedupe_key: (_g = input.dedupeKey) !== null && _g !== void 0 ? _g : null,
        priority: (_h = input.priority) !== null && _h !== void 0 ? _h : 100,
        payload,
        status: "pending",
    };
    const { error } = yield supabaseAdmin.from("tracker_google_sync_jobs").insert(nextRow);
    if (!error)
        return;
    if (error.code === "23505")
        return;
    if (isLegacyQueueSchemaError(error)) {
        const { error: legacyError } = yield supabaseAdmin.from("tracker_google_sync_jobs").insert({
            user_id: input.userId,
            task_id: (_j = input.taskId) !== null && _j !== void 0 ? _j : null,
            list_id: (_k = input.listId) !== null && _k !== void 0 ? _k : null,
            job_type: toLegacyJobType(input.jobType),
            priority: (_l = input.priority) !== null && _l !== void 0 ? _l : 100,
            payload,
            status: "pending",
        });
        if (!legacyError || legacyError.code === "23505") {
            return;
        }
        throw new Error(legacyError.message);
    }
    throw new Error(error.message);
});
exports.enqueueSyncJob = enqueueSyncJob;
const claimSyncJobs = (supabaseAdmin_1, ...args_1) => __awaiter(void 0, [supabaseAdmin_1, ...args_1], void 0, function* (supabaseAdmin, batchSize = 25, userId, lanes) {
    var _a;
    const { data, error } = yield supabaseAdmin.rpc("claim_sync_jobs", {
        batch_size: batchSize,
        p_user_id: userId !== null && userId !== void 0 ? userId : null,
        p_lanes: (lanes === null || lanes === void 0 ? void 0 : lanes.length) ? lanes : null,
    });
    if (!error)
        return (data !== null && data !== void 0 ? data : []);
    if (isLegacyQueueSchemaError(error)) {
        const legacy = yield supabaseAdmin.rpc("claim_sync_jobs", {
            batch_size: batchSize,
            p_user_id: userId !== null && userId !== void 0 ? userId : null,
        });
        if (legacy.error)
            throw new Error(legacy.error.message);
        return ((_a = legacy.data) !== null && _a !== void 0 ? _a : []);
    }
    throw new Error(error.message);
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
