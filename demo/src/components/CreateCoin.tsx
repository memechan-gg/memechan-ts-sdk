import {
  BondingPoolSingleton,
  CoinAPI,
  CreateCoinResponse,
  parseTransactionDataCoinAndTicketCreation,
  PoolAPI,
} from "@avernikoz/memechan-ts-sdk";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { BE_URL } from "../constants";
import { useState } from "react";
import { getFullnodeUrl } from "@mysten/sui.js/client";

export const CreateCoin: React.FC = () => {
  const wallet = useWallet();
  const [seedPoolId, setSeedPoolId] = useState<string | undefined>();
  const [coin, setCoin] = useState<CreateCoinResponse["coin"] | undefined>();

  const createCoin = async () => {
    if (!wallet.account) throw new Error("WALLET not connected");

    const params = {
      description: "testtoken4am description",
      name: "testtoken4am",
      signerAddress: wallet.account.address,
      symbol: "TEST_TOKEN_4am",
      url: "https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&dpr=1&w=1000",
    };

    const memeCoinTx = await BondingPoolSingleton.createMemeCoin(params);
    const { digest, objectChanges } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: memeCoinTx,
      requestType: "WaitForLocalExecution",
      options: {
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showInput: true,
      },
    });
    console.log("Coin&Ticket creation success");

    const { memeCoin } = parseTransactionDataCoinAndTicketCreation(objectChanges);
    console.log(memeCoin);
    const THRESHOLD_FOR_GOING_LIVE_IN_SUI = BigInt(1);
    const THRESHOLD_FOR_SELL_TICKET_IN_BONDING_CURVE_MS = BigInt(1 * 60 * 1000);

    const bondingCurveCustomParams = BondingPoolSingleton.getBondingCurveCustomParams({
      gammaS: THRESHOLD_FOR_GOING_LIVE_IN_SUI,
      sellDelayMs: THRESHOLD_FOR_SELL_TICKET_IN_BONDING_CURVE_MS,
    });
    const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePool({
      memeCoin,
      bondingCurveCustomParams,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await wallet.signAndExecuteTransactionBlock({
      transactionBlock: createBondingCurvePoolTx.tx,
      requestType: "WaitForLocalExecution",
      options: {
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showInput: true,
      },
    });
    console.log("Pool creation success");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const response = await new CoinAPI(BE_URL).createCoin({
      txDigest: digest,
    });

    setCoin(response.coin);

    console.log("Coin&Ticket creation success offchain");
    const { result: seedPools } = await new PoolAPI(BE_URL).getAllSeedPools();
    console.log("Seed pools", seedPools);
    console.log(
      "seed pools coin types",
      seedPools.map((p) => p.memeCoinType),
    );
    const seedPool = seedPools.find((p) => p.memeCoinType === response.coin.type);
    console.log("Seed pool for the coin", seedPool);
    if (seedPool) {
      setSeedPoolId(seedPool.objectId);
    }
  };

  const buyTokensFromSeedPool = async () => {
    if (!seedPoolId || !coin || !wallet.account) throw new Error("Invalid data");
    const bondingCurveInstance = BondingPoolSingleton.getInstance(getFullnodeUrl("mainnet"));
    const amount = "0.2";
    const outputAmount = await bondingCurveInstance.getSwapOutputAmountForSuiInput({
      bondingCurvePoolObjectId: seedPoolId,
      inputAmount: amount,
      memeCoin: { coinType: coin.type },
      slippagePercentage: 0,
    });
    const swapTxData = await BondingPoolSingleton.swapSuiForTicket({
      bondingCurvePoolObjectId: seedPoolId,
      inputAmount: amount,
      memeCoin: { coinType: coin.type },
      minOutputTicketAmount: outputAmount,
      signerAddress: wallet.account?.address,
      slippagePercentage: 0,
    });
    await wallet.signAndExecuteTransactionBlock({
      transactionBlock: swapTxData.tx,
      requestType: "WaitForLocalExecution",
      options: {
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showInput: true,
      },
    });
  };

  return (
    <div>
      <ConnectButton />
      <button onClick={createCoin}>Create coin</button>
      {coin && <h3>Coin Type</h3>}
      {coin?.type}
      {seedPoolId && <h3>Seed pool ID</h3>}
      {seedPoolId}
      {seedPoolId && <button onClick={buyTokensFromSeedPool}>Buy 1 SUI in tokens</button>}
    </div>
  );
};
