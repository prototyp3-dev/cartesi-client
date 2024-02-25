import { Voucher } from "@/generated/graphql";
import { PartialVoucher, getVoucher, getVouchers } from "../graphql/vouchers";
import { CartesiDApp__factory } from "@cartesi/rollups";
import { Signer, ContractReceipt, BytesLike, BigNumberish } from "ethers";
import { Provider } from "@ethersproject/providers";
import { DEFAULT_CARTESI_NODE_URL } from "@/shared/default";
import { ProofStruct } from "@cartesi/rollups/dist/src/types/contracts/dapp/ICartesiDApp";


export async function getUnexecutedVouchers(
    signerOrProvider:Signer|Provider, dappAddress:string, cartesiNodeUrl?:string
):Promise<PartialVoucher[]> {
    if (cartesiNodeUrl === undefined) {
        cartesiNodeUrl = DEFAULT_CARTESI_NODE_URL;
    }
    const voucher_list = await getVouchers(`${cartesiNodeUrl}/graphql`);
    let result:PartialVoucher[] = [];

    const dappContract = CartesiDApp__factory.connect(dappAddress, signerOrProvider);

    for (let i = 0; i < voucher_list.length; i++) {
        const voucher = voucher_list[i];

        const wasIt = await dappContract.wasVoucherExecuted(voucher.input.index, voucher.index);
        if (!wasIt) result.push(voucher);
    }

    return result;
}

export async function getVouchersReady(
    signerOrProvider:Signer|Provider, dappAddress:string, cartesiNodeUrl?:string
):Promise<Voucher[]> {
    if (cartesiNodeUrl === undefined) {
        cartesiNodeUrl = DEFAULT_CARTESI_NODE_URL;
    }
    let unexecuted_vouchers:PartialVoucher[] = await getUnexecutedVouchers(
        signerOrProvider, dappAddress, cartesiNodeUrl
    );

    let ready_vouchers:Voucher[] = [];
    for (let i = 0; i < unexecuted_vouchers.length; i++) {
        const voucher = await getVoucher(
            `${cartesiNodeUrl}/graphql`,
            unexecuted_vouchers[i].index, unexecuted_vouchers[i].input.index
        );

        if (!voucher.proof) continue;
        ready_vouchers.push(voucher);
    }

    return ready_vouchers;
}

export async function executeVoucher(
    signer:Signer, dappAddress:string,
    inputIndex:number, voucherIndex:number,
    cartesiNodeUrl?:string
): Promise<ContractReceipt> {
    if (cartesiNodeUrl === undefined) {
        cartesiNodeUrl = DEFAULT_CARTESI_NODE_URL;
    }

    const voucher = await getVoucher(
        `${cartesiNodeUrl}/graphql`, voucherIndex, inputIndex
    );
    if (!voucher.proof) {
        throw new Error(`voucher "${voucher.index}" from input "${voucher.input}" has no associated proof yet`);
    }
    return executeVoucherFromParams(signer,dappAddress,voucher.destination,voucher.payload,voucher.proof);
}

export async function executeVoucherFromParams(
    signer:Signer, dappAddress:string,
    destination:string, payload: BytesLike, proof: ProofStruct
): Promise<ContractReceipt> {
    const dappContract = CartesiDApp__factory.connect(dappAddress, signer);

    const voucher_execution = await dappContract.executeVoucher(
        destination, payload, proof);

    const receipt = voucher_execution.wait();
    return receipt;
}

export async function wasVoucherExecutedFromParams(
    signer:Signer, dappAddress:string,
    inputIndex: BigNumberish, outputIndex: BigNumberish
): Promise<boolean> {
    const dappContract = CartesiDApp__factory.connect(dappAddress, signer);
    return dappContract.wasVoucherExecuted(inputIndex, outputIndex);
}
