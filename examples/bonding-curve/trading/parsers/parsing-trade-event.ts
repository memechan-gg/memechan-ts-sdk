/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import {
  DynamicFieldInfo,
  getFullnodeUrl,
  MultiGetObjectsParams,
  SuiClient,
  SuiObjectResponse,
} from "@mysten/sui.js/client";
import { Trade, TradeEventParsedJson } from "./types";
import { normalizeSuiAddress, SUI_DECIMALS, SUI_TYPE_ARG } from "@mysten/sui.js/utils";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bcs } from "@mysten/sui.js/bcs";
import BigNumber from "bignumber.js";

export type ExtractedRegistryKeyData = {
  boundingCurvePackageId: string;
  quotePackageId: string;
  quoteCoinType: string;
  memePackageId: string;
  memeCoinType: string;
};

// yarn tsx examples/bonding-curve/trading/parsers/parsing-trade-event.ts
const provider = new SuiClient({ url: getFullnodeUrl("mainnet") });
const buyActionFunctionName = "buy_meme";
const sellActionFunctionName = "sell_meme";
const coinType = "0x4c023b94ba2e42e5ce1400191d0228216359f4de894150b813b1f514d2668426::rinwif::RINWIF";
const PACKAGE_ID = "0xc48ce784327427802e1f38145c65b4e5e0a74c53187fca4b9ca0d4ca47da68b1";
const REGISTRY_OBJECT_ID = "0x7ee8efddc3355a458dc19e2e32d3dc5a196a87b8019301264491197e2aa15b86";
const SIMULATION_ACCOUNT_ADDRESS = "0xac5bceec1b789ff840d7d4e6ce4ce61c90d190a7f8c4f4ddf0bff6ee2413c33c";

export const extractRegistryKeyData = (typename: string): ExtractedRegistryKeyData => {
  const [packageId, rest] = typename.split("::index::RegistryKey<");
  const normalizedPackageId = normalizeSuiAddress(packageId);

  if (!rest) {
    throw new Error("Invalid typename format. Expected '::index::RegistryKey' pattern.");
  }

  const [quoteCoinType, memeCoinTypeRaw] = rest.split(",");
  const [memeCoinType] = memeCoinTypeRaw.split(">");

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

export const splitBy = <T>(list: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += chunkSize) {
    result.push(list.slice(i, i + chunkSize));
  }

  return result;
};

interface PoolObjectData extends SuiObjectResponse {
  data: {
    type: string;
    version: string;
    objectId: string;
    digest: string;
    content: {
      dataType: "moveObject";
      type: string;
      hasPublicTransfer: boolean;
      fields: {
        id: {
          id: string;
        };
        name: {
          type: string;
          fields: {
            name: string;
          };
        };
        value: string;
      };
    };
  };
}

const getAllObjects = async ({
  objectIds,
  provider,
  options,
}: {
  objectIds: string[];
  provider: SuiClient;
  options?: MultiGetObjectsParams["options"];
}): Promise<SuiObjectResponse[]> => {
  const allIds = new Set<string>(objectIds);
  const toFetch = Array.from(allIds);
  const chunks = splitBy(toFetch, 50);

  const result = await Promise.all(
    chunks.map((ids) =>
      provider.multiGetObjects({
        ids,
        options,
      }),
    ),
  );

  const flatResult = result.flat();

  return flatResult;
};

const seedPools = (txb: TransactionBlock, registry: string) => {
  return txb.moveCall({ target: `${PACKAGE_ID}::index::seed_pools`, arguments: [txb.object(registry)] });
};

const getAllDynamicFields = async ({ parentObjectId, provider }: { parentObjectId: string; provider: SuiClient }) => {
  let hasNextPage = true;
  let cursor: string | null | undefined = null;
  let dynamicFieldInfoList: DynamicFieldInfo[] = [];

  while (hasNextPage) {
    const response = await provider.getDynamicFields({
      parentId: parentObjectId,
      cursor,
      limit: 50,
    });

    const dynamicFieldsList = response.data;
    dynamicFieldInfoList = [...dynamicFieldInfoList, ...dynamicFieldsList];
    hasNextPage = response.hasNextPage;

    if (hasNextPage) {
      const { nextCursor } = response;
      cursor = nextCursor; // Update the request with the nextCursor value
    }
  }

  return dynamicFieldInfoList;
};

const getRegistryTableAddress = async (tx: TransactionBlock) => {
  // Please note, mutation of `tx` happening below
  seedPools(tx, REGISTRY_OBJECT_ID);
  const res = await provider.devInspectTransactionBlock({
    sender: SIMULATION_ACCOUNT_ADDRESS,
    transactionBlock: tx,
  });
  if (!res.results) {
    throw new Error("No results found for all bonding curve pools");
  }
  const returnValues = res.results[0].returnValues;
  if (!returnValues) {
    throw new Error("Return values are undefined");
  }

  const registryTableAddress = returnValues[0][0];
  const decodedTableAddress: string = bcs.de("address", new Uint8Array(registryTableAddress));

  return decodedTableAddress;
};

