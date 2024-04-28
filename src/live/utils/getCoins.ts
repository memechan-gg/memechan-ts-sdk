import { CoinStruct, SuiClient } from "@mysten/sui.js/client";

type GetCoinArgs = {
  coin: string;
  address: string;
  provider: SuiClient;
};

/**
 * Retrieves coins for a given coin type and address.
 * @param {GetCoinArgs} params - The parameters for retrieving coins.
 * @param {string} params.coin - The type of coin to retrieve.
 * @param {string} params.address - The address to retrieve coins for.
 * @param {SuiClient} params.provider - The provider to use for retrieving coins.
 * @return {Promise<CoinStruct[]>} Returns a promise that resolves to an array of coin structs.
 */
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
