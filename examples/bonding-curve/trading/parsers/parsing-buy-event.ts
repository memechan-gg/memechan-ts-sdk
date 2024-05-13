/* eslint-disable max-len */
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { Trade, TradeEventParsedJson } from "./types";
import { BondingPoolSingleton } from "../../../../src";
import { SUI_TYPE_ARG } from "@mysten/sui.js/utils";

const provider = new SuiClient({ url: getFullnodeUrl("mainnet") });

// yarn tsx examples/bonding-curve/trading/parsers/parsing-buy-event.ts
export const parsingBuyEvent = async () => {
  const { data } = await provider.queryEvents({
    query: {
      MoveEventType:
        "0xc48ce784327427802e1f38145c65b4e5e0a74c53187fca4b9ca0d4ca47da68b1::events::Swap<0x2::sui::SUI, 0x85fe39ef8d50d686a7a6e12716c3ed34c1c4c753a0c11963adf17fc752af69c9::sc::SC, 0xc48ce784327427802e1f38145c65b4e5e0a74c53187fca4b9ca0d4ca47da68b1::seed_pool::SwapAmount>",
    },
  });
  const trades: Trade[] = [];
  const { poolsByPoolId: seedPools } = await BondingPoolSingleton.getInstance(getFullnodeUrl("mainnet")).getAllPools();
  for (const event of data) {
    const parsedJson = event.parsedJson as TradeEventParsedJson;
    const seedPool = seedPools[parsedJson.pool_address];
    const coinType = seedPool.memeCoinType;
    const coinMetadata = await provider.getCoinMetadata({ coinType });
    if (!coinMetadata) continue;
    const { balanceChanges } = await provider.getTransactionBlock({
      digest: event.id.txDigest,
      options: {
        showBalanceChanges: true,
      },
    });
    const suiChanged = balanceChanges?.find((bc) => bc.coinType === SUI_TYPE_ARG);
    const memeCoinChanged = balanceChanges?.find((bc) => bc.coinType === coinType);

    console.log(suiChanged, memeCoinChanged);

    trades.push({
      fromAmount: parsedJson.swap_amount.amount_in,
      toAmount: parsedJson.swap_amount.amount_out,
      signer: event.sender,
      id: parsedJson.pool_address,
      timestamp: event.timestampMs ? new Date(parseInt(event.timestampMs)) : new Date(),
      pair: {
        fromToken: {
          tradeAmount: parsedJson.swap_amount.amount_in,
          decimals: 9,
          symbol: "SUI",
          coinType: SUI_TYPE_ARG,
        },
        toToken: {
          decimals: coinMetadata.decimals,
          symbol: coinMetadata.symbol,
          coinType,
          tradeAmount: parsedJson.swap_amount.amount_out,
        },
      },
    });
  }
};

parsingBuyEvent();
