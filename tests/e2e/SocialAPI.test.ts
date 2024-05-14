import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Auth, CoinAPI } from "../../src";
import { SocialAPI } from "../../src/social/SocialAPI";
import { Coin } from "../../src/coin/schemas/coin-schemas";
import { BE_URL, isSorted } from "./helpers";

const socialAPI = new SocialAPI(BE_URL);

describe("Threads fetching", () => {
  let coin: Coin | undefined;
  const keypair = new Ed25519Keypair();
  let threadId: string | undefined;

  beforeAll(async () => {
    const authService = new Auth(BE_URL);
    const messageToSign = await authService.requestMessageToSign(keypair.getPublicKey().toSuiAddress());
    const { signature } = await keypair.signPersonalMessage(Buffer.from(messageToSign));
    await authService.refreshSession({
      walletAddress: keypair.getPublicKey().toSuiAddress(),
      signedMessage: signature,
    });
    const coinApi = new CoinAPI();
    const { coin: coinFetched } = await coinApi.createCoin({
      txDigest: "At7GG8M3X73XkA6hqaVoYynge92hm7h1cYTsz3JAhP3G",
      socialLinks: {
        twitter: "mytwitter",
        discord: "mydiscord",
      },
    });
    coin = coinFetched;
    console.log("COIN TYPE", coin?.type);
    for (let i = 0; i < 10; i++) {
      await socialAPI.createThread({
        message: `Test message ${i}`,
        coinType: coin.type,
      });
      const { result } = await socialAPI.getThreads({
        sortBy: "creationTime",
        direction: "desc",
        coinType: coin!.type,
      });
      const nLikes = Math.floor(Math.random() * (5 - 0 + 1)) + 0;
      for (let j = 0; j < nLikes; j++) {
        const alreadyLiked = await socialAPI.getLike({
          threadId: result[0].id,
          creator: keypair.getPublicKey().toSuiAddress(),
        });
        expect(alreadyLiked).toBe(j > 0);
        await socialAPI.like({
          coinType: coin.type,
          threadId: result[0].id,
        });
      }
      await socialAPI.unlike({
        coinType: coin.type,
        threadId: result[0].id,
      });
      const alreadyLiked = await socialAPI.getLike({
        threadId: result[0].id,
        creator: keypair.getPublicKey().toSuiAddress(),
      });
      expect(alreadyLiked).toBe(false);
      const nReplies = Math.floor(Math.random() * (5 - 0 + 1)) + 0;
      for (let j = 0; j < nReplies; j++) {
        await socialAPI.createThreadReply({
          coinType: coin.type,
          threadId: result[0].id,
          message: `Reply ${j}`,
        });
        const reply = await socialAPI.getThreadReplies({
          sortBy: "creationTime",
          direction: "desc",
          threadId: result[0].id,
        });
        const nLikes = Math.floor(Math.random() * (5 - 0 + 1)) + 0;
        for (let l = 0; l < nLikes; l++) {
          await socialAPI.like({
            coinType: coin.type,
            threadId: result[0].id,
            replyId: reply.result[0].id,
          });
        }
      }
    }
  });

  test("check queryThreads retrieve successfully all threads, sorted by creationTime asc", async () => {
    const { result } = await socialAPI.getThreads({
      sortBy: "creationTime",
      direction: "asc",
      coinType: coin!.type,
    });
    expect(isSorted(result, "creationDate", "asc")).toBe(true);
  });

  test("check queryThreads retrieve successfully all threads, sorted by likeCount asc", async () => {
    const { result } = await socialAPI.getThreads({
      sortBy: "likeCount",
      direction: "asc",
      coinType: coin!.type,
    });
    expect(isSorted(result, "likeCounter", "asc")).toBe(true);
  });

  test("check queryThreads retrieve successfully all threads, sorted by replyCounter asc", async () => {
    const { result } = await socialAPI.getThreads({
      sortBy: "replyCount",
      direction: "asc",
      coinType: coin!.type,
    });
    expect(isSorted(result, "replyCounter", "asc")).toBe(true);
  });

  test("check queryThreads retrieve successfully all threads, sorted by creationTime desc", async () => {
    const { result } = await socialAPI.getThreads({
      sortBy: "creationTime",
      direction: "desc",
      coinType: coin!.type,
    });
    expect(isSorted(result, "creationDate", "desc")).toBe(true);
  });

  test("check queryThreads retrieve successfully all threads, sorted by likeCount desc", async () => {
    const { result } = await socialAPI.getThreads({
      sortBy: "likeCount",
      direction: "desc",
      coinType: coin!.type,
    });
    expect(isSorted(result, "likeCounter", "desc")).toBe(true);
  });

  test("check queryThreads retrieve successfully all threads, sorted by replyCounter desc", async () => {
    const { result } = await socialAPI.getThreads({
      sortBy: "replyCount",
      direction: "desc",
      coinType: coin!.type,
    });
    threadId = result[0].id;
    expect(isSorted(result, "replyCounter", "desc")).toBe(true);
  });

  test("check queryThreadsReplies retrieve successfully all threads, sorted by creationTime desc", async () => {
    const { result } = await socialAPI.getThreadReplies({
      sortBy: "creationTime",
      direction: "desc",
      threadId: threadId!,
    });
    expect(isSorted(result, "creationDate", "desc")).toBe(true);
  });

  test("check queryThreadReplies retrieve successfully all threads, sorted by likeCount desc", async () => {
    const { result } = await socialAPI.getThreadReplies({
      sortBy: "likeCount",
      direction: "desc",
      threadId: threadId!,
    });
    expect(isSorted(result, "likeCounter", "desc")).toBe(true);
  });

  test("check queryThreadsReplies retrieve successfully all threads replies, sorted by creationTime asc", async () => {
    const { result } = await socialAPI.getThreadReplies({
      sortBy: "creationTime",
      direction: "asc",
      threadId: threadId!,
    });
    expect(isSorted(result, "creationDate", "asc")).toBe(true);
  });

  test("check queryThreadReplies retrieve successfully all threads replies, sorted by likeCount asc", async () => {
    const { result } = await socialAPI.getThreadReplies({
      sortBy: "likeCount",
      direction: "asc",
      threadId: threadId!,
    });
    expect(isSorted(result, "likeCounter", "asc")).toBe(true);
  });
});
