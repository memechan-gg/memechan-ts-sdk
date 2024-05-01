import { extractRegistryKeyData } from "../../src/bonding-pool/utils/extractRegistryKeyData";

// yarn tsx examples/bonding-curve/extract-registry-key-data.ts
export const extractRegistryKeyDataExample = () => {
  const registryKeyTypenameData =
    // eslint-disable-next-line max-len
    "a06a92a380b04366b5bf54587b89c0d04772e48170ea3c3d0647dac85be038d9::index::RegistryKey<0000000000000000000000000000000000000000000000000000000000000002::sui::SUI,6b98a3246b0e269466f36e7f22dc3a5e856afade41c00a0be7046c762aaf8787::meme_01_05_2024::MEME_01_05_2024>";

  const data = extractRegistryKeyData(registryKeyTypenameData);

  console.debug("data: ", data);
};

extractRegistryKeyDataExample();
