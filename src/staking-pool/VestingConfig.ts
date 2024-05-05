/* eslint-disable require-jsdoc */

import { SuiClient } from "@mysten/sui.js/client";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import { vestingDataContentObject, vestingDataDynamicFieldSchema } from "./schemas";
import { BondingPoolSingleton } from "../bonding-pool/BondingPool";

type VestingTable = Record<string, { notional: string; released: string }>;

type VestingData = {
  cliffTs: string;
  endTs: string;
  startTs: string;
};

interface VestingConfigParams {
  provider: SuiClient;
  data: VestingData;
  table: VestingTable;
}

export class VestingConfig {
  public data: VestingData;
  public table: VestingTable;

  constructor(private config: VestingConfigParams) {
    this.data = config.data;
    this.table = config.table;
  }

  static async fromTableId(params: { id: string } & Omit<VestingConfigParams, "table">) {
    const dfs = await getAllDynamicFields({
      parentObjectId: params.id,
      provider: params.provider,
    });
    const schema = vestingDataDynamicFieldSchema(BondingPoolSingleton.PACKAGE_OBJECT_ID);
    const vestingDataDfs = dfs.filter((df) => schema.safeParse(df).success).map((df) => schema.parse(df));
    const vestingData = await Promise.all(
      vestingDataDfs.map(async (df) => {
        const object = await params.provider.getObject({ id: df.objectId, options: { showContent: true } });
        const parsed = vestingDataContentObject(BondingPoolSingleton.PACKAGE_OBJECT_ID).parse(object.data?.content);
        return {
          walletAddress: parsed.fields.name,
          ...parsed.fields.value.fields,
        };
      }),
    );
    const table = vestingData.reduce((acc, item) => {
      acc[item.walletAddress] = item;
      return acc;
    }, {} as VestingTable);

    return new VestingConfig({
      provider: params.provider,
      table,
      data: params.data,
    });
  }
}
