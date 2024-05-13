import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "../../src";
import { Coin, coinSchema } from "../../src/coin/schemas/coin-schemas";
import { BE_URL, isSorted } from "./helpers";
// eslint-disable-next-line max-len

describe("CoinService authenticated operations", () => {
  let keypair: Ed25519Keypair;

  beforeAll(async () => {
    keypair = new Ed25519Keypair();
    console.log("Testing with wallet", keypair.getPublicKey().toSuiAddress());
    const authService = new Auth(BE_URL);
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
    /* 
    UNCOMMENT IN CASE YOU WANT TO CREATE A NEW TX, remember to use the SUI_WALLET_SEED_PHRASE env var
    const { digest } = await createCoinAndTicket({
      description: "testtoken4am description",
      name: "testtoken4am",
      signerAddress: user,
      symbol: "TEST_TOKEN_4am",
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8iB11vE7qmEdgHxD7Hnm4_gi6R4KJ9B8nzs_su6iaGg&s",
      decimals: "9",
      fixedSupply: false,
      mintAmount: "9000",
    });
    */

    const { coin } = await coinApi.createCoin({
      txDigest: "Bdkcg4Z2HuUTRkvG5mrCZRya8fxqwPzbHnY3cfD1tTYQ",
      socialLinks: {
        twitter: "mytwitter",
        discord: "mydiscord",
      },
    });
    expect(coin).toEqual({
      image:
        // eslint-disable-next-line max-len
        "https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&dpr=1&w=1000",
      contractAddress: "0xf45c3c4ffb1466384e2b904454c220ab28eca72c7b5d36df57e5e8afc54cab1b",
      creationTime: 1714397293646,
      creator: "0x9a32c41920a66f4919a3d011dac7d45fb79d2629d4c5dce937d550339bbad8e2",
      txDigest: "Bdkcg4Z2HuUTRkvG5mrCZRya8fxqwPzbHnY3cfD1tTYQ",
      status: "PRESALE",
      type: "0xd4c0f2f4a375fd37e57c2e8f6597def5934140bb1f0629af7182c9f30f7da524::test_token_4am::TEST_TOKEN_4AM",
      marketcap: 0,
      lastReply: 0,
      socialLinks: { twitter: "mytwitter", discord: "mydiscord" },
      decimals: 6,
      description: "testtoken4am description",
      icon_url:
        // eslint-disable-next-line max-len
        "https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&dpr=1&w=1000",
      name: "testtoken4am",
      symbol: "TEST_TOKEN_4am",
      coinType: "0xd4c0f2f4a375fd37e57c2e8f6597def5934140bb1f0629af7182c9f30f7da524::test_token_4am::TEST_TOKEN_4AM",
      objectId: "0xf110c32923e77de35505352fcd631a83beb38a1cbe9ab0ba85ac7100c4ee9281",
      objectType:
        // eslint-disable-next-line max-len
        "0x2::coin::Coin<0xd4c0f2f4a375fd37e57c2e8f6597def5934140bb1f0629af7182c9f30f7da524::test_token_4am::TEST_TOKEN_4AM>",
      treasureCapId: "0xf6ea44e563c85b0b2baf4f91805f4b0e14711913cd4d5cc9664fca876d0a1386",
      packageId: "0xf45c3c4ffb1466384e2b904454c220ab28eca72c7b5d36df57e5e8afc54cab1b",
      metadataObjectId: "0xbaab84e4a437b223097cabf43b666e1666d460b9d83506d6281b85ea4e17267b",
    });
  });
});

describe("CoinService unauthenticated operations", () => {
  let coin: Coin;
  test("check queryCoins retrieve successfully all coins, sorted by marketcap in asc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      status: "PRESALE",
      sortBy: "marketcap",
      direction: "asc",
    });
    expect(isSorted(result, "marketcap", "asc")).toBe(true);
    coin = result[0];
  });

  test("check queryCoins retrieve successfully all coins, sorted by marketcap in desc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      status: "PRESALE",
      sortBy: "marketcap",
      direction: "desc",
    });
    expect(isSorted(result, "marketcap", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by lastReply in desc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      status: "PRESALE",
      sortBy: "lastReply",
      direction: "desc",
    });
    expect(isSorted(result, "lastReply", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by lastReply in asc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      status: "PRESALE",
      sortBy: "lastReply",
      direction: "asc",
    });
    expect(isSorted(result, "lastReply", "asc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by creationTime in desc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      status: "PRESALE",
      sortBy: "creationTime",
      direction: "desc",
    });
    expect(isSorted(result, "creationTime", "desc")).toBe(true);
  });

  test("check queryCoins retrieve successfully all coins, sorted by creationTime in asc", async () => {
    const coinService = new CoinAPI(BE_URL);
    const { result } = await coinService.queryCoins({
      status: "PRESALE",
      sortBy: "creationTime",
      direction: "asc",
    });
    expect(isSorted(result, "creationTime", "asc")).toBe(true);
  });

  test("check getCoin on presale by coinType is retrieved successfully", async () => {
    const coinService = new CoinAPI(BE_URL);
    const result = await coinService.getCoin("PRESALE", coin.type);
    coinSchema.parse(result);
  });
});
