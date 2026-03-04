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
const express_1 = require("express");
const supabase_js_1 = require("@supabase/supabase-js");
const requireUser_1 = require("../../middleware/requireUser");
const encryptionService_1 = require("../../services/private/encryptionService");
const financeSyncService_1 = require("../../services/private/financeSyncService");
const plaidService_1 = require("../../services/private/plaidService");
const router = (0, express_1.Router)();
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
router.post("/plaid/link-token", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const linkToken = yield (0, plaidService_1.createLinkToken)(req.user.id);
        return res.json({ link_token: linkToken });
    }
    catch (error) {
        console.error("Failed to create Plaid link token", error);
        return res.status(500).json({ error: "Failed to create link token" });
    }
}));
router.post("/plaid/exchange-token", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const publicToken = (_a = req.body) === null || _a === void 0 ? void 0 : _a.public_token;
    if (!publicToken) {
        return res.status(400).json({ error: "public_token is required" });
    }
    try {
        const userId = req.user.id;
        const supabaseAdmin = getSupabaseAdmin();
        const exchange = yield (0, plaidService_1.exchangePublicToken)(publicToken);
        const accessToken = exchange.access_token;
        const plaidItemId = exchange.item_id;
        const encryptedAccessToken = (0, encryptionService_1.encryptToBase64)(accessToken);
        const [accounts, institutionName] = yield Promise.all([
            (0, plaidService_1.fetchAccounts)(accessToken),
            (0, plaidService_1.fetchInstitutionName)(accessToken).catch(() => null),
        ]);
        const { data: itemPublic, error: itemPublicError } = yield supabaseAdmin
            .from("finance_items_public")
            .insert({
            user_id: userId,
            provider: "plaid",
            institution_name: institutionName,
            status: "active",
        })
            .select("id, institution_name")
            .single();
        if (itemPublicError || !itemPublic) {
            console.error("Failed to insert finance_items_public", itemPublicError);
            return res.status(500).json({ error: "Failed to create finance item" });
        }
        const { error: secretsError } = yield supabaseAdmin.from("finance_items_secrets").insert({
            user_id: userId,
            item_public_id: itemPublic.id,
            plaid_item_id: plaidItemId,
            plaid_access_token: encryptedAccessToken,
            plaid_cursor: null,
        });
        if (secretsError) {
            console.error("Failed to insert finance_items_secrets", secretsError);
            // Best-effort cleanup to avoid orphaned public rows
            yield supabaseAdmin.from("finance_items_public").delete().eq("id", itemPublic.id);
            return res.status(500).json({ error: "Failed to store finance secrets" });
        }
        const accountRows = accounts.map((a) => {
            var _a, _b, _c, _d;
            return ({
                user_id: userId,
                item_id: itemPublic.id,
                plaid_account_id: a.account_id,
                name: a.name,
                mask: (_a = a.mask) !== null && _a !== void 0 ? _a : null,
                type: a.type,
                subtype: (_b = a.subtype) !== null && _b !== void 0 ? _b : null,
                iso_currency_code: (_d = (_c = a.balances) === null || _c === void 0 ? void 0 : _c.iso_currency_code) !== null && _d !== void 0 ? _d : null,
            });
        });
        if (accountRows.length) {
            const { error: accountsError } = yield supabaseAdmin
                .from("finance_accounts")
                .upsert(accountRows, { onConflict: "plaid_account_id" });
            if (accountsError) {
                console.error("Failed to upsert finance_accounts", accountsError);
                return res.status(500).json({ error: "Failed to store accounts" });
            }
        }
        return res.json({
            ok: true,
            institution_name: itemPublic.institution_name,
            accounts_count: accounts.length,
        });
    }
    catch (error) {
        console.error("Failed to exchange Plaid public token", error);
        return res.status(500).json({ error: "Failed to exchange token" });
    }
}));
router.post("/sync", requireUser_1.requireUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield (0, financeSyncService_1.syncUserFinance)(req.user.id);
        return res.json({ ok: true, results });
    }
    catch (error) {
        console.error("Failed to sync finance for user", error);
        return res.status(500).json({ error: "Failed to sync finance" });
    }
}));
router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
exports.default = router;
