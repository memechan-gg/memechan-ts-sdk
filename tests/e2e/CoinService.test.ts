import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI, CoinManagerSingleton } from "../../src";
import { Coin, coinSchema } from "../../src/coin/schemas/coin-schemas";
import { isSorted } from "./helpers";
import { provider, user } from "../../examples/common";

const BE_URL = "https://cp1mqp07c3.execute-api.us-east-1.amazonaws.com/prod";

describe("CoinService authenticated operations", () => {
  let keypair: Ed25519Keypair;

  beforeAll(async () => {
    keypair = new Ed25519Keypair();
    console.log("Testing with wallet", keypair.getPublicKey().toSuiAddress());
    const authService = new Auth();
    const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
    const { signature } = await keypair.signPersonalMessage(Buffer.from(messageToSign));
    await authService.refreshSession({
      walletAddress: keypair.getPublicKey().toSuiAddress(),
      signedMessage: signature,
    });
    console.log("Wallet authenticated");
  });

  test("Create a coin", async () => {
    const coinApi = new CoinAPI(BE_URL);
    const createCoinTx = await CoinManagerSingleton.getCreateCoinTransaction({
      decimals: "10",
      description: "testtoken3am description",
      fixedSupply: false,
      mintAmount: "900000000",
      name: "testtoken3am",
      signerAddress: user,
      symbol: "TEST_TOKEN_3AM",
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8iB11vE7qmEdgHxD7Hnm4_gi6R4KJ9B8nzs_su6iaGg&s",
    });

    const { digest } = await provider.signAndExecuteTransactionBlock({
      transactionBlock: createCoinTx,
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

    await coinApi.createCoin({
      txDigest: digest,
      socialLinks: {
        twitter: "mytwitter",
        discord: "mydiscord",
      },
    });
  });
});

describe("CoinService unauthenticated operations", () => {
  let coin: Coin;
  test("check queryCoins retrieve successfully all coins, sorted by marketcap in asc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      sortBy: "marketcap",
      direction: "asc",
    });
    expect(isSorted(result, "marketcap", "asc")).toBe(true);
    coin = result[0];
  });

  test("check queryCoins retrieve successfully all coins, sorted by marketcap in desc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      sortBy: "marketcap",
      direction: "desc",
    });
    expect(isSorted(result, "marketcap", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by lastReply in desc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      sortBy: "lastReply",
      direction: "desc",
    });
    expect(isSorted(result, "lastReply", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by lastReply in asc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      sortBy: "lastReply",
      direction: "asc",
    });
    expect(isSorted(result, "lastReply", "asc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by creationTime in desc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      sortBy: "creationTime",
      direction: "desc",
    });
    expect(isSorted(result, "creationTime", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by creationTime in asc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      sortBy: "creationTime",
      direction: "asc",
    });
    expect(isSorted(result, "creationTime", "asc")).toBe(true);
  });

  test("check getCoin by coinType is retrieved successfully", async () => {
    const coinService = new CoinAPI(BE_URL);
    const result = await coinService.getCoin(coin.type);
    coinSchema.parse(result);
  });
});
