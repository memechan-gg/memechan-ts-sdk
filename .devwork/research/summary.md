# Research Summary

## Prompt
# PR #49: Feature/collect fees script

## Diff
```diff
diff --git a/examples/staking-pool/collect-fees-intervally.ts b/examples/staking-pool/collect-fees-intervally.ts
new file mode 100644
index 0000000..5dac89b
--- /dev/null
+++ b/examples/staking-pool/collect-fees-intervally.ts
@@ -0,0 +1,63 @@
+/* eslint-disable require-jsdoc */
+import { BondingPoolSingleton, LiveCLMM, StakingPool } from "../../src";
+import { getQueriedTransactions } from "../../src/utils/getQueriedTransactions";
+import { keypair, provider, signAndExecuteTransaction } from "../common";
+import { sleep } from "../utils/sleep";
+
+// yarn tsx examples/staking-pool/collect-fees-intervally.ts > log.txt 2>&1
+export async function collectFeesIntervally() {
+  let isCollectingCurrently = false;
+  const interval = 1000 * 60 * 15; // 15 mins
+
+  await collectAllFees();
+
+  setInterval(async () => {
+    if (isCollectingCurrently) {
+      return;
+    }
+    isCollectingCurrently = true;
+
+    await collectAllFees();
+
+    isCollectingCurrently = false;
+  }, interval);
+}
+
+export async function collectAllFees() {
+  const transactions = await getQueriedTransactions({
+    provider,
+    options: {
+      filter: {
+        MoveFunction: { package: BondingPoolSingleton.PACKAGE_OBJECT_ID, module: "go_live", function: "go_live" },
+      },
+    },
+  });
+  console.debug("transactions:", transactions);
+
+  for (const txDigest of transactions) {
+    const stakingPool = await StakingPool.fromGoLiveDefaultTx({
+      txDigest,
+      provider,
+    });
+
+    const interestPoolInstance = await LiveCLMM.fromGoLiveDefaultTx({
+      txDigest,
+      provider,
+    });
+
+    const interestPool = await interestPoolInstance.getPool();
+
+    const { tx } = stakingPool.collectFees({
+      clmmPool: interestPool.poolObjectId,
+      stakingPool: stakingPool.data.address,
+    });
+
+    // const res = await provider.devInspectTransactionBlock({ transactionBlock: tx, sender: user });
+    const res = await signAndExecuteTransaction(tx, keypair);
+    console.debug("transaction status:", res.effects?.status);
+
+    await sleep(1000);
+  }
+}
+
+collectFeesIntervally();
diff --git a/src/utils/getQueriedTransactions.ts b/src/utils/getQueriedTransactions.ts
new file mode 100644
index 0000000..eadab58
--- /dev/null
+++ b/src/utils/getQueriedTransactions.ts
@@ -0,0 +1,31 @@
+import { QueryTransactionBlocksParams, SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/client";
+
+/* eslint-disable require-jsdoc */
+export async function getQueriedTransactions({
+  provider,
+  options,
+}: {
+  provider: SuiClient;
+  options: QueryTransactionBlocksParams;
+}): Promise<string[]> {
+  const allTransactions: string[] = [];
+  let nextCursor: string | undefined | null = null;
+  let transactions = await provider.queryTransactionBlocks(options);
+
+  // Fetching and combining part
+  while (transactions.hasNextPage) {
+    const userTransactions: SuiTransactionBlockResponse[] = transactions.data;
+    allTransactions.push(...userTransactions.map((transaction) => transaction.digest));
+
+    nextCursor = transactions.nextCursor;
+    transactions = await provider.queryTransactionBlocks({
+      ...options,
+      cursor: nextCursor,
+    });
+  }
+
+  const userTransactions: SuiTransactionBlockResponse[] = transactions.data;
+  allTransactions.push(...userTransactions.map((transaction) => transaction.digest));
+
+  return allTransactions;
+}
```

## Task
Review and improve the changes in this PR based on the diff.


