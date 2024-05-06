import {
  collectFees,
  CollectFeesArgs,
  unstake,
  withdrawFees,
} from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { SuiClient, SuiObjectResponse } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { BondingPoolSingleton } from "../bonding-pool/BondingPool";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import { getAllObjects } from "../bonding-pool/utils/getAllObjects";
import { isPoolObjectData } from "../bonding-pool/utils/isPoolObjectData";
import { isTokenPolicyCapObjectData } from "../bonding-pool/utils/isTokenPolicyCapObjectData";
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { isRegistryTableTypenameDynamicFields } from "../bonding-pool/utils/registryTableTypenameUtils";
import { LONG_SUI_COIN_TYPE, SHORT_SUI_COIN_TYPE } from "../common/sui";
import { getAllTokens, getMergedToken } from "../common/tokens";
import { chunkedRequests } from "../utils/chunking";
import { registrySchemaContent } from "../utils/schema";
import { FeeState } from "./FeeState";
import { stakingPoolCreatedSchema, stakingPoolDescribeObjectResponse } from "./schemas";
import { StakingPoolUnstakeArgs } from "./types";
import { UserWithdrawals } from "./UserWithdrawals";
import { VestingConfig } from "./VestingConfig";

type StakingPoolData = {
  address: string;
  memeCoinType: string;
  lpCoinType: string;
  totalSupply: string;
  ammPool: string;
  balanceLp: string;
  balanceMeme: string;
  feeState: FeeState;
  poolAdmin: string;
  vesting: VestingConfig;
};

type StakingPoolParams = {
  data: StakingPoolData;
  provider: SuiClient;
};

/**
 * Class representing a staking pool.
 */
export class StakingPool {
  public static SIMULATION_ACCOUNT_ADDRESS = "0xac5bceec1b789ff840d7d4e6ce4ce61c90d190a7f8c4f4ddf0bff6ee2413c33c";

  public static TICKETCOIN_DECIMALS = BondingPoolSingleton.TICKET_COIN_DECIMALS;
  public static MEMECOIN_DECIMALS = BondingPoolSingleton.MEMECOIN_DECIMALS;
  public data: StakingPoolData;

  /**
   * Create a StakingPool.
   * @param {StakingPoolParams} params - The staking pool parameters.
   */
  constructor(private params: StakingPoolParams) {
    this.data = params.data;
  }

  /**
   * Collects fees from the staking pool.
   * @param {TransactionBlock} tx - The transaction block to collect fees.
   * @param {Omit<CollectFeesArgs, "clock" | "staking_pool">} params - Parameters for the collectFees function,
   * omitting the clock and staking pool properties which are set internally.
   * @return {TransactionResult} The result of the collectFees function call
   */
  collectFees(tx: TransactionBlock, params: Omit<CollectFeesArgs, "clock" | "staking_pool">) {
    return collectFees(tx, [SHORT_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType], {
      stakingPool: this.data.address,
      pool: params.pool,
      clock: SUI_CLOCK_OBJECT_ID,
    });
  }

