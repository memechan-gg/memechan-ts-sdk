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

Once that you did this you can perform the upload action exposed by the CoinAPI, which is the only authenticated API the moment, in the future also the create coin will have this protection:

```
    const coinService = new CoinAPI();
    await api.uploadFile(file);
```

Others APIs are in read and are totally public, you can use them like this:

```
    const coinService = new CoinAPI();
    const { result } = await coinService.getCoin('coin-type');
```

```
    const coinService = new CoinAPI();
    const { result } = await coinService.queryCoins({
      sortBy: "marketcap",
      direction: "asc",
    });
```
