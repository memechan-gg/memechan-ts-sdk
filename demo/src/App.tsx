import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { FileUpload } from "./components/FileUpload";
import { useEffect } from "react";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "@avernikoz/memechan-ts-sdk";
import { CreateCoin } from "./components/CreateCoin";
import { BE_URL } from "./constants";

const api = new CoinAPI(BE_URL);

function App() {
  useEffect(() => {
    (async () => {
      await authenticate();
      await getCoins();
    })();
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
      status: "PRESALE",
      sortBy: "marketcap",
      direction: "asc",
    });
    console.log("coins list", coins);
    const coin = await api.getCoin("PRESALE", coins[0].type);
    console.log("coin details", coin);
  };
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Memchan SDK Demo</h1>
      <FileUpload />
      <CreateCoin />
    </>
  );
}

export default App;
