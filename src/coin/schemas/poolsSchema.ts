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
  boundingCurvePoolType: z.string(),
  ticketPackageId: z.string(),
  ticketCoinType: z.string(),
  quotePackageId: z.string(),
  quoteCoinType: z.string(),
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

export type QuerySeedPoolsParams = z.infer<typeof querySeedPoolsParams>;
