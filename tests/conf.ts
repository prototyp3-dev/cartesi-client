import { JsonRpcProvider } from "@ethersproject/providers";


export const provider = new JsonRpcProvider("http://localhost:8545");
export const dappAddress = "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C".toLowerCase();
export const sunodoToken = "0xae7f61eCf06C65405560166b259C54031428A9C4".toLowerCase();
export const erc721Token = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d".toLowerCase();
export const testTimeout = 60000;