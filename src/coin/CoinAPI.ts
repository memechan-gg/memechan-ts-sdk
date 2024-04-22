import { Auth } from "../auth/Auth";
import { BE_URL } from "../constants";
import { signedJsonFetch, signedMultipartRequest } from "../utils/fetch";
import { QueryCoinsRequestParams } from "./schemas/coin-schemas";

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
   * @param {string} coinType - The type of coin to query.
   * @throws Will throw an error if authentication session is not active.
   * @return {Promise<any>} A promise that resolves with the coin data.
   */
  getCoin(coinType: string) {
    if (!Auth.currentSession) throw new Error("You need to start a session first, use the Auth module");
    return signedJsonFetch(`${this.url}/coin?coinType=${coinType}`, Auth.currentSession, {
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
    if (!Auth.currentSession) throw new Error("You need to start a session first, use the Auth module");
    const queryParams = new URLSearchParams(params as Record<string, string>);
    return signedJsonFetch(`${this.url}/coins?${queryParams.toString()}`, Auth.currentSession, {
      method: "GET",
    });
  }

  /**
   * uploadFile to ipfs
   * @param {File} file The URL to which the request is sent.
   * @return {Promise<void>} A promise that resolves with the response of the fetch request.
   */
  uploadFile(file: File) {
    if (!Auth.currentSession) throw new Error("You need to start a session first, use the Auth module");
    return signedMultipartRequest(`${this.url}/upload-image`, Auth.currentSession, [file]);
  }
}
