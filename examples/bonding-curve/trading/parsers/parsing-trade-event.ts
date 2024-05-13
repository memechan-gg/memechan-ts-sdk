/* eslint-disable max-len */
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { Trade, TradeEventParsedJson } from "./types";
import { BondingPoolSingleton } from "../../../../src";
import { SUI_TYPE_ARG } from "@mysten/sui.js/utils";

const provider = new SuiClient({ url: getFullnodeUrl("mainnet") });
const buyActionFunctionName = "buy_meme";
const sellActionFunctionName = "sell_meme";

const coinType = "0x9102bc69d1435288ba4bec1e5df506dafbcb2f6355f2cef9479c4a22bd2268da::test_token_4am::TEST_TOKEN_4AM";
// yarn tsx examples/bonding-curve/trading/parsers/parsing-trade-event.ts
export const parsingTradeEvent = async () => {
  const { data } = await provider.queryEvents({
    query: {
      MoveEventType: `${BondingPoolSingleton.PACKAGE_OBJECT_ID}::events::Swap<0x2::sui::SUI, ${coinType}, ${BondingPoolSingleton.PACKAGE_OBJECT_ID}::seed_pool::SwapAmount>`,
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
    const { transaction } = await provider.getTransactionBlock({
      digest: event.id.txDigest,
      options: {
        showInput: true,
      },
    });
    let action = undefined;
    if (transaction?.data.transaction.kind === "ProgrammableTransaction") {
      const buyAction = transaction?.data.transaction.transactions.find(
        (t) => "MoveCall" in t && t.MoveCall.function === buyActionFunctionName,
      );
      const sellAction = transaction?.data.transaction.transactions.find(
        (t) => "MoveCall" in t && t.MoveCall.function === sellActionFunctionName,
      );
      if (buyAction) {
        action = "BUY";
      }
      if (sellAction) {
        action = "SELL";
      }
    }

    const memeCoin = {
      decimals: coinMetadata.decimals,
      symbol: coinMetadata.symbol,
      coinType,
      tradeAmount: parsedJson.swap_amount.amount_out,
    };

    const sui = {
      tradeAmount: parsedJson.swap_amount.amount_in,
      decimals: 9,
      symbol: "SUI",
      coinType: SUI_TYPE_ARG,
    };
    if (action === undefined) continue;
    trades.push({
      fromAmount: parsedJson.swap_amount.amount_in,
      toAmount: parsedJson.swap_amount.amount_out,
      signer: event.sender,
      id: parsedJson.pool_address,
      timestamp: event.timestampMs ? new Date(parseInt(event.timestampMs)) : new Date(),
      pair: {
        fromToken: action === "BUY" ? sui : memeCoin,
        toToken: action === "BUY" ? memeCoin : sui,
      },
    });
  }
  console.log("TRADES", trades);
};

parsingTradeEvent();
