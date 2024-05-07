/* eslint-disable require-jsdoc */

import { SuiClient, SuiObjectResponse } from "@mysten/sui.js/client";
import { BondingPoolSingleton } from "../bonding-pool/BondingPool";
import { registrySchemaContent } from "../utils/schema";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import { isRegistryTableTypenameDynamicFields } from "../bonding-pool/utils/registryTableTypenameUtils";
import { getAllObjects } from "../bonding-pool/utils/getAllObjects";
import { isPoolObjectData } from "../bonding-pool/utils/isPoolObjectData";
import { chunkedRequests } from "../utils/chunking";
import { livePoolDescribeObjectResponse } from "./schemas";

type LivePoolData = {
  address: string;
  coinType: string;
};

export type LivePoolParams = {
  provider: SuiClient;
  data: LivePoolData;
};

export class LivePool {
  public data: LivePoolData;
  constructor(private params: LivePoolParams) {
    this.data = params.data;
  }

  /**
   * Factory method to create a StakingPool instance from a SuiObjectResponse.
   * Parses the object, checks the type format, and constructs the StakingPool with its detailed configurations.
   * @param {SuiObjectResponse} object - The blockchain object response to parse.
   * @param {SuiClient} provider - The blockchain client provider.
   * @throws {Error} If the object type format is invalid.
   * @return {Promise<StakingPool>} A new instance of StakingPool.
   */
  static fromObjectResponse(object: SuiObjectResponse, provider: SuiClient): LivePool {
    const livePoolResponse = livePoolDescribeObjectResponse.parse(object.data?.content).fields;
    return new LivePool({
      data: {
        address: object.data!.objectId,
        coinType: livePoolResponse.coins.fields.contents[1].fields.name,
      },
      provider,
    });
  }

  static async fromObjectIds({ objectIds, provider }: { objectIds: string[]; provider: SuiClient }) {
    const objects = await chunkedRequests(objectIds, (ids) =>
      provider.multiGetObjects({
        ids,
        options: {
          showContent: true,
          showType: true,
        },
      }),
    );
    return objects.map((o) => LivePool.fromObjectResponse(o, provider));
  }
  /**
   * Queries a registry to retrieve an array of LivePool instances.
   * @param {SuiClient} provider - The blockchain client provider.
   * @return {Promise<LiveCLMM[]>} An array of LivePool instances.
   */
  static async fromRegistry({ provider }: { provider: SuiClient }): Promise<LivePool[]> {
    const registry = await provider.getObject({
      id: BondingPoolSingleton.REGISTRY_OBJECT_ID,
      options: {
        showContent: true,
      },
    });
    const registryContent = registrySchemaContent.parse(registry.data?.content);
    const dfs = await getAllDynamicFields({
      parentObjectId: registryContent.fields.interest_pools.fields.id.id,
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

    const livePools = await LivePool.fromObjectIds({ objectIds: poolIds, provider });

    return livePools;
  }
}
