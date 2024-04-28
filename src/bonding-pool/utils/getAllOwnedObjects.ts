import { GetOwnedObjectsParams, PaginatedObjectsResponse, SuiClient, SuiObjectResponse } from "@mysten/sui.js/client";

/**
 * Retrieves all objects owned from the SuiClient based on provided owner address, respecting limitations.
 * @throws {Error} If any error occurs during the retrieval process.
 * @description
 * The function fetches objects from SuiClient based on the provided owner address.
 * It respects the limitation of `getOwnedObjects` (50 objectIds per request) by
 * splitting the requests into chunks.
 */
export async function getAllOwnedObjects({
  provider,
  options,
}: {
  provider: SuiClient;
  options: GetOwnedObjectsParams;
}) {
  const allOwnedObjects: SuiObjectResponse[] = [];
  let nextCursor: string | undefined | null = null;
  let objects: PaginatedObjectsResponse = await provider.getOwnedObjects(options);

  // Fetching and combining part
  while (objects.hasNextPage) {
    const userObjects: SuiObjectResponse[] = objects.data;
    allOwnedObjects.push(...userObjects);

    nextCursor = objects.nextCursor;
    objects = await provider.getOwnedObjects({
      ...options,
      cursor: nextCursor,
    });
  }

  const userObjects: SuiObjectResponse[] = objects.data;
  allOwnedObjects.push(...userObjects);

  return allOwnedObjects;
}
