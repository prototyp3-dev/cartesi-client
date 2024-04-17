import { JsonRpcProvider } from "@ethersproject/providers";


export const provider = new JsonRpcProvider("http://localhost:8545");
export const dappAddress = "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e".toLowerCase();
export const sunodoToken = "0xf795b3D15D47ac1c61BEf4Cc6469EBb2454C6a9b".toLowerCase();
export const erc721Token = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d".toLowerCase();
export const testTimeout = 60000;