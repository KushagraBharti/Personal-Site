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
exports.syncAllFinance = exports.syncUserFinance = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const encryptionService_1 = require("./encryptionService");
const plaidService_1 = require("./plaidService");
const getSupabaseAdmin = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_URL and (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY) must be set");
    }
    return (0, supabase_js_1.createClient)(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
};
const normalizeError = (error) => {
    if (!error)
        return "Unknown error";
    if (error instanceof Error)
        return error.message;
    return String(error);
};
const syncItem = (supabaseAdmin, item) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { data: secrets, error: secretsError } = yield supabaseAdmin
            .from("finance_items_secrets")
            .select("id, item_public_id, plaid_access_token, plaid_cursor")
            .eq("item_public_id", item.id)
            .maybeSingle();
        if (secretsError || !secrets) {
            throw new Error((secretsError === null || secretsError === void 0 ? void 0 : secretsError.message) || "Missing finance item secrets");
        }
        const accessToken = (0, encryptionService_1.decryptFromBase64)(secrets.plaid_access_token);
        let cursor = (_a = secrets.plaid_cursor) !== null && _a !== void 0 ? _a : null;
        let hasMore = true;
        const added = [];
        const modified = [];
        const removed = [];
        while (hasMore) {
            const sync = yield (0, plaidService_1.fetchTransactionsSync)(accessToken, cursor);
            added.push(...sync.added);
            modified.push(...sync.modified);
            removed.push(...sync.removed);
            cursor = sync.next_cursor;
            hasMore = sync.has_more;
        }
        const { data: accounts, error: accountsError } = yield supabaseAdmin
            .from("finance_accounts")
            .select("id, plaid_account_id")
            .eq("user_id", item.user_id)
            .eq("item_id", item.id);
        if (accountsError) {
            throw new Error(accountsError.message);
        }
        const accountMap = new Map();
        (accounts !== null && accounts !== void 0 ? accounts : []).forEach((acct) => accountMap.set(acct.plaid_account_id, acct));
        const modifiedIds = modified.map((t) => t.transaction_id);
        let existingMap = new Map();
        if (modifiedIds.length) {
            const { data: existingRows, error: existingError } = yield supabaseAdmin
                .from("finance_transactions")
                .select("plaid_transaction_id, reviewed, category_id")
                .eq("user_id", item.user_id)
                .in("plaid_transaction_id", modifiedIds);
            if (existingError) {
                throw new Error(existingError.message);
            }
            (existingRows !== null && existingRows !== void 0 ? existingRows : []).forEach((row) => existingMap.set(row.plaid_transaction_id, row));
        }
        const buildPayload = (t, overrides) => {
            var _a, _b, _c, _d, _e, _f;
            const account = accountMap.get(t.account_id);
            if (!account)
                return null;
            return {
                user_id: item.user_id,
                account_id: account.id,
                plaid_transaction_id: t.transaction_id,
                date: t.date,
                authorized_date: (_a = t.authorized_date) !== null && _a !== void 0 ? _a : null,
                name: t.name,
                merchant_name: (_b = t.merchant_name) !== null && _b !== void 0 ? _b : null,
                amount: t.amount,
                iso_currency_code: (_c = t.iso_currency_code) !== null && _c !== void 0 ? _c : null,
                pending: (_d = t.pending) !== null && _d !== void 0 ? _d : false,
                reviewed: (_e = overrides === null || overrides === void 0 ? void 0 : overrides.reviewed) !== null && _e !== void 0 ? _e : false,
                category_id: (_f = overrides === null || overrides === void 0 ? void 0 : overrides.category_id) !== null && _f !== void 0 ? _f : null,
                deleted_at: null,
            };
        };
        const addedRows = added
            .map((t) => buildPayload(t, { reviewed: false, category_id: null }))
            .filter(Boolean);
        const modifiedRows = modified
            .map((t) => {
            var _a, _b;
            const existing = existingMap.get(t.transaction_id);
            return buildPayload(t, {
                reviewed: (_a = existing === null || existing === void 0 ? void 0 : existing.reviewed) !== null && _a !== void 0 ? _a : false,
                category_id: (_b = existing === null || existing === void 0 ? void 0 : existing.category_id) !== null && _b !== void 0 ? _b : null,
            });
        })
            .filter(Boolean);
        const upsertRows = [...addedRows, ...modifiedRows];
        if (upsertRows.length) {
            const { error: upsertError } = yield supabaseAdmin
                .from("finance_transactions")
                .upsert(upsertRows, { onConflict: "plaid_transaction_id" });
            if (upsertError) {
                throw new Error(upsertError.message);
            }
        }
        if (removed.length) {
            const removedIds = removed.map((r) => r.transaction_id);
            const { error: removedError } = yield supabaseAdmin
                .from("finance_transactions")
                .update({ deleted_at: new Date().toISOString() })
                .eq("user_id", item.user_id)
                .in("plaid_transaction_id", removedIds);
            if (removedError) {
                throw new Error(removedError.message);
            }
        }
        const { error: cursorError } = yield supabaseAdmin
            .from("finance_items_secrets")
            .update({ plaid_cursor: cursor })
            .eq("id", secrets.id);
        if (cursorError) {
            throw new Error(cursorError.message);
        }
        const { error: publicUpdateError } = yield supabaseAdmin
            .from("finance_items_public")
            .update({
            last_synced_at: new Date().toISOString(),
            last_error: null,
            status: "active",
        })
            .eq("id", item.id);
        if (publicUpdateError) {
            throw new Error(publicUpdateError.message);
        }
        return { ok: true, itemId: item.id };
    }
    catch (error) {
        const message = normalizeError(error);
        console.error("Finance sync failed", { itemId: item.id, message });
        yield supabaseAdmin
            .from("finance_items_public")
            .update({
            status: "error",
            last_error: message,
        })
            .eq("id", item.id);
        return { ok: false, itemId: item.id, error: message };
    }
});
const syncUserFinance = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: items, error } = yield supabaseAdmin
        .from("finance_items_public")
        .select("id, user_id, status")
        .eq("user_id", userId)
        .eq("status", "active");
    if (error) {
        throw new Error(error.message);
    }
    const results = [];
    for (const item of items !== null && items !== void 0 ? items : []) {
        results.push(yield syncItem(supabaseAdmin, item));
    }
    return results;
});
exports.syncUserFinance = syncUserFinance;
const syncAllFinance = () => __awaiter(void 0, void 0, void 0, function* () {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: items, error } = yield supabaseAdmin
        .from("finance_items_public")
        .select("id, user_id, status")
        .eq("status", "active");
    if (error) {
        throw new Error(error.message);
    }
    const results = [];
    for (const item of items !== null && items !== void 0 ? items : []) {
        results.push(yield syncItem(supabaseAdmin, item));
    }
    return results;
});
exports.syncAllFinance = syncAllFinance;
