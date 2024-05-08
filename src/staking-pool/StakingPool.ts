import {
  availableAmountToUnstake,
  collectFees,
  getFees,
  unstake,
  withdrawFees,
} from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { bcs } from "@mysten/sui.js/bcs";
import { SuiClient, SuiObjectResponse } from "@mysten/sui.js/client";
import { TransactionBlock, TransactionResult } from "@mysten/sui.js/transactions";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { BondingPoolSingleton } from "../bonding-pool/BondingPool";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import { getAllObjects } from "../bonding-pool/utils/getAllObjects";
import { isPoolObjectData } from "../bonding-pool/utils/isPoolObjectData";
import { isStakingPoolTokenPolicyCap } from "../bonding-pool/utils/isStakingPoolTokenCap";
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { isRegistryTableTypenameDynamicFields } from "../bonding-pool/utils/registryTableTypenameUtils";
import { LONG_SUI_COIN_TYPE, SHORT_SUI_COIN_TYPE } from "../common/sui";
import { getMergedToken } from "../common/tokens";
import { chunkedRequests } from "../utils/chunking";
import { registrySchemaContent } from "../utils/schema";
import { FeeState } from "./FeeState";
import { stakingPoolCreatedSchema, stakingPoolDescribeObjectResponse } from "./schemas";
import {
  GetCollectFeesAndUnstakeTransactionArgs,
  GetStakingPoolCollectFeesArgs,
  GetWithdrawFeesArgs,
  StakingPoolUnstakeArgs,
} from "./types";
import { UserWithdrawals } from "./UserWithdrawals";
import { VestingConfig } from "./VestingConfig";

