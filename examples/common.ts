import "dotenv/config";

import { ExecuteTransactionBlockParams, SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { normalizeMnemonic } from "./utils/normalizeMnemonic";
import { hexStringToUint8Array } from "./utils/hexStringToUint8Array";

export const DEFAULT_GAS_BUDGET = 50_000_000;

if (!process.env.SUI_WALLET_SEED_PHRASE?.length && !process.env.SUI_WALLET_PRIVATE_KEY_ARRAY?.length) {
  throw new Error("Empty mnemonic or private key");
}

export const mnemonic = normalizeMnemonic(process.env.SUI_WALLET_SEED_PHRASE ?? "");

export const keypair = process.env.SUI_WALLET_PRIVATE_KEY_ARRAY
  ? Ed25519Keypair.fromSecretKey(hexStringToUint8Array(process.env.SUI_WALLET_PRIVATE_KEY_ARRAY))
  : Ed25519Keypair.deriveKeypair(mnemonic);

export const suiProviderUrl = "https://sui-rpc.publicnode.com";
export const provider = new SuiClient({ url: suiProviderUrl });

export const user = keypair.getPublicKey().toSuiAddress();

export const signAndExecuteTransaction = async (
  transactionBlock: TransactionBlock,
  signer: Ed25519Keypair,
  input: Omit<ExecuteTransactionBlockParams, "transactionBlock" | "signature"> = { options: { showEffects: true } },
  gasBudget: number = DEFAULT_GAS_BUDGET,
): Promise<SuiTransactionBlockResponse> => {
  transactionBlock.setGasBudget(gasBudget);

  const transactionResponse: SuiTransactionBlockResponse = await provider.signAndExecuteTransactionBlock({
    transactionBlock,
    signer,
    ...input,
  });

  return transactionResponse;
};
