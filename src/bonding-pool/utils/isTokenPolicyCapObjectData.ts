import { SuiObjectResponse } from "@mysten/sui.js/client";
import { TokenPolicyCapObjectData } from "../types";

/**
 * Typeguard function to check if the provided object data matches the shape of token policy cap object data.
 * @param {SuiObjectResponse} objectData - The object data to check.
 * @return {boolean} - Returns true if the object data matches the shape
 * of token policy cap object data, false otherwise.
 */
export function isTokenPolicyCapObjectData(objectData: SuiObjectResponse): objectData is TokenPolicyCapObjectData {
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
    "value" in objectData.data.content.fields &&
    objectData.data.content.fields.value &&
    typeof objectData.data.content.fields.value === "object" &&
    "fields" in objectData.data.content.fields.value &&
    objectData.data.content.fields.value.fields &&
    typeof objectData.data.content.fields.value.fields === "object" &&
    "for" in objectData.data.content.fields.value.fields &&
    typeof objectData.data.content.fields.value.fields.for === "string" &&
    objectData.data.content.fields.value.type &&
    typeof objectData.data.content.fields.value.type === "string" &&
    objectData.data.content.fields.value.type.includes("0x2::token::TokenPolicyCap")
  );
}
