/* eslint-disable require-jsdoc */
// object.data?.content?.dataType === "moveObject" &&
// typeof object.data?.content?.fields === "object" &&
// object.data?.content?.fields !== null &&
// "policy_cap" in object.data?.content?.fields &&
// object.data?.content?.fields.policy_cap.fields.id.id &&
// object.data?.content?.fields.policy_cap.fields.id.id &&
// object.data?.content?.fields.policy_cap.fields.id.id &&
// object.data?.content?.fields.policy_cap.fields.id.id &&
// object.data?.content?.fields.policy_cap.fields.id.id;

import { SuiObjectResponse } from "@mysten/sui.js/client";
import { StakingPoolTokenPolicyCap } from "../types";
/**
 * Typeguard function to check if the provided object data matches the shape
 *  of detailed info about StakingPoolTokenPolicyCap object data.
 * @param {SuiObjectResponse} objectData - The object data to check.
 * @return {boolean} - Returns true if the object data matches the shape of
 * StakingPoolTokenPolicyCap object data, false otherwise.
 */
export function isStakingPoolTokenPolicyCap(objectData: SuiObjectResponse): objectData is StakingPoolTokenPolicyCap {
  return !!(
    objectData.data &&
    "version" in objectData.data &&
    typeof objectData.data.version === "string" &&
    "objectId" in objectData.data &&
    typeof objectData.data.objectId === "string" &&
    "digest" in objectData.data &&
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
    "policy_cap" in objectData.data.content.fields &&
    objectData.data.content.fields.policy_cap &&
    typeof objectData.data.content.fields.policy_cap === "object" &&
    "fields" in objectData.data.content.fields.policy_cap &&
    objectData.data.content.fields.policy_cap.fields &&
    typeof objectData.data.content.fields.policy_cap.fields === "object" &&
    "id" in objectData.data.content.fields.policy_cap.fields &&
    objectData.data.content.fields.policy_cap.fields.id &&
    typeof objectData.data.content.fields.policy_cap.fields.id === "object" &&
    "id" in objectData.data.content.fields.policy_cap.fields.id &&
    objectData.data.content.fields.policy_cap.fields.id.id &&
    typeof objectData.data.content.fields.policy_cap.fields.id.id === "string"
  );
}
