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
const STALE_RUNNING_JOB_MS = 10 * 60 * 1000;
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
    const candidates = [
        ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
        ["SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY],
    ].filter((entry) => !!entry[1]);
    if (!url || candidates.length === 0) {
        throw new Error("SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set");
    }
    // Prefer service-role JWTs for supabase-js, but tolerate newer sb_secret_* keys.
    // Vercel/Supabase integrations can leave stale anon keys beside newer variables.
    let selectedKey = null;
    let firstInvalidMessage = "";
    for (const [name, key] of candidates) {
        if (key.startsWith("sb_publishable_")) {
            firstInvalidMessage || (firstInvalidMessage = `${name} is publishable/anon, expected a server key.`);
            continue;
        }
        if (!key.startsWith("eyJ")) {
            selectedKey = key;
            break;
        }
        const role = parseJwtRole(key);
        if (role && role !== "service_role") {
            firstInvalidMessage || (firstInvalidMessage = `${name} JWT role is '${role}', expected 'service_role'.`);
            continue;
        }
        selectedKey = key;
        break;
    }
    if (!selectedKey) {
        throw new Error(firstInvalidMessage ||
            "Supabase server key is misconfigured. Use SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY, not a frontend key.");
    }
    return (0, supabase_js_1.createClient)(url, selectedKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
};
exports.getSupabaseAdmin = getSupabaseAdmin;
const enqueueSyncJob = (supabaseAdmin, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
        return true;
    if (error.code === "23505")
        return false;
    throw new Error(error.message);
});
exports.enqueueSyncJob = enqueueSyncJob;
const recoverStaleRunningJobs = (supabaseAdmin, userId, lanes) => __awaiter(void 0, void 0, void 0, function* () {
    const staleBefore = new Date(Date.now() - STALE_RUNNING_JOB_MS).toISOString();
    let query = supabaseAdmin
        .from("tracker_google_sync_jobs")
        .update({
        status: "pending",
        locked_at: null,
        run_after: new Date().toISOString(),
    })
        .eq("status", "running")
        .lt("locked_at", staleBefore);
    if (userId)
        query = query.eq("user_id", userId);
    if (lanes === null || lanes === void 0 ? void 0 : lanes.length)
        query = query.in("lane", lanes);
    const { error } = yield query;
    if (error)
        throw new Error(error.message);
});
const claimSyncJobs = (supabaseAdmin_1, ...args_1) => __awaiter(void 0, [supabaseAdmin_1, ...args_1], void 0, function* (supabaseAdmin, batchSize = 25, userId, lanes) {
    yield recoverStaleRunningJobs(supabaseAdmin, userId, lanes);
    const { data, error } = yield supabaseAdmin.rpc("claim_sync_jobs", {
        batch_size: batchSize,
        p_user_id: userId !== null && userId !== void 0 ? userId : null,
        p_lanes: (lanes === null || lanes === void 0 ? void 0 : lanes.length) ? lanes : null,
    });
    if (!error)
        return (data !== null && data !== void 0 ? data : []);
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
