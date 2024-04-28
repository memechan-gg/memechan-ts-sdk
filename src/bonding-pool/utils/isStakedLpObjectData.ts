import { SuiObjectResponse } from "@mysten/sui.js/client";
import { StakedLpObjectData } from "../types";

/**
 * Typeguard function to check if the provided object data matches the shape of staked LP object data.
 * @param {SuiObjectResponse} objectData - The object data to check.
 * @return {boolean} - Returns true if the object data matches the shape
 * of staked LP object data, false otherwise.
 */
export function isStakedLpObjectData(objectData: SuiObjectResponse): objectData is StakedLpObjectData {
  return !!(
    objectData.data &&
    objectData.data.type &&
    typeof objectData.data.type === "string" &&
    objectData.data.version &&
    typeof objectData.data.version === "string" &&
    objectData.data.objectId &&
    typeof objectData.data.objectId === "string" &&
    objectData.data.digest &&
    typeof objectData.data.digest === "string" &&
    objectData.data.content &&
    objectData.data.content.dataType === "moveObject" &&
    objectData.data.content.type &&
    typeof objectData.data.content.type === "string" &&
    typeof objectData.data.content.hasPublicTransfer === "boolean" &&
    objectData.data.content.fields &&
    "balance" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.balance === "string" &&
    typeof objectData.data.content.fields.id === "object" &&
    objectData.data.content.fields.id &&
    "id" in objectData.data.content.fields.id &&
    typeof objectData.data.content.fields.id.id === "string" &&
    typeof objectData.data.content.fields.until_timestamp === "string"
  );
}

// eslint-disable-next-line require-jsdoc
export function isStakedLpObjectDataList(
  suiObjectResponseList: SuiObjectResponse[],
): suiObjectResponseList is StakedLpObjectData[] {
  return suiObjectResponseList.every((el) => isStakedLpObjectData(el));
}
