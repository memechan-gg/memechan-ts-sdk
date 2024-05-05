import { z, ZodRawShape } from "zod";

export const createThreadRequestBody = z.object({
  message: z.string(),
  coinType: z.string(),
});

export const paginatedResultSchema = <T extends ZodRawShape>(result: z.ZodObject<T>) =>
  z.object({
    paginationToken: z.string().nullish(),
    result: z.array(result),
  });

export const createThreadReplyRequestBody = z.object({
  message: z.string(),
  coinType: z.string(),
  threadId: z.string(),
});

export const queryThreadsParams = z.object({
  coinType: z.string(),
  paginationToken: z.string().nullish(),
});

export const queryThreadRepliesParams = z.object({
  threadId: z.string(),
  paginationToken: z.string().nullish(),
});

export const incrementLikeCounterRequestBody = z.object({
  coinType: z.string(),
  threadId: z.string(),
  replyId: z.string().nullish(),
});

const baseMessageSchema = z.object({
  creator: z.string(),
  message: z.string(),
  id: z.string(),
  coinType: z.string(),
  likeCounter: z.number(),
  creationDate: z.number(),
});

export const threadMessageSchema = baseMessageSchema.extend({
  type: z.literal("THREAD"),
  replyCounter: z.number(),
});

export const threadReplyMessageSchema = baseMessageSchema.extend({
  type: z.literal("REPLY"),
});

const threadsResult = paginatedResultSchema(threadMessageSchema);
const threadRepliesResult = paginatedResultSchema(threadReplyMessageSchema);

export type ThreadReplyMessage = z.infer<typeof threadReplyMessageSchema>;
export type ThreadMessage = z.infer<typeof threadMessageSchema>;
export type CreateThreadRequestBody = z.infer<typeof createThreadRequestBody>;
export type CreateThreadReplyBody = z.infer<typeof createThreadReplyRequestBody>;
export type IncrementLikeCounterRequestBody = z.infer<typeof incrementLikeCounterRequestBody>;
export type ThreadsResult = z.infer<typeof threadsResult>;
export type ThreadRepliesResult = z.infer<typeof threadRepliesResult>;
export type QueryThreadsParams = z.infer<typeof queryThreadsParams>;
export type QueryThreadRepliesParams = z.infer<typeof queryThreadRepliesParams>;
