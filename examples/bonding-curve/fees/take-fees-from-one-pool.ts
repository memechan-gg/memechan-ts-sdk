import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/fees/take-fees-from-one-pool.ts
export const takeFeesFromBondingPoolsExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const poolByMeme = await bondingCurveInstance.getPoolByMeme({
    memeCoin: { coinType: "0x1541b19ba0456ad1331d55f1aab72a10cffb4bc4642d9bb0150409ee9e42a595::first::FIRST" },
  });
  const tx = await bondingCurveInstance.getTakeFeesTransactionFromPool({ owner: user, poolId: poolByMeme.objectId });
  console.debug("tx: ", tx);

  //   const res = await provider.devInspectTransactionBlock({
  //     transactionBlock: tx,
  //     sender: user,
  //   });

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: keypair,
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });

  console.debug("res: ", res);
};

takeFeesFromBondingPoolsExample();
