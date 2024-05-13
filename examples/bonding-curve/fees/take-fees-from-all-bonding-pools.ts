import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/fees/take-fees-from-all-bonding-pools.ts
export const takeFeesFromAllBondingPoolsExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const tx = await bondingCurveInstance.getTakeFeesTransactionFromAllPools({ owner: user });
  console.debug("tx: ", tx);

  const res = await provider.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: user,
  });

  //   const res = await provider.signAndExecuteTransactionBlock({
  //     transactionBlock: tx,
  //     signer: keypair,
  //     options: {
  //       showBalanceChanges: true,
  //       showEffects: true,
  //       showEvents: true,
  //       showObjectChanges: true,
  //       showInput: true,
  //     },
  //   });

  console.debug("res: ", res);
};

takeFeesFromAllBondingPoolsExample();
