export type AddLiquidityArgs = {
  signerAddress: string;
  memeCoin: {
    coinType: string;
  };
  memeCoinInput: string;
  suiCoinInput: string;
};

export type RemoveLiquidityArgs = {
  signerAddress: string;
  lpCoinInput: string;
  lpCoin: {
    coinType: string;
  };
};

export type SwapArgs = {
  signerAddress: string;
  memeCoin: {
    coinType: string;
  };
  inputAmount: string;
  SuiToMeme: boolean;
};
