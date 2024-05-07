import { LiveCLMM } from "../../src";
import { keypair, provider, signAndExecuteTransaction, user } from "../common";

// yarn tsx examples/live/swap.ts
export const swapLive = async () => {
  const memeCoinType =
    "0xf8a2ba07ec67b0f4ad7458a6d58af6fa7b00374e21d6ae45e3dbe0cab0f78865::meme_06_05_2024_03::MEME_06_05_2024_03";
  const inputAmount = "0.5";

  const liveInstance = new LiveCLMM({
    provider,
    data: {
      memeCoin: {
        coinType: memeCoinType,
      },
    },
  });

  const pool = await liveInstance.getPool();
  console.debug("pool:", pool);

  const quoteResult = await liveInstance.quoteSwap({
    inputAmount,
    SuiToMeme: true,
    memeCoin: { coinType: memeCoinType },
    slippagePercentage: 0.01,
  });
  console.debug("quoteResult:", quoteResult);

  const swap = await liveInstance.swap({
    inputAmount,
    memeCoin: { coinType: memeCoinType },
    minOutputAmount: quoteResult,
    signerAddress: user,
    slippagePercentage: 0.01,
    SuiToMeme: true,
  });

  const res = await provider.devInspectTransactionBlock({ sender: user, transactionBlock: swap });
  // const res = await signAndExecuteTransaction(swap, keypair);
  console.debug("res:", res);
};

swapLive();
