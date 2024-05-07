import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "../../src";
import { SocialAPI } from "../../src/social/SocialAPI";
import { Coin } from "../../src/coin/schemas/coin-schemas";

const BE_URL = "https://14r6b4r6kf.execute-api.us-east-1.amazonaws.com/prod";

describe("Social APIs", () => {
  let keypair: Ed25519Keypair;
  let coin: Coin;

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
    const coinApi = new CoinAPI(BE_URL);
    const { coin: createdCoin } = await coinApi.createCoin({
      txDigest: "Bdkcg4Z2HuUTRkvG5mrCZRya8fxqwPzbHnY3cfD1tTYQ",
      socialLinks: {
        twitter: "mytwitter",
        discord: "mydiscord",
      },
    });
    console.log("Created coin");
    coin = createdCoin;
  });

  test("Social APIs flow", async () => {
    const socialAPI = new SocialAPI(BE_URL);
    await socialAPI.createThread({
      message: "Test message",
      coinType: coin.type,
    });
    const { result } = await socialAPI.getThreads({ coinType: coin.type });
    const thread = result.find((r) => r.creator === keypair.getPublicKey().toSuiAddress());
    expect(thread).toBeTruthy();
  });
});
