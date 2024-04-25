import { SuiObjectResponse } from "@mysten/sui.js/client";
import { PoolObjectData } from "../types";

/**
 * Checks if the given SuiObjectResponse array contains objects with valid pool typename.
 * @param {SuiObjectResponse[]} suiObjectResponses - Array of SuiObjectResponse objects to validate.
 * @return {boolean} - Returns true if all objects have valid pool typename, false otherwise.
 */
export function isPoolObjectData(suiObjectResponses: SuiObjectResponse[]): suiObjectResponses is PoolObjectData[] {
  return suiObjectResponses.every(
    (suiObjectResponse) =>
      suiObjectResponse.data &&
      suiObjectResponse.data.content &&
      typeof suiObjectResponse.data.content === "object" &&
      suiObjectResponse.data.content.dataType === "moveObject" &&
      typeof suiObjectResponse.data.content.type === "string" &&
      suiObjectResponse.data.content.type === "0x2::dynamic_field::Field<0x1::type_name::TypeName, address>" &&
      suiObjectResponse.data.content.fields &&
      typeof suiObjectResponse.data.content.fields === "object" &&
      "name" in suiObjectResponse.data.content.fields &&
      suiObjectResponse.data.content.fields.name &&
      typeof suiObjectResponse.data.content.fields.name === "object" &&
      "type" in suiObjectResponse.data.content.fields.name &&
      suiObjectResponse.data.content.fields.name.type === "0x1::type_name::TypeName" &&
      suiObjectResponse.data.content.fields.name.fields &&
      typeof suiObjectResponse.data.content.fields.name.fields === "object" &&
      "name" in suiObjectResponse.data.content.fields.name.fields &&
      suiObjectResponse.data.content.fields.name.fields.name &&
      typeof suiObjectResponse.data.content.fields.name.fields.name === "string" &&
      "value" in suiObjectResponse.data.content.fields &&
      suiObjectResponse.data.content.fields.value &&
      typeof suiObjectResponse.data.content.fields.value === "string",
  );
}
