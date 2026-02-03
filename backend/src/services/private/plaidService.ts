import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

type PlaidEnv = "sandbox" | "development" | "production";

const getPlaidEnv = (): PlaidEnv => {
  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  if (env === "sandbox" || env === "development" || env === "production") return env;
  throw new Error(`Invalid PLAID_ENV: ${process.env.PLAID_ENV}`);
};

const getPlaidClient = () => {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
  }

  const env = getPlaidEnv();

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
        "Plaid-Version": "2020-09-14",
      },
    },
  });

  return new PlaidApi(configuration);
};

export const createLinkToken = async (userId: string) => {
  const client = getPlaidClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Finance Tracker",
    products: [Products.Auth, Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return response.data.link_token;
};

export const exchangePublicToken = async (publicToken: string) => {
  const client = getPlaidClient();
  const response = await client.itemPublicTokenExchange({ public_token: publicToken });
  return response.data;
};

export const fetchAccounts = async (accessToken: string) => {
  const client = getPlaidClient();
  const response = await client.accountsGet({ access_token: accessToken });
  return response.data.accounts;
};

export const fetchTransactionsSync = async (accessToken: string, cursor: string | null) => {
  const client = getPlaidClient();
  const response = await client.transactionsSync({
    access_token: accessToken,
    cursor: cursor ?? undefined,
  });
  return response.data;
};

export const fetchInstitutionName = async (accessToken: string): Promise<string | null> => {
  const client = getPlaidClient();
  const itemRes = await client.itemGet({ access_token: accessToken });
  const institutionId = itemRes.data.item.institution_id;
  if (!institutionId) return null;

  const instRes = await client.institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us],
  });

  return instRes.data.institution.name ?? null;
};
