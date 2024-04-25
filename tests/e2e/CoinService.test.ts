import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "../../src";
import { Coin, coinSchema } from "../../src/coin/schemas/coin-schemas";
import { isSorted } from "./helpers";
// eslint-disable-next-line max-len

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

    const { ticket, coin } = await coinApi.createCoin({
      txDigest: "BnEpQ5imAcSX6638cjjiewxtKR1QaKTUtNL35NeFzK1A",
      socialLinks: {
        twitter: "mytwitter",
        discord: "mydiscord",
      },
    });
    expect(ticket).toEqual({
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8iB11vE7qmEdgHxD7Hnm4_gi6R4KJ9B8nzs_su6iaGg&s",
      contractAddress: "0x86b4a77d4f19a703bf23e9a68743684ed69a1dfb43412cbee55f0308ed986657",
      creationTime: 1714056680328,
      associatedCoin:
        "0xd847d01c74caf23c46352927c7023dad07e78e12da60376a779b2cb0642cfd56::test_token_4am::TEST_TOKEN_4AM",
      creator: "0x86e3289eada655152a41cb1045c0b26b3ed981eee9529fcdebda70f2c511595a",
      txDigest: "BnEpQ5imAcSX6638cjjiewxtKR1QaKTUtNL35NeFzK1A",
      // eslint-disable-next-line max-len
      type: "0x86b4a77d4f19a703bf23e9a68743684ed69a1dfb43412cbee55f0308ed986657::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
      socialLinks: { twitter: "mytwitter", discord: "mydiscord" },
      decimals: 6,
      description: "Pre sale ticket of bonding curve pool for the following memecoin: testtoken4am",
      icon_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8iB11vE7qmEdgHxD7Hnm4_gi6R4KJ9B8nzs_su6iaGg&s",
      name: "TicketFortesttoken4am",
      symbol: "ac_b_TEST_TOKEN_4am",
      coinType:
        "0x86b4a77d4f19a703bf23e9a68743684ed69a1dfb43412cbee55f0308ed986657::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
      objectId: "0xaa497abcf74c69e5f2468684067ed6a053f114075bd5a4dcf719b0421973fc13",
      objectType:
        // eslint-disable-next-line max-len
        "0x2::coin::Coin<0x86b4a77d4f19a703bf23e9a68743684ed69a1dfb43412cbee55f0308ed986657::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM>",
      treasureCapId: "0xddc80c19ec40d5382b895730e61d420ab8f4f964a28b7922ceae65113259751e",
      packageId: "0x86b4a77d4f19a703bf23e9a68743684ed69a1dfb43412cbee55f0308ed986657",
      metadataObjectId: "0x092b7e50972e8c855d2c72d15c84bd4b8982312603bfc4647296c815b9100e3c",
    });
    expect(coin).toEqual({
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8iB11vE7qmEdgHxD7Hnm4_gi6R4KJ9B8nzs_su6iaGg&s",
      contractAddress: "0xd847d01c74caf23c46352927c7023dad07e78e12da60376a779b2cb0642cfd56",
      creationTime: 1714056680328,
      creator: "0x86e3289eada655152a41cb1045c0b26b3ed981eee9529fcdebda70f2c511595a",
      txDigest: "BnEpQ5imAcSX6638cjjiewxtKR1QaKTUtNL35NeFzK1A",
      status: "PRESALE",
      type: "0xd847d01c74caf23c46352927c7023dad07e78e12da60376a779b2cb0642cfd56::test_token_4am::TEST_TOKEN_4AM",
      marketcap: 0,
      lastReply: 0,
      socialLinks: { twitter: "mytwitter", discord: "mydiscord" },
      decimals: 6,
      description: "testtoken4am description",
      icon_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8iB11vE7qmEdgHxD7Hnm4_gi6R4KJ9B8nzs_su6iaGg&s",
      name: "testtoken4am",
      symbol: "TEST_TOKEN_4am",
      coinType: "0xd847d01c74caf23c46352927c7023dad07e78e12da60376a779b2cb0642cfd56::test_token_4am::TEST_TOKEN_4AM",
      objectId: "0x0faba95e0786296b71397f3aeb57e34bffa118a66d3815c1a3fd9799706e746c",
      objectType:
        // eslint-disable-next-line max-len
        "0x2::coin::Coin<0xd847d01c74caf23c46352927c7023dad07e78e12da60376a779b2cb0642cfd56::test_token_4am::TEST_TOKEN_4AM>",
      treasureCapId: "0x1e518d9be81062825789a2f2bb52a23de163836ebc55d997023aa286641b41a8",
      packageId: "0xd847d01c74caf23c46352927c7023dad07e78e12da60376a779b2cb0642cfd56",
      metadataObjectId: "0x59f9d521ce91646fc4e353c7bd1aa4af9e82a3e9e5be994b2e104504fd7279bd",
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
