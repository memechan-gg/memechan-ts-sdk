import { BE_URL } from "../constants";
import { jsonFetch } from "../utils/fetch";
import { SeedPool } from "./schemas/pools-schema";
import { QueryAllSeedPoolsResponse } from "./types";

/**
 * Service class for handling pool-related operations.
 */
export class PoolAPI {
  /**
   * Constructs a new PoolAPI instance.
   * @param {string} url - The base URL for the backend service, defaults to BE_URL.
   */
  constructor(private url = BE_URL) {}

  /**
   * Retrieves all seed pools with optional pagination.
   * @param {string} [paginationToken] - A token for pagination, if more results are available beyond the first page.
   * @return {Promise<any>} A Promise that resolves with the list of all seed pools.
   */
  getAllSeedPools(paginationToken?: string): Promise<QueryAllSeedPoolsResponse> {
    return jsonFetch(`${this.url}/presale/seed-pools${paginationToken ? "?paginationToken=" + paginationToken : ""}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves seed pools filtered by coin type.
   * @param {string} coinType - The type of coin for filtering seed pools.
   * @return {Promise<any>} A Promise that resolves with the list of seed pools matching the specified coin type.
   */
  getSeedPoolByCoinType(coinType: string): Promise<SeedPool> {
    return jsonFetch(`${this.url}/presale/seed-pools?coinType=${coinType}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves seed pools filtered by ticket type.
   * @param {string} ticketType - The type of ticket for filtering seed pools.
   * @return {Promise<any>} A Promise that resolves with the list of seed pools matching the specified ticket type.
   */
  getSeedPoolByTicketType(ticketType: string): Promise<SeedPool> {
    return jsonFetch(`${this.url}/presale/seed-pools?ticketType=${ticketType}`, {
      method: "GET",
    });
  }
}
