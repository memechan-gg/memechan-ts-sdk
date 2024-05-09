import { LiveCLMM } from "../../src";
import { keypair, provider, signAndExecuteTransaction, user } from "../common";

// yarn tsx examples/live/swap.ts
export const swapLive = async () => {
  const memecoinCointype =
    "0x5552f2e8989762bc65cd0b62b97999a8d6865a5a56cbe12890a883a88c527148::meme_08_05_2024_05::MEME_08_05_2024_05";

  // const inputAmount = "0.2";
  const inputAmount = "137101879";

  const liveInstance = await LiveCLMM.fromGoLiveDefaultTx({
    txDigest: "4v8DoaJze4s2dpNKS9cLyKQafTS4tQNpKVMwg4uneRbf",
    provider,
  });

  const pool = await liveInstance.getPool();
  console.debug("pool:", pool);

  const quoteResult = await liveInstance.quoteSwap({
    inputAmount,
    SuiToMeme: false,
    memeCoin: { coinType: memecoinCointype },
    slippagePercentage: 0.01,
  });
  console.debug("quoteResult:", quoteResult);

  const swap = await liveInstance.swap({
    inputAmount,
    memeCoin: { coinType: memecoinCointype },
    minOutputAmount: quoteResult,
    signerAddress: user,
    slippagePercentage: 0.01,
    SuiToMeme: false,
  });

  // const res = await provider.devInspectTransactionBlock({ sender: user, transactionBlock: swap });
  const res = await signAndExecuteTransaction(swap, keypair);
  console.debug("res:", res);
};

swapLive();
