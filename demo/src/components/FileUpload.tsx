import { Auth, CoinAPI } from "@avernikoz/memechan-ts-sdk";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { useEffect, useState } from "react";

const api = new CoinAPI();

export const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);
  };

  useEffect(() => {
    authenticate();
    getCoins();
  }, []);

  const authenticate = async () => {
    const keypair = new Ed25519Keypair();
    console.log("Testing with wallet", keypair.getPublicKey().toSuiAddress());
    const authService = new Auth();
    const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(messageToSign));
    await authService.refreshSession({
      walletAddress: keypair.getPublicKey().toSuiAddress(),
      signedMessage: signature,
    });
    console.log("Wallet authenticated");
  };

  const getCoins = async () => {
    const { result: coins } = await api.queryCoins({
      sortBy: "marketcap",
      direction: "asc",
    });
    console.log("coins list", coins);
    const coin = await api.getCoin(coins[0].type);
    console.log("coin details", coin);
  };

  const handleUpload = async () => {
    if (file) {
      console.log("Uploading file:", file.name);
      await api.uploadFile(file);
      console.log("File uploaded");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload File
      </button>
      {file && <p>File ready to upload: {file.name}</p>}
    </div>
  );
};