type StakingPoolData = {
  address: string;
  memeCoinType: string;
  lpCoinType: string;
  totalSupply: string;
  ammPool: string;
  balanceLp: string;
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
  public static SIMULATION_ACCOUNT_ADDRESS = BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS;

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
   * @param {GetStakingPoolCollectFeesArgs} params - Parameters for the collectFees function,
   * omitting the clock and staking pool properties which are set internally.
   * @return {{tx: TransactionResult, txResult: TransactionResult}} The result of the collectFees function call
   */
  public collectFees(params: GetStakingPoolCollectFeesArgs): { tx: TransactionBlock; txResult: TransactionResult } {
    const tx = params.transaction ?? new TransactionBlock();

    const txResult = collectFees(tx, [SHORT_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType], {
      stakingPool: this.data.address,
      pool: params.clmmPool,
      clock: SUI_CLOCK_OBJECT_ID,
    });

    return { tx, txResult };
  }

  /**
   * Withdraws fees from the staking pool.
   * @param {GetWithdrawFeesArgs} params - params for withdraw fees from staking
   * @return {{tx: TransactionResult, txResult: TransactionResult}} The result of the withdrawFees function call
   */
  public withdrawFees(params: GetWithdrawFeesArgs): { tx: TransactionBlock; txResult: TransactionResult } {
    const tx = params.transaction ?? new TransactionBlock();

    const txResult = withdrawFees(
      tx,
      [SHORT_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType],
      this.data.address,
    );

    const [memeCoin, suiCoin] = txResult;

    tx.transferObjects([memeCoin], tx.pure(params.signerAddress));
    tx.transferObjects([suiCoin], tx.pure(params.signerAddress));

    return { tx, txResult };
  }

  // eslint-disable-next-line require-jsdoc
  public async getAvailableFeesToWithdraw({
    transaction,
    owner,
  }: {
    transaction?: TransactionBlock;
    owner: string;
  }): Promise<{ availableFees: { memeAmount: string; suiAmount: string } }> {
    const tx = transaction ?? new TransactionBlock();

    // Please note, mutation of `tx` happening below
    getFees(
      tx,
      [LONG_SUI_COIN_TYPE, this.params.data.memeCoinType, this.params.data.lpCoinType],
      this.params.data.address,
    );

    const res = await this.params.provider.devInspectTransactionBlock({
      sender: owner,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("[getAvailableFeesToWithdraw] No results found for simulation");
    }

    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("[getAvailableFeesToWithdraw] Return values are undefined");
    }

    // console.debug("returnValues");
    // console.dir(returnValues, { depth: null });

    const memeRawAmountBytes = returnValues[0][0];
    const suiRawAmountBytes = returnValues[1][0];

    // Meme
    const decodedMeme = bcs.de("u64", new Uint8Array(memeRawAmountBytes));
    const outputRawMeme = decodedMeme;
    const outputAmountMeme = new BigNumber(outputRawMeme).div(10 ** +StakingPool.MEMECOIN_DECIMALS);

    // Sui
    const decodedSui = bcs.de("u64", new Uint8Array(suiRawAmountBytes));
    const outputRawSui = decodedSui;
    const outputAmountSui = new BigNumber(outputRawSui).div(10 ** SUI_DECIMALS);

    return { availableFees: { memeAmount: outputAmountMeme.toString(), suiAmount: outputAmountSui.toString() } };
  }

  // eslint-disable-next-line require-jsdoc
  public async getAvailableAmountToUnstake({
    transaction,
    owner,
  }: {
    transaction?: TransactionBlock;
    owner: string;
  }): Promise<{ availableMemeAmountToUnstake: string }> {
    const tx = transaction ?? new TransactionBlock();

    // Please note, mutation of `tx` happening below
    availableAmountToUnstake(tx, [LONG_SUI_COIN_TYPE, this.params.data.memeCoinType, this.params.data.lpCoinType], {
      stakingPool: this.params.data.address,
      clock: SUI_CLOCK_OBJECT_ID,
    });

    const res = await this.params.provider.devInspectTransactionBlock({
      sender: owner,
      transactionBlock: tx,
    });

    console.debug("res:", res);

    if (!res.results) {
      throw new Error("[getAvailableAmountToUnstake] No results found for simulation");
    }

    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("[getAvailableAmountToUnstake] Return values are undefined");
    }

    const memeRawAmountBytes = returnValues[0][0];

    // Meme
    const decodedMeme = bcs.de("u64", new Uint8Array(memeRawAmountBytes));
    const outputRawMeme = decodedMeme;
    const outputAmountMeme = new BigNumber(outputRawMeme).div(10 ** +StakingPool.MEMECOIN_DECIMALS);

    const availableMemeAmountToUnstake = outputAmountMeme.toString();

    return { availableMemeAmountToUnstake };
  }

  // TODO: 1. add the same sing for available tickets to unclaim during the period of live phase
  // TODO: 2. extend `getAvailableAmountToClaim` in such a way, that it would be based on the input of staked lps coins,
  // not for the whole amount as it currently is

  /**
   * Unstakes assets from the staking pool.
   * @param {StakingPoolUnstakeArgs} params - The parameters required for unstaking.
   * @return {Promise<{tx: TransactionBlock}>} The transaction block object with the results of the unstake operation.
   */
  public async getUnstakeTransaction(params: StakingPoolUnstakeArgs) {
    const { inputAmount, signerAddress, transaction } = params;
    const tx = transaction ?? new TransactionBlock();

    const tokenPolicyObjectId = await this.getStakingPoolTokenPolicyCap();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, parseInt(StakingPool.TICKETCOIN_DECIMALS));

    const remainingAmountBN = new BigNumber(inputAmountWithDecimals.toString());
    const { stakedLpObjectsByMemeCoinTypeMap } = await BondingPoolSingleton.getAllStakedLPObjectsByOwner({
      owner: signerAddress,
      provider: this.params.provider,
    });

    const ownedTokens = stakedLpObjectsByMemeCoinTypeMap[this.data.memeCoinType];

    const tokenObject = getMergedToken({
      remainingAmountBN,
      availableTokens: ownedTokens.map((t) => ({
        coinType: t.memeCoinType,
        balance: t.balance,
        objectId: t.objectId,
      })),
      tokenPolicyObjectId,
      memeCoinType: this.data.memeCoinType,
      transaction: tx,
    });

    const [memecoin, suiCoin] = unstake(tx, [LONG_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType], {
      clock: SUI_CLOCK_OBJECT_ID,
      coinX: tokenObject,
      policy: tokenPolicyObjectId,
      stakingPool: this.data.address,
    });

    tx.transferObjects([memecoin, suiCoin], tx.pure(signerAddress));

    return { tx };
  }

  // eslint-disable-next-line require-jsdoc
  public async getCollectFeesAndUnstakeTransaction(params: GetCollectFeesAndUnstakeTransactionArgs) {
    const tx = params.transaction ?? new TransactionBlock();

    const { tx: collectFeesTx } = this.collectFees({
      clmmPool: params.clmmPool,
      stakingPool: this.data.address,
      transaction: tx,
    });

    const { tx: withdrawFeesAndCollectFeesTx } = this.withdrawFees({
      signerAddress: params.signerAddress,
      transaction: collectFeesTx,
    });

    return { tx: withdrawFeesAndCollectFeesTx };
  }

  /**
   * Retrieves the Token Policy Cap Object ID by the pool ID.
   * @param {{ poolId: string }} param0 - Object containing the pool ID.
   * @return {Promise<string>} The Token Policy Cap Object ID associated with the pool.
   * @throws Will throw an error if no token policy cap object is found or if
   * there are multiple with no clear resolution.
   */
  public async getStakingPoolTokenPolicyCap() {
    const object = await this.params.provider.getObject({ id: this.data.address, options: { showContent: true } });
    // console.debug("object:", JSON.stringify(object, null, 2));

    if (!isStakingPoolTokenPolicyCap(object)) {
      throw new Error(`[getStakingPoolTokenPolicyCap] Wrong shape of token policy cap for ${this.data.address}`);
    }

    const tokenPolicyCapId = object.data.content.fields.policy_cap.fields.for;

    if (!tokenPolicyCapId) {
      throw new Error(`[getStakingPoolTokenPolicyCap] No found token policy cap for ${this.data.address}`);
    }

    return tokenPolicyCapId;
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
