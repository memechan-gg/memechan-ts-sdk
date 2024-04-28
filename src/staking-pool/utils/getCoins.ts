import { CoinStruct, SuiClient } from "@mysten/sui.js/client";

type GetCoinArgs = {
  coin: string;
  address: string;
  provider: SuiClient;
};

export async function getCoins(params: GetCoinArgs) {
  const { coin, address, provider } = params;
  let hasNextPage = true;
  let cursor: string | null | undefined = null;
  let coinStructs: CoinStruct[] = [];

  while (hasNextPage) {
    const response = await provider.getCoins({
      owner: address,
      coinType: coin,
      cursor,
    });

    const coins = response.data;
    coinStructs = [...coinStructs, ...coins];
    hasNextPage = response.hasNextPage;

    if (hasNextPage) {
      const { nextCursor } = response;
      cursor = nextCursor;
    }
  }

  return coinStructs;
}
