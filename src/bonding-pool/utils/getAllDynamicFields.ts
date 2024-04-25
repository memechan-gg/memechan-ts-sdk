import { DynamicFieldInfo, SuiClient } from "@mysten/sui.js/client";
import { MAX_PAGINATION_LIMIT_FOR_DYNAMIC_FIELDS_REQUST } from "../../common/sui";

export const getAllDynamicFields = async ({ tableId, provider }: { tableId: string; provider: SuiClient }) => {
  let hasNextPage = true;
  let cursor: string | null | undefined = null;
  let dynamicFieldInfoList: DynamicFieldInfo[] = [];

  while (hasNextPage) {
    const response = await provider.getDynamicFields({
      parentId: tableId,
      cursor,
      limit: MAX_PAGINATION_LIMIT_FOR_DYNAMIC_FIELDS_REQUST,
    });

    const dynamicFieldsList = response.data;
    dynamicFieldInfoList = [...dynamicFieldInfoList, ...dynamicFieldsList];
    hasNextPage = response.hasNextPage;

    if (hasNextPage) {
      const { nextCursor } = response;
      cursor = nextCursor; // Update the request with the nextCursor value
    }
  }

  return dynamicFieldInfoList;
};
