import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth } from "../../src";

describe("AuthService", () => {
  test("check that the authentication flow is working properly", async () => {
    const keypair = new Ed25519Keypair();
    const authService = new Auth();
    const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
    const { signature } = await keypair.signPersonalMessage(Buffer.from(messageToSign));
    await authService.refreshSession({
      walletAddress: keypair.getPublicKey().toSuiAddress(),
      signedMessage: signature,
    });
  });
});