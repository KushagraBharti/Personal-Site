import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../../middleware/requireUser";
import { encryptToBase64 } from "../../services/private/encryptionService";
import { syncUserFinance } from "../../services/private/financeSyncService";
import {
  createLinkToken,
  exchangePublicToken,
  fetchAccounts,
  fetchInstitutionName,
} from "../../services/private/plaidService";

const router = Router();

const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

router.post("/plaid/link-token", requireUser, async (req, res) => {
  try {
    const linkToken = await createLinkToken(req.user!.id);
    return res.json({ link_token: linkToken });
  } catch (error) {
    console.error("Failed to create Plaid link token", error);
    return res.status(500).json({ error: "Failed to create link token" });
  }
});

router.post("/plaid/exchange-token", requireUser, async (req, res) => {
  const publicToken = req.body?.public_token as string | undefined;
  if (!publicToken) {
    return res.status(400).json({ error: "public_token is required" });
  }

  try {
    const userId = req.user!.id;
    const supabaseAdmin = getSupabaseAdmin();

    const exchange = await exchangePublicToken(publicToken);
    const accessToken = exchange.access_token;
    const plaidItemId = exchange.item_id;

    const encryptedAccessToken = encryptToBase64(accessToken);

    const [accounts, institutionName] = await Promise.all([
      fetchAccounts(accessToken),
      fetchInstitutionName(accessToken).catch(() => null),
    ]);

    const { data: itemPublic, error: itemPublicError } = await supabaseAdmin
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

    const { error: secretsError } = await supabaseAdmin.from("finance_items_secrets").insert({
      user_id: userId,
      item_public_id: itemPublic.id,
      plaid_item_id: plaidItemId,
      plaid_access_token: encryptedAccessToken,
      plaid_cursor: null,
    });

    if (secretsError) {
      console.error("Failed to insert finance_items_secrets", secretsError);
      // Best-effort cleanup to avoid orphaned public rows
      await supabaseAdmin.from("finance_items_public").delete().eq("id", itemPublic.id);
      return res.status(500).json({ error: "Failed to store finance secrets" });
    }

    const accountRows = accounts.map((a) => ({
      user_id: userId,
      item_id: itemPublic.id,
      plaid_account_id: a.account_id,
      name: a.name,
      mask: a.mask ?? null,
      type: a.type,
      subtype: a.subtype ?? null,
      iso_currency_code: a.balances?.iso_currency_code ?? null,
    }));

    if (accountRows.length) {
      const { error: accountsError } = await supabaseAdmin
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
  } catch (error) {
    console.error("Failed to exchange Plaid public token", error);
    return res.status(500).json({ error: "Failed to exchange token" });
  }
});

router.post("/sync", requireUser, async (req, res) => {
  try {
    const results = await syncUserFinance(req.user!.id);
    return res.json({ ok: true, results });
  } catch (error) {
    console.error("Failed to sync finance for user", error);
    return res.status(500).json({ error: "Failed to sync finance" });
  }
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
