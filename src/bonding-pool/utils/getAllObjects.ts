import { MultiGetObjectsParams, SuiClient, SuiObjectResponse } from "@mysten/sui.js/client";
import { MAX_BATCH_OBJECTS_PER_GET_OBJECT_REQUEST } from "../../common/sui";
import { splitBy } from "../../utils/splitBy";

/**
 * Retrieves objects from the SuiClient based on provided objectIds, respecting limitations.
 * @throws {Error} If any error occurs during the retrieval process.
 * @description
 * The function fetches objects from SuiClient based on the provided objectIds.
 * It respects the limitation of `multiGetObjects` (50 objectIds per request) by
 * splitting the requests into chunks. Additionally, it handles the caveat of
 * duplicate objectIds in the same request by using a Set structure to ensure
 * uniqueness before making the requests.
 */
export async function getAllObjects({
  objectIds,
  provider,
  options,
}: {
  objectIds: string[];
  provider: SuiClient;
  options?: MultiGetObjectsParams["options"];
}): Promise<SuiObjectResponse[]> {
  const allIds = new Set<string>(objectIds);
  const toFetch = Array.from(allIds);
  const chunks = splitBy(toFetch, MAX_BATCH_OBJECTS_PER_GET_OBJECT_REQUEST);

  const result = await Promise.all(
    chunks.map((ids) =>
      provider.multiGetObjects({
        ids,
        options,
      }),
    ),
  );

  const flatResult = result.flat();

  return flatResult;
}
