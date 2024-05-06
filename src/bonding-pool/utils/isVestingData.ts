import { SuiObjectResponse } from "@mysten/sui.js/client";
import { VestingDataInfo } from "../types";

/**
 * Typeguard function to check if the provided object data matches
 * the shape of detailed info about VestingData object data.
 * @param {SuiObjectResponse} objectData - The object data to check.
 * @return {boolean} - Returns true if the object data matches the shape of VestingData object data, false otherwise.
 */
export function isVestingDataInfo(objectData: SuiObjectResponse): objectData is VestingDataInfo {
  return !!(
    objectData.data &&
    typeof objectData.data.version === "string" &&
    typeof objectData.data.objectId === "string" &&
    typeof objectData.data.digest === "string" &&
    "content" in objectData.data &&
    objectData.data.content &&
    objectData.data.content.dataType === "moveObject" &&
    "type" in objectData.data.content &&
    typeof objectData.data.content.type === "string" &&
    "hasPublicTransfer" in objectData.data.content &&
    typeof objectData.data.content.hasPublicTransfer === "boolean" &&
    "fields" in objectData.data.content &&
    typeof objectData.data.content.fields === "object" &&
    objectData.data.content.fields !== null &&
    "id" in objectData.data.content.fields &&
    objectData.data.content.fields.id !== null &&
    typeof objectData.data.content.fields.id === "object" &&
    "id" in objectData.data.content.fields.id &&
    typeof objectData.data.content.fields.id.id === "string" &&
    "name" in objectData.data.content.fields &&
    "value" in objectData.data.content.fields &&
    objectData.data.content.fields.value &&
    typeof objectData.data.content.fields.value === "object" &&
    "type" in objectData.data.content.fields.value &&
    objectData.data.content.fields.value.type &&
    typeof objectData.data.content.fields.value.type === "string" &&
    objectData.data.content.fields.value.fields &&
    typeof objectData.data.content.fields.value.fields === "object" &&
    "notional" in objectData.data.content.fields.value.fields &&
    "released" in objectData.data.content.fields.value.fields &&
    typeof objectData.data.content.fields.value.fields.notional === "string" &&
    typeof objectData.data.content.fields.value.fields.released === "string"
  );
}
// eslint-disable-next-line require-jsdoc
export function isVestingDataInfoList(
  suiObjectResponseList: SuiObjectResponse[],
): suiObjectResponseList is VestingDataInfo[] {
  return suiObjectResponseList.every((el) => isVestingDataInfo(el));
}
