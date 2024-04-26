import { DynamicFieldInfo, SuiClient } from "@mysten/sui.js/client";
import { MAX_PAGINATION_LIMIT_FOR_DYNAMIC_FIELDS_REQUST } from "../../common/sui";

export const getAllDynamicFields = async ({
  parentObjectId,
  provider,
}: {
  parentObjectId: string;
  provider: SuiClient;
}) => {
  let hasNextPage = true;
  let cursor: string | null | undefined = null;
  let dynamicFieldInfoList: DynamicFieldInfo[] = [];

  while (hasNextPage) {
    const response = await provider.getDynamicFields({
      parentId: parentObjectId,
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
