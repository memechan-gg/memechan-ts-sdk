import { z } from "zod";

export const interestPoolCreatedSchema = (packageId: string) =>
  z.object({
    type: z.literal("created"),
    sender: z.string().regex(/^0x[0-9a-f]{64}$/),
    owner: z.object({
      Shared: z.any(),
    }),
    objectType: z
      .string()
      .regex(new RegExp(`^${packageId}::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+<${packageId}::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+>$`), {
        message: "objectType must be in the correct format and contain the correct package identifier",
      }),
    objectId: z.string().regex(/^0x[0-9a-f]{64}$/),
    version: z.string().regex(/^\d+$/),
    digest: z.string(),
  });

export const livePoolFields = z.object({
  coins: z.object({
    fields: z.object({
      contents: z.array(
        z.object({
          fields: z.object({
            name: z.string(),
          }),
        }),
      ),
    }),
  }),
  pool_admin_address: z.string(),
});

export const livePoolDescribeObjectResponse = z.object({
  dataType: z.literal("moveObject"),
  fields: livePoolFields,
});
