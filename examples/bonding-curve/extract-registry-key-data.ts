import { extractRegistryKeyData } from "../../src/bonding-pool/utils/extractRegistryKeyData";

// yarn tsx examples/bonding-curve/extract-registry-key-data.ts
export const extractRegistryKeyDataExample = () => {
  const registryKeyTypenameData =
    // eslint-disable-next-line max-len
    "8f9a0538e30a67e900fe0db14ed6845b72e1f89378f204c2f3ba5b25eadc7fd1::index::RegistryKey<8f9a0538e30a67e900fe0db14ed6845b72e1f89378f204c2f3ba5b25eadc7fd1::curves::Bound,d213f1c1871239fbd154e303f68c6ccd135a8c0673f612d605242d4edc275614::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM,0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>";

  const data = extractRegistryKeyData(registryKeyTypenameData);

  console.debug("data: ", data);
};

extractRegistryKeyDataExample();
