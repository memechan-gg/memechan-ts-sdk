/* eslint-disable require-jsdoc */
import { Auth } from "../auth/Auth";
import { BE_URL } from "../constants";
import { jsonFetch, signedJsonFetch } from "../utils/fetch";
import {
  CreateThreadReplyBody,
  createThreadReplyRequestBody,
  CreateThreadRequestBody,
  createThreadRequestBody,
  incrementLikeCounterRequestBody,
  IncrementLikeCounterRequestBody,
  queryThreadRepliesParams,
  QueryThreadRepliesParams,
  queryThreadsParams,
  QueryThreadsParams,
  ThreadRepliesResult,
  ThreadsResult,
} from "./schemas";

export class SocialAPI {
  constructor(private url = BE_URL) {}

  getThreads(params: QueryThreadsParams): Promise<ThreadsResult> {
    const queryParams = new URLSearchParams(queryThreadsParams.parse(params) as Record<string, string>);
    console.warn("query params", queryParams);
    return jsonFetch(`${this.url}/threads?${queryParams}`, {
      method: "GET",
    });
  }

  getThreadReplies(params: QueryThreadRepliesParams): Promise<ThreadRepliesResult> {
    const queryParams = new URLSearchParams(queryThreadRepliesParams.parse(params) as Record<string, string>);
    return jsonFetch(`${this.url}/replies?${queryParams}`, {
      method: "GET",
    });
  }

  createThread(params: CreateThreadRequestBody): Promise<void> {
    if (!Auth.currentSession) throw new Error("You don't have any active session, please run the Auth.refreshSession");
    return signedJsonFetch(`${this.url}/social/createThread`, Auth.currentSession, {
      method: "POST",
      body: createThreadRequestBody.parse(params),
    });
  }

  createThreadReply(params: CreateThreadReplyBody): Promise<void> {
    if (!Auth.currentSession) throw new Error("You don't have any active session, please run the Auth.refreshSession");
    return signedJsonFetch(`${this.url}/social/createReply`, Auth.currentSession, {
      method: "POST",
      body: createThreadReplyRequestBody.parse(params),
    });
  }

  like(params: IncrementLikeCounterRequestBody): Promise<void> {
    if (!Auth.currentSession) throw new Error("You don't have any active session, please run the Auth.refreshSession");
    return signedJsonFetch(`${this.url}/social/like`, Auth.currentSession, {
      method: "PUT",
      body: incrementLikeCounterRequestBody.parse(params),
    });
  }

  unlike(params: IncrementLikeCounterRequestBody): Promise<void> {
    if (!Auth.currentSession) throw new Error("You don't have any active session, please run the Auth.refreshSession");
    return signedJsonFetch(`${this.url}/social/unlike`, Auth.currentSession, {
      method: "DELETE",
      body: incrementLikeCounterRequestBody.parse(params),
    });
  }
}
