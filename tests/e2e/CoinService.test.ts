import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "../../src";
import { Coin, coinSchema } from "../../src/coin/schemas/coin-schemas";
import { isSorted } from "./helpers";

describe("CoinService", () => {
  //let keypair: Ed25519Keypair;
  let coin: Coin;

  beforeAll(async () => {
    /*
    This piece brings the authentication, which currently is not implemented in the APIs, so just comment this out when some apis will require it
    keypair = new Ed25519Keypair();
    console.log("Testing with wallet", keypair.getPublicKey().toSuiAddress());
    const authService = new Auth();
    const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
    const { signature } = await keypair.signPersonalMessage(Buffer.from(messageToSign));
    await authService.refreshSession({
      walletAddress: keypair.getPublicKey().toSuiAddress(),
      signedMessage: signature,
    });
    console.log("Wallet authenticated");*/
  });

  test("check queryCoins retrieve successfully all coins, sorted by marketcap in asc", async () => {
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "marketcap",
      direction: "asc",
    });
    expect(isSorted(result, "marketcap", "asc")).toBe(true);
    coin = result[0];
  });

  test("check queryCoins retrieve successfully all coins, sorted by marketcap in desc", async () => {
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "marketcap",
      direction: "desc",
    });
    expect(isSorted(result, "marketcap", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by lastReply in desc", async () => {
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "lastReply",
      direction: "desc",
    });
    expect(isSorted(result, "lastReply", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by lastReply in asc", async () => {
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "lastReply",
      direction: "asc",
    });
    expect(isSorted(result, "lastReply", "asc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by creationTime in desc", async () => {
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "creationTime",
      direction: "desc",
    });
    expect(isSorted(result, "creationTime", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by creationTime in asc", async () => {
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "creationTime",
      direction: "asc",
    });
    expect(isSorted(result, "creationTime", "asc")).toBe(true);
  });

  test("check getCoin by coinType is retrieved successfully", async () => {
    const coinService = new CoinAPI();
    const result = await coinService.getCoin(coin.type);
    coinSchema.parse(result);
  });
});
