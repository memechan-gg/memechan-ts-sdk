import { SuiObjectResponse } from "@mysten/sui.js/client";
import { DetailedPoolInfo } from "../types";

/**
 * Typeguard function to check if the provided object data matches the shape of pool detailed object data.
 * @param {SuiObjectResponse} objectData - The object data to check.
 * @return {boolean} - Returns true if the object data matches the shape
 * of detailed info about pool object data, false otherwise.
 */
export function isPoolDetailedInfo(objectData: SuiObjectResponse): objectData is DetailedPoolInfo {
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
    "fields" in objectData.data.content &&
    typeof objectData.data.content.fields === "object" &&
    objectData.data.content.fields !== null &&
    "accounting" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.accounting === "object" &&
    objectData.data.content.fields.accounting !== null &&
    "type" in objectData.data.content.fields.accounting &&
    typeof objectData.data.content.fields.accounting.type === "string" &&
    "fields" in objectData.data.content.fields.accounting &&
    typeof objectData.data.content.fields.accounting.fields === "object" &&
    objectData.data.content.fields.accounting.fields !== null &&
    "id" in objectData.data.content.fields.accounting.fields &&
    typeof objectData.data.content.fields.accounting.fields.id === "object" &&
    objectData.data.content.fields.accounting.fields.id !== null &&
    "id" in objectData.data.content.fields.accounting.fields.id &&
    typeof objectData.data.content.fields.accounting.fields.id.id === "string" &&
    "size" in objectData.data.content.fields.accounting.fields &&
    typeof objectData.data.content.fields.accounting.fields.size === "string" &&
    "admin_balance_m" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.admin_balance_m === "string" &&
    "admin_balance_s" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.admin_balance_s === "string" &&
    "balance_m" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.balance_m === "string" &&
    "balance_s" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.balance_s === "string" &&
    "fees" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.fees === "object" &&
    objectData.data.content.fields.fees !== null &&
    "type" in objectData.data.content.fields.fees &&
    typeof objectData.data.content.fields.fees.type === "string" &&
    "fields" in objectData.data.content.fields.fees &&
    typeof objectData.data.content.fields.fees.fields === "object" &&
    objectData.data.content.fields.fees.fields !== null &&
    "fee_in_percent" in objectData.data.content.fields.fees.fields &&
    typeof objectData.data.content.fields.fees.fields.fee_in_percent === "string" &&
    "fee_out_percent" in objectData.data.content.fields.fees.fields &&
    typeof objectData.data.content.fields.fees.fields.fee_out_percent === "string" &&
    "id" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.id === "object" &&
    objectData.data.content.fields.id !== null &&
    "id" in objectData.data.content.fields.id &&
    typeof objectData.data.content.fields.id.id === "string" &&
    "launch_balance" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.launch_balance === "string" &&
    "locked" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.locked === "boolean" &&
    "meme_cap" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.meme_cap === "object" &&
    objectData.data.content.fields.meme_cap !== null &&
    "type" in objectData.data.content.fields.meme_cap &&
    typeof objectData.data.content.fields.meme_cap.type === "string" &&
    "fields" in objectData.data.content.fields.meme_cap &&
    typeof objectData.data.content.fields.meme_cap.fields === "object" &&
    objectData.data.content.fields.meme_cap.fields !== null &&
    "id" in objectData.data.content.fields.meme_cap.fields &&
    typeof objectData.data.content.fields.meme_cap.fields.id === "object" &&
    objectData.data.content.fields.meme_cap.fields.id !== null &&
    "id" in objectData.data.content.fields.meme_cap.fields.id &&
    typeof objectData.data.content.fields.meme_cap.fields.id.id === "string" &&
    "total_supply" in objectData.data.content.fields.meme_cap.fields &&
    typeof objectData.data.content.fields.meme_cap.fields.total_supply === "object" &&
    objectData.data.content.fields.meme_cap.fields.total_supply !== null &&
    "type" in objectData.data.content.fields.meme_cap.fields.total_supply &&
    typeof objectData.data.content.fields.meme_cap.fields.total_supply.type === "string" &&
    "fields" in objectData.data.content.fields.meme_cap.fields.total_supply &&
    typeof objectData.data.content.fields.meme_cap.fields.total_supply.fields === "object" &&
    objectData.data.content.fields.meme_cap.fields.total_supply.fields !== null &&
    "value" in objectData.data.content.fields.meme_cap.fields.total_supply.fields &&
    typeof objectData.data.content.fields.meme_cap.fields.total_supply.fields.value === "string" &&
    "params" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.params === "object" &&
    objectData.data.content.fields.params !== null &&
    "type" in objectData.data.content.fields.params &&
    typeof objectData.data.content.fields.params.type === "string" &&
    "fields" in objectData.data.content.fields.params &&
    typeof objectData.data.content.fields.params.fields === "object" &&
    objectData.data.content.fields.params.fields !== null &&
    "alpha_abs" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.alpha_abs === "string" &&
    "beta" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.beta === "string" &&
    "gamma_m" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.gamma_m === "string" &&
    "gamma_s" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.gamma_s === "string" &&
    "omega_m" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.omega_m === "string" &&
    "price_factor" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.price_factor === "string" &&
    "sell_delay_ms" in objectData.data.content.fields.params.fields &&
    typeof objectData.data.content.fields.params.fields.sell_delay_ms === "string" &&
    "policy_cap" in objectData.data.content.fields &&
    typeof objectData.data.content.fields.policy_cap === "object" &&
    objectData.data.content.fields.policy_cap !== null &&
    "type" in objectData.data.content.fields.policy_cap &&
    typeof objectData.data.content.fields.policy_cap.type === "string" &&
    "fields" in objectData.data.content.fields.policy_cap &&
    typeof objectData.data.content.fields.policy_cap.fields === "object" &&
    objectData.data.content.fields.policy_cap.fields !== null &&
    "for" in objectData.data.content.fields.policy_cap.fields &&
    typeof objectData.data.content.fields.policy_cap.fields.for === "string" &&
    "id" in objectData.data.content.fields.policy_cap.fields &&
    typeof objectData.data.content.fields.policy_cap.fields.id === "object" &&
    objectData.data.content.fields.policy_cap.fields.id !== null &&
    "id" in objectData.data.content.fields.policy_cap.fields.id &&
    typeof objectData.data.content.fields.policy_cap.fields.id.id === "string"
  );
}

// eslint-disable-next-line require-jsdoc
export function isPoolDetailedInfoList(
  suiObjectResponseList: SuiObjectResponse[],
): suiObjectResponseList is DetailedPoolInfo[] {
  return suiObjectResponseList.every((el) => isPoolDetailedInfo(el));
}
