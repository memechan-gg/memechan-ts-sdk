/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import { getFullnodeUrl, SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { normalizeSuiAddress, SUI_DECIMALS, SUI_TYPE_ARG } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { Trade, TradeEventParsedJson } from "./types";

export type ExtractedRegistryKeyData = {
  boundingCurvePackageId: string;
  quotePackageId: string;
  quoteCoinType: string;
  memePackageId: string;
  memeCoinType: string;
};

/**
 * Checks if a transaction has a success status based on the status in the given transaction block response.
 * @param {SuiTransactionBlockResponse} transaction The transaction block response to check.
 * @return {boolean} Returns true if the transaction has a success status, otherwise false.
 */
export function checkIsTransactionHasSuccessStatus(transaction: SuiTransactionBlockResponse): boolean {
  return transaction.effects?.status.status === "success";
}

// yarn tsx examples/bonding-curve/trading/parsers/parsing-swap-transaction.ts
const provider = new SuiClient({ url: getFullnodeUrl("mainnet") });
const MODULE_NAME = "seed_pool";
const buyActionFunctionName = "buy_meme";
const sellActionFunctionName = "sell_meme";
const PACKAGE_ID = "0xc48ce784327427802e1f38145c65b4e5e0a74c53187fca4b9ca0d4ca47da68b1";

export const extractEventDataFromType = (type: string): ExtractedRegistryKeyData => {
  const [seedPoolType, rest] = type.split("<");

  const [packageId, moduleName, structName] = seedPoolType.split("::");
  const normalizedPackageId = normalizeSuiAddress(packageId);

  if (!rest) {
    throw new Error("Invalid type format. Expected '${PACKAGE_ID}::${MODULE_NAME}::${EVENT_STRUCT_NAME}' pattern.");
  }

  const [quoteCoinTypeRaw, memeCoinTypeRaw, swapAmountWithBracket] = rest.split(",");
  const [swapAmountRaw] = swapAmountWithBracket.split(">");

  const quoteCoinType = quoteCoinTypeRaw.trim();
  const memeCoinType = memeCoinTypeRaw.trim();
  const swapAmount = swapAmountRaw.trim();

  if (!quoteCoinType) {
    throw new Error("Invalid typename format. Missing quoteCoinType.");
  }

  if (!memeCoinType) {
    throw new Error("Invalid typename format. Missing memeCoinType.");
  }

  // Sui (quote)
  const quoteCoinTypeParts = quoteCoinType.split("::");
  if (quoteCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid quoteCoinTypeDenormalized format.");
  }
  const normalizedQuoteCoinPackageId = normalizeSuiAddress(quoteCoinTypeParts[0]);
  const normalizedQuoteCoinType = `${normalizedQuoteCoinPackageId}::${quoteCoinTypeParts.slice(1).join("::")}`;

  // Meme (base)
  const memeCoinTypeParts = memeCoinType.split("::");
  if (memeCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid memeCoinType format.");
  }
  const normalizedMemeCoinPackageId = normalizeSuiAddress(memeCoinTypeParts[0]);
  const normalizedMemeCoinType = `${normalizedMemeCoinPackageId}::${memeCoinTypeParts.slice(1).join("::")}`;

  return {
    boundingCurvePackageId: normalizedPackageId,
    quotePackageId: normalizedQuoteCoinPackageId,
    quoteCoinType: normalizedQuoteCoinType,
    memePackageId: normalizedMemeCoinPackageId,
    memeCoinType: normalizedMemeCoinType,
  };
};

export const parsingTradeTransactions = async ({ side }: { side: "buy" | "sell" }) => {
  // Fetches only 50 transactions max
  const { data } = await provider.queryTransactionBlocks({
    filter: {
      MoveFunction: {
        package: PACKAGE_ID,
        module: MODULE_NAME,
        function: side === "buy" ? buyActionFunctionName : sellActionFunctionName,
      },
    },
    options: {
      showEvents: true,
      showBalanceChanges: true,
      showEffects: true,
      showObjectChanges: true,
      showInput: true,
      showRawInput: true,
    },
  });

  const trades: Trade[] = [];
  for (const txData of data) {
    const isSuccessfulTransaction = checkIsTransactionHasSuccessStatus(txData);
    if (!isSuccessfulTransaction) {
      console.log(txData.digest, "isFailedTransaction");
      continue;
    }

    if (!txData.events || txData.events.length === 0) {
      throw new Error(`No events found for such tx: ${txData.digest}`);
    }

    // Relaying on the assumption there is only one event (
    // might be wrong in a case if the transaction itself contain multiple swap with different swaps)
    const eventData = txData.events[0];
    const parsedJson = eventData.parsedJson as TradeEventParsedJson;

    const data = extractEventDataFromType(eventData.type);
    const coinType = data.memeCoinType;
    const coinMetadata = await provider.getCoinMetadata({ coinType });

    if (!coinMetadata) {
      throw new Error(`No coinMetadata found for such event id txDigest ${txData.digest} and coinType ${coinType}`);
    }

    const transactionBlockData = txData;
    const { transaction } = transactionBlockData;

    if (!transaction) {
      throw new Error(`No transaction found for such event id txDigest ${txData.digest}`);
    }

    const timestamp = eventData.timestampMs || transactionBlockData.timestampMs;

    if (!timestamp) {
      throw new Error(`No timestamp found for such transaction ${txData.digest}`);
    }

    let action = undefined;
    if (transaction.data.transaction.kind === "ProgrammableTransaction") {
      const buyAction = transaction.data.transaction.transactions.find(
        (t) => "MoveCall" in t && t.MoveCall.function === buyActionFunctionName,
      );
      const sellAction = transaction.data.transaction.transactions.find(
        (t) => "MoveCall" in t && t.MoveCall.function === sellActionFunctionName,
      );
      if (buyAction) {
        action = "BUY";
      }
      if (sellAction) {
        action = "SELL";
      }
    }

    if (action === undefined) {
      throw new Error(`No action found for such txDigest ${txData.digest} and coinType ${coinType}`);
    }

    const memeCoin = {
      symbol: coinMetadata.symbol,
      coinType,
      decimals: coinMetadata.decimals,
      tradeAmount: parsedJson.swap_amount.amount_out,
      parsedTradeAmount: new BigNumber(parsedJson.swap_amount.amount_out).div(10 ** coinMetadata.decimals).toString(),
    };

    const sui = {
      symbol: "SUI",
      coinType: SUI_TYPE_ARG,
      decimals: SUI_DECIMALS,
      tradeAmount: parsedJson.swap_amount.amount_in,
      parsedTradeAmount: new BigNumber(parsedJson.swap_amount.amount_in).div(10 ** SUI_DECIMALS).toString(),
    };

    trades.push({
      id: txData.digest,
      txId: txData.digest,
      fromAmount: parsedJson.swap_amount.amount_in,
      toAmount: parsedJson.swap_amount.amount_out,
      signer: eventData.sender,
      poolId: parsedJson.pool_address,
      timestampMs: timestamp,
      date: new Date(parseInt(timestamp)),
      pair: {
        fromToken: action === "BUY" ? sui : memeCoin,
        toToken: action === "BUY" ? memeCoin : sui,
      },
    });
  }
  console.log("TRADES", JSON.stringify(trades, null, 2));
};

parsingTradeTransactions({ side: "buy" });
