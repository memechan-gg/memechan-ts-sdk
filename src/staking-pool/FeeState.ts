/* eslint-disable require-jsdoc */

import { SuiClient } from "@mysten/sui.js/client";
import { UserWithdrawals } from "./UserWithdrawals";

type FeeStateData = {
  feesMeme: string;
  feesMemeTotal: string;
  feesS: string;
  feesSTotal: string;
  stakesTotal: string;
  userWithdrawalsX: UserWithdrawals;
  userWithdrawalsY: UserWithdrawals;
};

interface FeeStateParams {
  provider: SuiClient;
  data: FeeStateData;
}

export class FeeState {
  data: FeeStateData;

  constructor(private params: FeeStateParams) {
    this.data = params.data;
  }
}
