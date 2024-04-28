import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth } from "../../src";

const BE_URL = "https://cp1mqp07c3.execute-api.us-east-1.amazonaws.com/prod";

describe("AuthService", () => {
  test("check that the authentication flow is working properly", async () => {
    const keypair = new Ed25519Keypair();
    const authService = new Auth(BE_URL);
    const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
    const { signature } = await keypair.signPersonalMessage(Buffer.from(messageToSign));
    await authService.refreshSession({
      walletAddress: keypair.getPublicKey().toSuiAddress(),
      signedMessage: signature,
    });
  });
});
