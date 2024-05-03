/* eslint-disable require-jsdoc */

import { SuiClient } from "@mysten/sui.js/client";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";

type UserWithdrawalsData = Record<string, unknown>;

interface UserWithdrawalsParams {
  provider: SuiClient;
  data: UserWithdrawalsData;
}

export class UserWithdrawals {
  data: UserWithdrawalsData;

  constructor(private params: UserWithdrawalsParams) {
    this.data = params.data;
  }

  static async fromTableId(params: { id: string } & Omit<UserWithdrawalsParams, "data">) {
    const dfs = await getAllDynamicFields({
      parentObjectId: params.id,
      provider: params.provider,
    });
    // TODO to be defined because with the current example it returns empty
    return new UserWithdrawals({
      provider: params.provider,
      data: {},
    });
  }
}
