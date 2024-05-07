import { LiveCLMM } from "../../src";
import { provider } from "../common";

// yarn tsx examples/live/get-live-pools-from-registry.ts
export const getLivePoolsFromRegistry = async () => {
  const livePools = await LiveCLMM.fromRegistry({ provider });
  console.debug("livePools:", livePools);
};

getLivePoolsFromRegistry();
