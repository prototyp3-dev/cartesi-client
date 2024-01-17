import { CartesiDApp__factory } from "@cartesi/rollups";
import { Signer, BytesLike } from "ethers";
import { ProofStruct } from "@cartesi/rollups/dist/src/types/contracts/dapp/ICartesiDApp";

export async function validateNoticeFromParams(
    signer:Signer, dappAddress:string,
    payload: BytesLike, proof: ProofStruct
): Promise<boolean> {
    const dappContract = CartesiDApp__factory.connect(dappAddress, signer);
    return dappContract.validateNotice(
        payload, proof);
}