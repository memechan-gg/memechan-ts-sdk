import { z } from "zod";

export const stakingPoolCreatedSchema = (packageId: string) =>
  z.object({
    type: z.literal("created"),
    sender: z.string().regex(/^0x[0-9a-f]{64}$/),
    owner: z.object({
      Shared: z.any(),
    }),
    objectType: z.string().regex(new RegExp(`${packageId}::[a-zA-Z0-9_]+::[a-zA-Z0-9_<>:,\\s0x\\-a-f]+`), {
      message: "objectType must be in the correct format and contain the correct package identifier",
    }),
    objectId: z.string().regex(/^0x[0-9a-f]{64}$/),
    version: z.string().regex(/^\d+$/),
    digest: z.string(),
  });

export const feeState = z.object({
  fields: z.object({
    fees_meme: z.string(),
    fees_meme_total: z.string(),
    fees_s: z.string(),
    fees_s_total: z.string(),
    stakes_total: z.string(),
    user_withdrawals_x: z.object({
      type: z.literal("0x2::table::Table<address, u64>"),
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
      }),
    }),
    user_withdrawals_y: z.object({
      type: z.literal("0x2::table::Table<address, u64>"),
      fields: z.object({
        id: z.object({
          id: z.string(),
        }),
      }),
    }),
  }),
});

export const stakingPoolFields = z.object({
  amm_pool: z.string(),
  balance_lp: z.string(),
  balance_meme: z.string(),
  fee_state: feeState,
  meme_cap: z.object({
    fields: z.object({
      total_supply: z.object({
        fields: z.object({
          value: z.string(),
        }),
      }),
    }),
  }),
  policy_cap: z.object({
    fields: z.object({
      for: z.string(),
      id: z.object({
        id: z.string(),
      }),
    }),
  }),
  pool_admin: z.object({
    fields: z.object({
      id: z.object({
        id: z.string(),
      }),
    }),
  }),
  vesting_config: z.object({
    fields: z.object({
      cliff_ts: z.string(),
      end_ts: z.string(),
      start_ts: z.string(),
    }),
  }),
  vesting_table: z.object({
    fields: z.object({
      id: z.object({
        id: z.string(),
      }),
      size: z.string(),
    }),
  }),
});

export const vestingDataDynamicFieldSchema = (packageId: string) =>
  z.object({
    type: z.literal("DynamicField"),
    name: z.object({
      type: z.literal("address"),
      value: z.string(),
    }),
    objectType: z.literal(`${packageId}::vesting::VestingData`),
    objectId: z.string(),
  });

export const vestingDataContentObject = (packageId: string) =>
  z.object({
    dataType: z.literal("moveObject"),
    fields: z.object({
      name: z.string(),
      value: z.object({
        type: z.literal(`${packageId}::vesting::VestingData`),
        fields: z.object({
          notional: z.string(),
          released: z.string(),
        }),
      }),
    }),
  });

export const stakingPoolDescribeObjectResponse = z.object({
  dataType: z.literal("moveObject"),
  fields: stakingPoolFields,
});
