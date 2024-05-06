import { z } from "zod";

export const registrySchemaContent = z.object({
  dataType: z.literal("moveObject"),
  fields: z.object({
    interest_pools: z.object({
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
        size: z.string(),
      }),
    }),
    policies: z.object({
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
        size: z.string(),
      }),
    }),
    seed_pools: z.object({
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
        size: z.string(),
      }),
    }),
    staking_pools: z.object({
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
        size: z.string(),
      }),
    }),
  }),
});
