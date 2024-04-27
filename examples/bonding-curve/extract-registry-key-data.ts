import { extractRegistryKeyData } from "../../src/bonding-pool/utils/extractRegistryKeyData";

// yarn tsx examples/bonding-curve/extract-registry-key-data.ts
export const extractRegistryKeyDataExample = () => {
  const registryKeyTypenameData =
    // eslint-disable-next-line max-len
    "9e1701ec8d7942a79874a40d4d5c9d94c45ffd141c9cd2cff4f4fc3820329b61::index::RegistryKey<a4f0b25689b64b5c169d18bd7f57b24ce65a2c737744709b4e44b01e7247760b::ticket_test_token_4am::TICKET_TEST_TOKEN_4AM,0000000000000000000000000000000000000000000000000000000000000002::sui::SUI,5055576faed90f8f32db5d88cb286036ce6df5b77f1edb8544ec11b0f3da4370::test_token_4am::TEST_TOKEN_4AM>";

  const data = extractRegistryKeyData(registryKeyTypenameData);

  console.debug("data: ", data);
};

extractRegistryKeyDataExample();