const isPoolObjectData = (suiObjectResponses: SuiObjectResponse[]): suiObjectResponses is PoolObjectData[] => {
  return suiObjectResponses.every(
    (suiObjectResponse) =>
      suiObjectResponse.data &&
      suiObjectResponse.data.content &&
      typeof suiObjectResponse.data.content === "object" &&
      suiObjectResponse.data.content.dataType === "moveObject" &&
      typeof suiObjectResponse.data.content.type === "string" &&
      suiObjectResponse.data.content.type === "0x2::dynamic_field::Field<0x1::type_name::TypeName, address>" &&
      suiObjectResponse.data.content.fields &&
      typeof suiObjectResponse.data.content.fields === "object" &&
      "name" in suiObjectResponse.data.content.fields &&
      suiObjectResponse.data.content.fields.name &&
      typeof suiObjectResponse.data.content.fields.name === "object" &&
      "type" in suiObjectResponse.data.content.fields.name &&
      suiObjectResponse.data.content.fields.name.type === "0x1::type_name::TypeName" &&
      suiObjectResponse.data.content.fields.name.fields &&
      typeof suiObjectResponse.data.content.fields.name.fields === "object" &&
      "name" in suiObjectResponse.data.content.fields.name.fields &&
      suiObjectResponse.data.content.fields.name.fields.name &&
      typeof suiObjectResponse.data.content.fields.name.fields.name === "string" &&
      "value" in suiObjectResponse.data.content.fields &&
      suiObjectResponse.data.content.fields.value &&
      typeof suiObjectResponse.data.content.fields.value === "string",
  );
};

const getAllSeedPools = async () => {
  const tx = new TransactionBlock();
  const registryTableId = await getRegistryTableAddress(tx);

  const tableDynamicFields = await getAllDynamicFields({
    parentObjectId: registryTableId,
    provider,
  });

  const typenameObjectIdsMap = tableDynamicFields.reduce(
    (acc: { [objectId: string]: { objectId: string; registryKeyType: string } }, el) => {
      acc[el.objectId] = { objectId: el.objectId, registryKeyType: (el.name.value as any).name };
      return acc;
    },
    {},
  );

  const tableTypenameObjectIds = Object.keys(typenameObjectIdsMap);

  const objectDataList = await getAllObjects({
    objectIds: tableTypenameObjectIds,
    provider,
    options: { showContent: true, showDisplay: true },
  });

  if (!isPoolObjectData(objectDataList)) {
    throw new Error("Wrong shape of seed pools of bonding curve pools");
  }

  const pools = objectDataList.map((el) => ({
    objectId: el.data.content.fields.value,
    typename: el.data.content.fields.name.fields.name,
    ...extractRegistryKeyData(el.data.content.fields.name.fields.name),
  }));

  const poolIds = pools.map((el) => el.objectId);

  const poolsByMemeCoinTypeMap = pools.reduce(
    (acc: { [memeCoinType: string]: ExtractedRegistryKeyData & { objectId: string; typename: string } }, el) => {
      acc[el.memeCoinType] = { ...el };

      return acc;
    },
    {},
  );

  const poolsByPoolId = pools.reduce(
    (acc: { [objectId: string]: ExtractedRegistryKeyData & { objectId: string; typename: string } }, el) => {
      acc[el.objectId] = { ...el };

      return acc;
    },
    {},
  );

  return { poolIds, pools, poolsByMemeCoinTypeMap, poolsByPoolId };
};

export const parsingTradeEvent = async () => {
  const { data } = await provider.queryEvents({
    query: {
      MoveEventType: `${PACKAGE_ID}::events::Swap<0x2::sui::SUI, ${coinType}, ${PACKAGE_ID}::seed_pool::SwapAmount>`,
    },
  });

  const trades: Trade[] = [];
  const { poolsByPoolId: seedPools } = await getAllSeedPools();
  for (const event of data) {
    const parsedJson = event.parsedJson as TradeEventParsedJson;
    const seedPool = seedPools[parsedJson.pool_address];
    const coinType = seedPool.memeCoinType;
    const coinMetadata = await provider.getCoinMetadata({ coinType });
    if (!coinMetadata) {
      throw new Error(`No coinMetadata found for such event id txDigest ${event.id.txDigest} and coinType ${coinType}`);
    }

    const transactionBlockData = await provider.getTransactionBlock({
      digest: event.id.txDigest,
      options: {
        showInput: true,
        showBalanceChanges: true,
      },
    });

    const { transaction } = transactionBlockData;

    if (!transaction) {
      throw new Error(`No transaction found for such event id txDigest ${event.id.txDigest}`);
    }

    const timestamp = event.timestampMs || transactionBlockData.timestampMs;

    if (!timestamp) {
      throw new Error(`No timestamp found for such transaction ${event.id.txDigest}`);
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
    if (action === undefined) continue;
    trades.push({
      id: event.id.txDigest,
      txId: event.id.txDigest,
      fromAmount: parsedJson.swap_amount.amount_in,
      toAmount: parsedJson.swap_amount.amount_out,
      signer: event.sender,
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

parsingTradeEvent();
