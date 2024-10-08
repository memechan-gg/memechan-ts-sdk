/* eslint-disable max-len */
import { BondingPoolSingleton } from "../../../src/bonding-pool/BondingPool";
import { CreateCoinTransactionParamsWithoutCertainProps } from "../../../src/bonding-pool/types";
import { parseTransactionDataCoinAndTicketCreation } from "../../../src/bonding-pool/utils/parseTransactionDataCoinAndTicketCreation";
import { keypair, provider, user } from "../../common";
import { sleep } from "../../utils/sleep";

// yarn tsx examples/bonding-curve/create/create-coins-and-create-custom-params-bonding-curve.ts
export const createCustomBondingCurveAndCoins = async (params: CreateCoinTransactionParamsWithoutCertainProps) => {
  const memeAndTicketCoinTx = await BondingPoolSingleton.createMemeCoin(params);

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: memeAndTicketCoinTx,
    signer: keypair,
    requestType: "WaitForLocalExecution",
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });
  console.debug("create coin tx res: ", res);

  const { memeCoin } = parseTransactionDataCoinAndTicketCreation(res.objectChanges);

  console.debug("memeCoin: ", memeCoin);

  // 10 sui
  const THRESHOLD_FOR_GOING_LIVE_IN_SUI = BigInt(1);
  // 5 minutes
  const THRESHOLD_FOR_SELL_TICKET_IN_BONDING_CURVE_MS = BigInt(5 * 60 * 1000);

  const bondingCurveCustomParams = BondingPoolSingleton.getBondingCurveCustomParams({
    gammaS: THRESHOLD_FOR_GOING_LIVE_IN_SUI,
    sellDelayMs: THRESHOLD_FOR_SELL_TICKET_IN_BONDING_CURVE_MS,
  });
  console.debug("bondingCurveCustomParams: ", bondingCurveCustomParams);

  const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePool({
    memeCoin,
    bondingCurveCustomParams: bondingCurveCustomParams,
  });

  await sleep(10000);

  console.debug(
    " createBondingCurvePoolTx tx.serialize: ",
    JSON.stringify(JSON.parse(createBondingCurvePoolTx.tx.serialize()), null, 2),
  );
  const res2 = await provider.signAndExecuteTransactionBlock({
    transactionBlock: createBondingCurvePoolTx.tx,
    signer: keypair,
    requestType: "WaitForLocalExecution",
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });

  console.debug("res2: ", res2);
  return res;
};

createCustomBondingCurveAndCoins({
  description: "08 May 2024 six",
  name: "meme0805202406",
  signerAddress: user,
  symbol: "MEME_08_05_2024_06",
  url: "",
});