  /**
   * Withdraws fees from the staking pool.
   * @param {TransactionBlock} tx - The transaction block to withdraw fees.
   * @param {string} signerAddress - the wallet address that you are using to withdraw the fees
   * @return {TransactionResult} The result of the withdrawFees function call
   */
  withdrawFees(tx: TransactionBlock, signerAddress: string) {
    const [memecoin, lpcoin] = withdrawFees(
      tx,
      [SHORT_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType],
      this.data.address,
    );
    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));
    return tx;
  }

  // eslint-disable-next-line require-jsdoc
  public async getAvailableFeesToWithdraw({
    transaction,
  }: {
    transaction?: TransactionBlock;
  }): Promise<{ availableFees: { memeAmount: string; suiAmount: string } }> {
    return { availableFees: { memeAmount: "0", suiAmount: "0" } };
  }

  // eslint-disable-next-line require-jsdoc
  public async getAvailableAmountToClaim({
    transaction,
  }: {
    transaction?: TransactionBlock;
  }): Promise<{ availableFees: { memeAmount: string; suiAmount: string } }> {
    return { availableFees: { memeAmount: "0", suiAmount: "0" } };
  }

  /**
   * Unstakes assets from the staking pool.
   * @param {TransactionBlock} tx - The tx parameter
   * @param {StakingPoolUnstakeArgs} params - The parameters required for unstaking.
   * @return {Promise<{tx: TransactionBlock}>} The transaction block object with the results of the unstake operation.
   */
  public async unstake(tx: TransactionBlock, params: StakingPoolUnstakeArgs) {
    const { inputAmount, signerAddress } = params;

    const tokenPolicyObjectId = await this.getTokenPolicy();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, parseInt(StakingPool.TICKETCOIN_DECIMALS));

    const remainingAmountBN = new BigNumber(inputAmountWithDecimals.toString());
    const ownedTokens = await getAllTokens({
      walletAddress: signerAddress,
      coinType: this.data.memeCoinType,
      provider: this.params.provider,
    });
    const tokenObject = getMergedToken({
      remainingAmountBN,
      availableTokens: ownedTokens,
      tokenPolicyObjectId,
      memeCoinType: this.data.memeCoinType,
      transaction: tx,
    });

    const [memecoin, lpcoin] = unstake(tx, [LONG_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType], {
      clock: SUI_CLOCK_OBJECT_ID,
      coinX: tokenObject,
      policy: tokenPolicyObjectId,
      stakingPool: this.data.address,
    });

    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));

    return { tx };
  }

  /**
   * Retrieves the Token Policy Cap Object ID by the pool ID.
   * @param {{ poolId: string }} param0 - Object containing the pool ID.
   * @return {Promise<string>} The Token Policy Cap Object ID associated with the pool.
   * @throws Will throw an error if no token policy cap object is found or if
   * there are multiple with no clear resolution.
   */
  public async getTokenPolicyCap() {
    const poolDynamicFields = await getAllDynamicFields({
      parentObjectId: this.data.address,
      provider: this.params.provider,
    });
    const tokenPolicyCapList = poolDynamicFields.filter((el) => el.objectType.includes("0x2::token::TokenPolicyCap"));

    if (tokenPolicyCapList.length === 0) {
      throw new Error(`[getTokenPolicyCapByPoolId] No token policy cap found for the pool ${this.data.address}`);
    }

    if (tokenPolicyCapList.length > 1) {
      console.warn(
        `[getTokenPolicyCapByPoolId] Warning: multiple tokenPolicyCaps found for pool ${this.data.address},
        ignoring the rest except first`,
        tokenPolicyCapList,
      );
    }

    const [tokenPolicyCapObject] = tokenPolicyCapList;
    const tokenPolicyCapObjectId = tokenPolicyCapObject.objectId;

    return tokenPolicyCapObjectId;
  }

  /**
   * Retrieves the token policy ID associated with the staking pool.
   * This method queries a provider for a token policy cap object, validates the response,
   * and extracts the token policy object ID from it.
   * @throws {Error} If no token policy cap data is found.
   * @return {Promise<string>} The token policy object ID.
   */
  public async getTokenPolicy() {
    const tokenPolicyCap = await this.getTokenPolicyCap();

    const tokenPolicyCapObjectData = await this.params.provider.getObject({
      id: tokenPolicyCap,
      options: { showContent: true, showOwner: true, showType: true },
    });

    if (!isTokenPolicyCapObjectData(tokenPolicyCapObjectData)) {
      throw new Error(`[getTokenPolicyByPoolId] No token policy cap found for the pool ${this.data.address}`);
    }

    const tokenPolicyObjectId = tokenPolicyCapObjectData.data?.content.fields.value.fields.for;

    return tokenPolicyObjectId;
  }

  /**
   * Factory method to create a StakingPool instance from a SuiObjectResponse.
   * Parses the object, checks the type format, and constructs the StakingPool with its detailed configurations.
   * @param {SuiObjectResponse} object - The blockchain object response to parse.
   * @param {SuiClient} provider - The blockchain client provider.
   * @throws {Error} If the object type format is invalid.
   * @return {Promise<StakingPool>} A new instance of StakingPool.
   */
  static async fromObjectResponse(object: SuiObjectResponse, provider: SuiClient): Promise<StakingPool> {
    const matches = object.data?.type?.match(/<[^>]*,\s*([^,>]+),\s*([^,>]+)>/);
    if (!matches || matches.length < 2) {
      throw new Error("Invalid object type format.");
    }
    const [_, memeCoinType, lpCoinType] = matches;
    const stakingPoolResponse = stakingPoolDescribeObjectResponse.parse(object.data?.content).fields;
    const vestingFields = stakingPoolResponse.vesting_config.fields;
    const vestingConfig = await VestingConfig.fromTableId({
      id: stakingPoolResponse.vesting_table.fields.id.id,
      provider,
      data: {
        cliffTs: vestingFields.cliff_ts,
        endTs: vestingFields.end_ts,
        startTs: vestingFields.start_ts,
      },
    });
    const feeStateFields = stakingPoolResponse.fee_state.fields;
    const feeState = new FeeState({
      provider,
      data: {
        stakesTotal: feeStateFields.stakes_total,
        feesSTotal: feeStateFields.fees_s_total,
        feesMeme: feeStateFields.fees_meme,
        feesMemeTotal: feeStateFields.fees_meme_total,
        feesS: feeStateFields.fees_s,
        userWithdrawalsX: await UserWithdrawals.fromTableId({
          id: feeStateFields.user_withdrawals_x.fields.id.id,
          provider,
        }),
        userWithdrawalsY: await UserWithdrawals.fromTableId({
          id: feeStateFields.user_withdrawals_y.fields.id.id,
          provider,
        }),
      },
    });
    return new StakingPool({
      data: {
        feeState,
        vesting: vestingConfig,
        address: object.data!.objectId,
        ammPool: stakingPoolResponse.amm_pool,
        poolAdmin: stakingPoolResponse.pool_admin.fields.id.id,
        totalSupply: stakingPoolResponse.meme_cap.fields.total_supply.fields.value,
        lpCoinType,
        memeCoinType,
        balanceLp: stakingPoolResponse.balance_lp,
        balanceMeme: stakingPoolResponse.balance_meme,
      },
      provider,
    });
  }

  /**
   * Asynchronously retrieves an array of StakingPool instances corresponding to the provided object IDs.
   * @param {string[]} objectIds - An array of blockchain object IDs.
   * @param {SuiClient} provider - The blockchain client provider.
   * @return {Promise<StakingPool[]>} An array of StakingPool instances.
   */
  static async fromObjectIds({
    objectIds,
    provider,
  }: {
    objectIds: string[];
    provider: SuiClient;
  }): Promise<StakingPool[]> {
    const objects = await chunkedRequests(objectIds, (ids) =>
      provider.multiGetObjects({
        ids,
        options: {
          showContent: true,
          showType: true,
        },
      }),
    );
    const results: StakingPool[] = [];
    for (const obj of objects) {
      results.push(await StakingPool.fromObjectResponse(obj, provider));
    }
    return results;
  }
  /**
   * Retrieves a StakingPool instance corresponding to a 'go-live' transaction digest.
   * @param {string} txDigest - The transaction digest to query.
   * @param {SuiClient} provider - The blockchain client provider.
   * @return {Promise<StakingPool>} A StakingPool instance.
   */
  static async fromGoLiveDefaultTx({ txDigest, provider }: { txDigest: string; provider: SuiClient }) {
    const txResult = await provider.getTransactionBlock({ digest: txDigest, options: { showObjectChanges: true } });
    const schema = stakingPoolCreatedSchema(BondingPoolSingleton.PACKAGE_OBJECT_ID);
    const createdStakedPool = schema.parse(txResult.objectChanges?.find((oc) => schema.safeParse(oc).success));
    const [stakingPool] = await StakingPool.fromObjectIds({ objectIds: [createdStakedPool.objectId], provider });
    return stakingPool;
  }

  /**
   * Queries a registry to retrieve an array of StakingPool instances.
   * @param {SuiClient} provider - The blockchain client provider.
   * @return {Promise<StakingPool[]>} An array of StakingPool instances.
   */
  static async fromRegistry({ provider }: { provider: SuiClient }): Promise<StakingPool[]> {
    const registry = await provider.getObject({
      id: BondingPoolSingleton.REGISTRY_OBJECT_ID,
      options: {
        showContent: true,
      },
    });
    const registryContent = registrySchemaContent.parse(registry.data?.content);
    const dfs = await getAllDynamicFields({
      parentObjectId: registryContent.fields.staking_pools.fields.id.id,
      provider,
    });

    if (!isRegistryTableTypenameDynamicFields(dfs)) {
      throw new Error("Wrong shape of typename dynamic fields of bonding curve registry table");
    }

    const typenameObjectIdsMap = dfs.reduce(
      (acc: { [objectId: string]: { objectId: string; registryKeyType: string } }, el) => {
        acc[el.objectId] = { objectId: el.objectId, registryKeyType: el.name.value.name };

        return acc;
      },
      {},
    );

    const tableTypenameObjectIds = Object.keys(typenameObjectIdsMap);

    const objectDataList = await getAllObjects({
      objectIds: tableTypenameObjectIds,
      provider: provider,
      options: { showContent: true, showDisplay: true },
    });

    if (!isPoolObjectData(objectDataList)) {
      throw new Error("Wrong shape of seed pools of bonding curve pools");
    }

    const poolIds = objectDataList.map((el) => el.data.content.fields.value);

    const stakingPools = await StakingPool.fromObjectIds({ objectIds: poolIds, provider });

    return stakingPools;
  }
}
