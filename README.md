# memechan-ts-sdk

Typescript SDK for Memechan.gg

## CoinAPI

### Authentication

The authentication is handled by the module Auth.
Every requests that belongs to the CoinAPI require authentication.
You need to execute a refresh session every time that your credentials will expire.
The credentials returned by the Auth.refreshSession has an expiration of 1h and the CoinAPI will automatically sign the requests.
The only information that you should cache in your application, if you want to prevent that the user has to re-sign every time that the credentials expires (1h), is the signature returned by the wallet.
The signature can be identified as a refresh token and has an expiration of 1 year.

Example:

```
const authService = new Auth();

// Here you need to handle the signPersonalMessage using the API exposes by the chrome extension
const keypair = new Ed25519Keypair();
const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
const { signature } = await keypair.signPersonalMessage(Buffer.from(messageToSign));
// This signature const should be cached.
await authService.refreshSession({
    walletAddress: keypair.getPublicKey().toSuiAddress(),
    signedMessage: signature,
});
```

Once that you did this you can perform any actions exposed by the CoinAPI, such as:

```
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "marketcap",
      direction: "asc",
    });
```

```
    const coinService = new CoinAPI();
    const { result } = await coinService.getCoin('coin-type');
```
