// https://github.com/interest-protocol/sui-coins/blob/main/views/create-token/create-token.types.ts

export interface ICreateTokenForm {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals?: number | undefined;
  imageUrl?: string | undefined;
  description: string;
  fixedSupply: NonNullable<boolean | undefined>;
}
