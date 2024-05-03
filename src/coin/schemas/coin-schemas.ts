import { z, ZodRawShape } from "zod";

export const paginatedResultSchema = <T extends ZodRawShape>(result: z.ZodObject<T>) =>
  z.object({
    paginationToken: z.string().nullish(),
    result: z.array(result),
  });

export const coinsSortableColumns = z.literal("marketcap").or(z.literal("creationTime")).or(z.literal("lastReply"));

export const socialLinks = z.object({
  twitter: z.string().nullish(),
  discord: z.string().nullish(),
});

export const createCoinRequestBodySchema = z.object({
  txDigest: z.string(),
  socialLinks: socialLinks.nullish(),
});

export const coinStatus = z.literal("LIVE").or(z.literal("PRESALE"));

export const coinSchema = z.object({
  name: z.string(),
  type: z.string(),
  decimals: z.number(),
  symbol: z.string(),
  objectId: z.string(),
  treasureCapId: z.string(),
  objectType: z.string(),
  description: z.string(),
  image: z.string(),
  metadataObjectId: z.string(),
  lastReply: z.number(),
  marketcap: z.number(),
  creator: z.string(),
  status: coinStatus,
  socialLinks: socialLinks.nullish(),
  txDigest: z.string(),
  creationTime: z.number(),
  contractAddress: z.string().nullish(),
});

export const queryCoinsRequestParamsSchema = z.object({
  sortBy: coinsSortableColumns,
  status: coinStatus,
  direction: z.literal("asc").or(z.literal("desc")),
  paginationToken: z.string().nullish(),
});

export type Coin = z.infer<typeof coinSchema>;
export type PaginatedResult<T extends ZodRawShape> = z.infer<ReturnType<typeof paginatedResultSchema<T>>>;
export type SortableColumn = z.infer<typeof coinsSortableColumns>;
export type QueryCoinsRequestParams = z.infer<typeof queryCoinsRequestParamsSchema>;
export type CreateCoinRequestBody = z.infer<typeof createCoinRequestBodySchema>;
export type CoinStatus = z.infer<typeof coinStatus>;
