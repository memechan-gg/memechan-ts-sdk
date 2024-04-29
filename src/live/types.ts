export type AddLiquidityArgs = {
  signerAddress: string;
  memeCoin: {
    coinType: string;
  };
  memeCoinInput: string;
  suiCoinInput: string;
  minOutputAmount: string;
  slippagePercentage: number;
};

export type QuoteAddLiquidityArgs = {
  memeCoinInput: string;
  suiCoinInput: string;
};

export type RemoveLiquidityArgs = {
  signerAddress: string;
  lpCoinInput: string;
  lpCoin: {
    coinType: string;
  };
  minAmounts: {
    suiCoin: string;
    memeCoin: string;
  };
  slippagePercentage: number;
};

export type QuoteRemoveLiquidityArgs = {
  lpCoinInput: string;
};

export type SwapArgs = {
  signerAddress: string;
  memeCoin: {
    coinType: string;
  };
  inputAmount: string;
  SuiToMeme: boolean;
  minOutputAmount: string;
  slippagePercentage: number;
};

export type QuoteSwapArgs = {
  inputAmount: string;
  SuiToMeme: boolean;
  memeCoin: {
    coinType: string;
  };
};
