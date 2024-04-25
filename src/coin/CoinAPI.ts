import { Auth } from "../auth/Auth";
import { BE_URL } from "../constants";
import { jsonFetch, signedJsonFetch, unsignedMultipartRequest } from "../utils/fetch";
import {
  CoinStatus,
  CreateCoinRequestBody,
  createCoinRequestBodySchema,
  QueryCoinsRequestParams,
} from "./schemas/coin-schemas";

/**
 * Service class for handling coin-related operations.
 */
export class CoinAPI {
  /**
   * Constructs a new CoinService instance.
   * @param {string} url - The base URL for the backend service, defaults to BE_URL.
   */
  constructor(private url = BE_URL) {}

  /**
   * Fetches data about a specific coin.
   * @param {CoinStatus} status - The status of the coin that you want to fetch (LIVE or PRESALE)
   * @param {string} coinType - The type of coin to query.
   * @throws Will throw an error if authentication session is not active.
   * @return {Promise<any>} A promise that resolves with the coin data.
   */
  getCoin(status: CoinStatus, coinType: string) {
    return jsonFetch(`${this.url}/${status.toLowerCase()}/coin?coinType=${coinType}`, {
      method: "GET",
    });
  }

  /**
   * Queries coins based on specified parameters.
   * @param {QueryCoinsRequestParams} params - The query parameters to filter coins.
   * @throws Will throw an error if authentication session is not active.
   * @return {Promise<any>} A promise that resolves with the queried coin data.
   */
  queryCoins(params: QueryCoinsRequestParams) {
    const queryParams = new URLSearchParams(params as Record<string, string>);
    return jsonFetch(`${this.url}/${params.status.toLowerCase()}/coins?${queryParams.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Create coin
   * @param {CreateCoinRequestBody} params - The create coin request payload.
   * @throws Will throw an error if authentication session is not active.
   * @return {Promise<any>} A promise that resolves with the queried coin data.
   */
  createCoin(params: CreateCoinRequestBody) {
    if (!Auth.currentSession) throw new Error("You don't have any active session, please run the Auth.refreshSession");
    return signedJsonFetch(`${this.url}/coin`, Auth.currentSession, {
      method: "POST",
      body: createCoinRequestBodySchema.parse(params),
    });
  }

  /**
   * uploadFile to ipfs
   * @param {File} file The URL to which the request is sent.
   * @return {Promise<void>} A promise that resolves with the response of the fetch request.
   */
  uploadFile(file: File) {
    if (!Auth.currentSession) throw new Error("You need to start a session first, use the Auth module");
    return unsignedMultipartRequest(`${this.url}/upload-image`, file);
  }
}
