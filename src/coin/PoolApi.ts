import { BE_URL } from "../constants";
import { StakingPool } from "../staking-pool/StakingPool";
import { jsonFetch } from "../utils/fetch";
import { LivePoolData, SeedPool, StakingPoolData } from "./schemas/pools-schema";
import { QueryAllLivePoolsResponse, QueryAllSeedPoolsResponse, QueryAllStakingPoolsResponse } from "./types";

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
   * @return {Promise<QueryAllSeedPoolsResponse>} A Promise that resolves with the list of all seed pools.
   */
  getAllSeedPools(paginationToken?: string): Promise<QueryAllSeedPoolsResponse> {
    return jsonFetch(`${this.url}/seed-pools${paginationToken ? "?paginationToken=" + paginationToken : ""}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves seed pool filtered by coin type.
   * @param {string} coinType - The type of coin for filtering seed pools.
   * @return {Promise<SeedPool>} A Promise that resolves with the list of seed pools matching the specified coin type.
   */
  getSeedPoolByCoinType(coinType: string): Promise<SeedPool> {
    return jsonFetch(`${this.url}/seed-pools?coinType=${coinType}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves live pool by coin type.
   * @param {string} coinType - The type of coin for filtering seed pools.
   * @return {Promise<LivePoolData>} A Promise that resolves with the live pool matching the specified coin type.
   */
  getLivePoolByCoinType(coinType: string): Promise<LivePoolData> {
    return jsonFetch(`${this.url}/live-pools?coinType=${coinType}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves staking pool by coin type.
   * @param {string} coinType - The type of coin for filtering seed pools.
   * @return {Promise<StakingPoolData>} A Promise that resolves with the live pool matching the specified coin type.
   */
  getStakingPoolByCoinType(coinType: string): Promise<StakingPoolData> {
    return jsonFetch(`${this.url}/staking-pools?coinType=${coinType}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves seed pools filtered by coin type.
   * @param {string} [paginationToken] - A token for pagination, if more results are available beyond the first page.
   * @return {Promise<any>} A Promise that resolves with the list of seed pools matching the specified coin type.
   */
  getLivePools(paginationToken?: string): Promise<QueryAllLivePoolsResponse> {
    return jsonFetch(`${this.url}/live-pools${paginationToken ? "?paginationToken=" + paginationToken : ""}`, {
      method: "GET",
    });
  }

  /**
   * Retrieves seed pools filtered by coin type.
   * @param {string} [paginationToken] - A token for pagination, if more results are available beyond the first page.
   * @return {Promise<any>} A Promise that resolves with the list of seed pools matching the specified coin type.
   */
  getStakingPools(paginationToken?: string): Promise<QueryAllStakingPoolsResponse> {
    return jsonFetch(`${this.url}/staking-pools${paginationToken ? "?paginationToken=" + paginationToken : ""}`, {
      method: "GET",
    });
  }
}
