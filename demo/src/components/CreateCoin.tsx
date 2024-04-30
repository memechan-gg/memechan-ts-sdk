import { BondingPoolSingleton, CoinAPI, parseTransactionDataCoinAndTicketCreation } from "@avernikoz/memechan-ts-sdk";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { BE_URL } from "../constants";

export const CreateCoin: React.FC = () => {
  const wallet = useWallet();
  const createCoin = async () => {
    if (!wallet.account) throw new Error("WALLET not connected");

    const params = {
      description: "testtoken4am description",
      name: "testtoken4am",
      signerAddress: wallet.account.address,
      symbol: "TEST_TOKEN_4am",
      url: "https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&dpr=1&w=1000",
    };

    const memeAndTicketCoinTx = await BondingPoolSingleton.createMemeAndTicketCoins(params);
    const { digest, objectChanges } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: memeAndTicketCoinTx,
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

    const { memeCoin, ticketCoin } = parseTransactionDataCoinAndTicketCreation(objectChanges);
    console.log(memeCoin, ticketCoin);
    const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePool({ memeCoin, ticketCoin });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await new CoinAPI(BE_URL).createCoin({
      txDigest: digest,
    });
    console.log("Coin&Ticket creation success offchain");

    await new Promise((resolve) => setTimeout(resolve, 5000));

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
  };

  return (
    <div>
      <ConnectButton />
      <button onClick={createCoin}>Create coin</button>
    </div>
  );
};
