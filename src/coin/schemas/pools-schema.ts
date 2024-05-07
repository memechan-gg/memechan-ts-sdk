import { z } from "zod";

const PoolObjectDataFieldSchema = z.object({
  name: z.object({
    type: z.literal("0x1::type_name::TypeName"),
    fields: z.object({
      name: z.string(),
    }),
  }),
  value: z.string(),
});

const PoolObjectDataSchema = z.object({
  dataType: z.literal("moveObject"),
  type: z.literal("0x2::dynamic_field::Field<0x1::type_name::TypeName, address>"),
  fields: PoolObjectDataFieldSchema,
});

export const poolSchema = z.object({
  data: z.object({
    content: PoolObjectDataSchema,
  }),
});

export type PoolObjectDataField = z.infer<typeof PoolObjectDataFieldSchema>;

export const querySeedPoolsParams = z.object({
  coinType: z.string().nullish(),
  ticketType: z.string().nullish(),
  paginationToken: z.string().nullish(),
});

export const seedPoolRpcResult = z.object({
  objectId: z.string(),
  typename: z.string(),
  boundingCurvePackageId: z.string(),
  quotePackageId: z.string(),
  memeCoinType: z.string(),
  quoteCoinType: z.string(),
});

export const livePool = z.object({
  poolObjectId: z.string(),
  stateId: z.string(),
  lpCoinType: z.string(),
  isStable: z.boolean(),
  coinType: z.string(),
  poolAdminAddress: z.string(),
  a: z.bigint(),
  futureA: z.bigint(),
  gamma: z.bigint(),
  initialTime: z.bigint(),
  futureGamma: z.bigint(),
  futureTime: z.bigint(),
  adminBalance: z.bigint(),
  balances: z.array(z.bigint()),
  d: z.bigint(),
  lastPriceTimestamp: z.bigint(),
  lpCoinSupply: z.bigint(),
  maxA: z.bigint(),
  minA: z.bigint(),
  nCoins: z.number(),
  virtualPrice: z.bigint(),
  xcpProfit: z.bigint(),
  xcpProfitA: z.bigint(),
  notAdjusted: z.boolean(),
  txDigest: z.string(),
  creationDate: z.number(),
});

export const stakingPool = z.object({
  address: z.string(),
  memeCoinType: z.string(),
  lpCoinType: z.string(),
  totalSupply: z.string(),
  ammPool: z.string(),
  balanceLp: z.string(),
  balanceMeme: z.string(),
  poolAdmin: z.string(),
  creationDate: z.number(),
  txDigest: z.string(),
});

export const seedPool = seedPoolRpcResult.extend({
  associatedCoin: z.string(),
});

export const seedPoolRecord = seedPool.extend({
  pk: z.literal("SEED_POOL"),
  sk: z.string(),
  "lsi-string-0": z.string(),
  "lsi-string-1": z.string(),
});

export type SeedPoolRpcResult = z.infer<typeof seedPoolRpcResult>;

export type SeedPool = z.infer<typeof seedPool>;
export type LivePoolData = z.infer<typeof livePool>;
export type StakingPoolData = z.infer<typeof stakingPool>;

export type QuerySeedPoolsParams = z.infer<typeof querySeedPoolsParams>;
