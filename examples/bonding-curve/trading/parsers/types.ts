interface TokenPairItem {
  decimals: number;
  symbol: string;
  coinType: string;
  tradeAmount: string;
}

export interface TradeEventParsedJson {
  amount_in: string;
  pool_address: string;
  swap_amount: {
    admin_fee_in: string;
    admin_fee_out: string;
    amount_in: string;
    amount_out: string;
  };
}

export interface Trade {
  id: string;
  poolId: string;
  fromAmount: string;
  toAmount: string;
  signer: string;
  timestampMs: string;
  date: Date;
  txId: string;
  pair: {
    fromToken: TokenPairItem;
    toToken: TokenPairItem;
  };
}