## Findings
## Research Summary: PR #49 - Feature/collect fees script

### 1. Package Versions
- **SDK Name**: `@avernikoz/memechan-ts-sdk` v1.1.54
- **Key Dependencies**:
  - `@mysten/sui.js`: `^0.51.2` (Sui blockchain SDK)
  - `@interest-protocol/clamm-sdk`: `5.1.0-alpha` (CLMM for liquidity)
  - `bignumber.js`: `^9.1.2`
  - `zod`: `^3.23.0`
- **Node Version**: v20

### 2. Project Structure
```
/src
  ├── bonding-pool/BondingPool.ts   # Contains BondingPoolSingleton class
  ├── staking-pool/StakingPool.ts    # StakingPool class
  ├── live/LiveCLMM.ts              # LiveCLMM class
  └── utils/getQueriedTransactions.ts  # Already exists!
/examples
  ├── common.ts                     # Common utilities (keypair, provider, signAndExecuteTransaction)
  ├── utils/sleep.ts                # Sleep utility
  └── staking-pool/                 # Contains existing fee collection examples
```

### 3. Import Paths (from the diff - what SHOULD be used)
- `BondingPoolSingleton` - from `"../../src"` (actually from `./bonding-pool/BondingPool`)
- `LiveCLMM` - from `"../../src"` (actually from `./live/LiveCLMM`)
- `StakingPool` - from `"../../src"` (actually from `./staking-pool/StakingPool`)
- `getQueriedTransactions` - from `"../../src/utils/getQueriedTransactions"`
- `signAndExecuteTransaction` - from `"../common"`
- `sleep` - from `"../utils/sleep"`

### 4. Key Findings and Issues

#### Issue 1: getQueriedTransactions.ts already exists
The diff adds `src/utils/getQueriedTransactions.ts`, but this file **already exists** in the codebase with the exact same content. The PR appears to be adding a duplicate or the file was already added in a previous commit.

#### Issue 2: BondingPoolSingleton is not exported from src/index.ts
The example imports `BondingPoolSingleton` from `../../src`, but checking `src/index.ts`, it's **NOT exported** from the main SDK. The class exists in `src/bonding-pool/BondingPool.ts` but needs to be explicitly imported from there or added to exports.

#### Issue 3: Import path issue in the example
The diff shows imports like:
```typescript
import { BondingPoolSingleton, LiveCLMM, StakingPool } from "../../src";
```

But looking at `src/index.ts`, `BondingPoolSingleton` is NOT exported. The imports may fail or require:
```typescript
import { BondingPoolSingleton } from "../../src/bonding-pool/BondingPool";
import { LiveCLMM } from "../../src/live/LiveCLMM";
import { StakingPool } from "../../src/staking-pool/StakingPool";
```

#### Issue 4: API Reference for Sui Client
The utility uses `@mysten/sui.js` client API:
- `provider.queryTransactionBlocks(options)` - returns paginated results
- `transactions.hasNextPage` - boolean for pagination
- `transactions.nextCursor` - cursor for next page
- `transactions.data` - array of `SuiTransactionBlockResponse`

### 5. API Usage Pattern
The example correctly uses the Sui client's query API:
```typescript
await provider.queryTransactionBlocks({
  filter: {
    MoveFunction: { package: BondingPoolSingleton.PACKAGE_OBJECT_ID, module: "go_live", function: "go_live" },
  },
});
```

### 6. Recommendations for PR Improvement

1. **Remove duplicate utility file**: The `src/utils/getQueriedTransactions.ts` already exists - no need to add it again
2. **Fix BondingPoolSingleton import**: Either add `BondingPoolSingleton` to `src/index.ts` exports, or change imports to point to the correct file
3. **Consider exporting the utility**: If `getQueriedTransactions` is meant to be part of the public API, add it to `src/index.ts`
4. **Error handling**: Add try-catch around the transaction execution in case of failures
5. **Logging improvement**: Currently uses `console.debug` - consider using a proper logger for production code
