import { CreateCoinTransactionParams } from "../../coin/types";
import { BondingPoolSingleton } from "../BondingPool";

export const getTicketDataFromCoinParams = (params: CreateCoinTransactionParams) => {
  return {
    ...params,
    description: `${BondingPoolSingleton.TICKET_COIN_DESCRIPTION_PREFIX}${params.name}`,
    name: `${BondingPoolSingleton.TICKET_COIN_NAME_PREFIX}${params.name}`,
    symbol: `${BondingPoolSingleton.TICKET_COIN_MODULE_PREFIX}${params.symbol}`,
  };
};
