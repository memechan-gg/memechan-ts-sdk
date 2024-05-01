import { DynamicFieldInfo } from "@mysten/sui.js/client";
import { RegistryTableTypenameDynamicField } from "../types";

const REGISTRY_TYPENAME_PATTERN = new RegExp(
  // eslint-disable-next-line max-len
  "^[a-f0-9]{64}::index::RegistryKey<0000000000000000000000000000000000000000000000000000000000000002::sui::SUI,[a-f0-9]{64}::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+>$",
);

/**
 * Checks if a DynamicFieldInfo object has the specified shape of table typename.
 * @param {DynamicFieldInfo} dynamicFieldInfo - The DynamicFieldInfo object to check.
 * @return {boolean} - Returns true if the object has valid table typename shape, false otherwise.
 */
export function isValidRegistryTableTypenameDynamicField(dynamicFieldInfo: DynamicFieldInfo): boolean {
  return !!(
    dynamicFieldInfo.name &&
    dynamicFieldInfo.name.value &&
    typeof dynamicFieldInfo.name.value === "object" &&
    "name" in dynamicFieldInfo.name.value &&
    typeof dynamicFieldInfo.name.value.name === "string" &&
    REGISTRY_TYPENAME_PATTERN.test(dynamicFieldInfo.name.value.name)
  );
}

/**
 * Checks if the given DynamicFieldInfo array contains objects with valid table typename.
 * @param {DynamicFieldInfo[]} dynamicFieldInfos - Array of DynamicFieldInfo objects to validate.
 * @return {boolean} - Returns true if all objects have valid table typename, false otherwise.
 */
export function isRegistryTableTypenameDynamicFields(
  dynamicFieldInfos: DynamicFieldInfo[],
): dynamicFieldInfos is RegistryTableTypenameDynamicField[] {
  return dynamicFieldInfos.every((el) => isValidRegistryTableTypenameDynamicField(el));
}

/**
 * Filters out DynamicFieldInfo objects that do not have valid table typename.
 * @param {DynamicFieldInfo[]} dynamicFieldInfos - Array of DynamicFieldInfo objects to filter.
 * @return {RegistryTableTypenameDynamicField[]} - Array of DynamicFieldInfo objects with valid table typename.
 */
export function filterValidRegistryTableTypenameDynamicFields(
  dynamicFieldInfos: DynamicFieldInfo[],
): RegistryTableTypenameDynamicField[] {
  const registryTableTypesafeFields = dynamicFieldInfos.filter((el): el is RegistryTableTypenameDynamicField =>
    isValidRegistryTableTypenameDynamicField(el),
  );

  return registryTableTypesafeFields;
}
