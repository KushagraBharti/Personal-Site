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
exports.fetchInstitutionName = exports.fetchTransactionsSync = exports.fetchAccounts = exports.exchangePublicToken = exports.createLinkToken = void 0;
const plaid_1 = require("plaid");
const getPlaidEnv = () => {
    const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
    if (env === "sandbox" || env === "development" || env === "production")
        return env;
    throw new Error(`Invalid PLAID_ENV: ${process.env.PLAID_ENV}`);
};
const getPlaidClient = () => {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    if (!clientId || !secret) {
        throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
    }
    const env = getPlaidEnv();
    const configuration = new plaid_1.Configuration({
        basePath: plaid_1.PlaidEnvironments[env],
        baseOptions: {
            headers: {
                "PLAID-CLIENT-ID": clientId,
                "PLAID-SECRET": secret,
                "Plaid-Version": "2020-09-14",
            },
        },
    });
    return new plaid_1.PlaidApi(configuration);
};
const createLinkToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const client = getPlaidClient();
    const response = yield client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: "Finance Tracker",
        products: [plaid_1.Products.Auth, plaid_1.Products.Transactions],
        country_codes: [plaid_1.CountryCode.Us],
        language: "en",
    });
    return response.data.link_token;
});
exports.createLinkToken = createLinkToken;
const exchangePublicToken = (publicToken) => __awaiter(void 0, void 0, void 0, function* () {
    const client = getPlaidClient();
    const response = yield client.itemPublicTokenExchange({ public_token: publicToken });
    return response.data;
});
exports.exchangePublicToken = exchangePublicToken;
const fetchAccounts = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    const client = getPlaidClient();
    const response = yield client.accountsGet({ access_token: accessToken });
    return response.data.accounts;
});
exports.fetchAccounts = fetchAccounts;
const fetchTransactionsSync = (accessToken, cursor) => __awaiter(void 0, void 0, void 0, function* () {
    const client = getPlaidClient();
    const response = yield client.transactionsSync({
        access_token: accessToken,
        cursor: cursor !== null && cursor !== void 0 ? cursor : undefined,
    });
    return response.data;
});
exports.fetchTransactionsSync = fetchTransactionsSync;
const fetchInstitutionName = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = getPlaidClient();
    const itemRes = yield client.itemGet({ access_token: accessToken });
    const institutionId = itemRes.data.item.institution_id;
    if (!institutionId)
        return null;
    const instRes = yield client.institutionsGetById({
        institution_id: institutionId,
        country_codes: [plaid_1.CountryCode.Us],
    });
    return (_a = instRes.data.institution.name) !== null && _a !== void 0 ? _a : null;
});
exports.fetchInstitutionName = fetchInstitutionName;
