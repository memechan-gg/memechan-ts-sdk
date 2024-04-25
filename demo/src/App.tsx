import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { FileUpload } from "./components/FileUpload";
import { useEffect } from "react";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "@avernikoz/memechan-ts-sdk";

const BE_URL = "https://cp1mqp07c3.execute-api.us-east-1.amazonaws.com/prod";

const api = new CoinAPI(BE_URL);

function App() {
  useEffect(() => {
    authenticate();
    getCoins();
    createCoin();
  }, []);

  const createCoin = async () => {
    /* 
    UNCOMMENT IN CASE YOU WANT TO CREATE A NEW TX, remember to use the SUI_WALLET_SEED_PHRASE env var
    const { digest } = await createCoin({
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
    console.log("creating coin");
    const res = await api.createCoin({
      txDigest: "BnEpQ5imAcSX6638cjjiewxtKR1QaKTUtNL35NeFzK1A",
      socialLinks: {
        twitter: "mytwitter",
        discord: "mydiscord",
      },
    });
    console.log("COIN created", res);
  };

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
    </>
  );
}

export default App;
