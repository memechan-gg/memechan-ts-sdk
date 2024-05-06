import { PriceApiResponse } from "../types";

export const isValidPriceApiResponse = (response: unknown): response is PriceApiResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    typeof response.data === "object" &&
    response.data !== null &&
    "chainId" in response.data &&
    typeof response.data.chainId === "string" &&
    "tokenAddress" in response.data &&
    typeof response.data.tokenAddress === "string" &&
    "price" in response.data &&
    typeof response.data.price === "number" &&
    "fecthedFrom" in response.data &&
    typeof response.data.fecthedFrom === "string"
  );
};
