import { Notice, Report, Voucher } from "@/generated/graphql";
import { getInputResult } from "@/graphql/inputs";
import {
    DEFAULT_CARTESI_NODE_URL,
    DEFAULT_INPUT_BOX_ADDRESS,
    DEFAULT_ERC20PORTAL_ADDRESS,
    DEFAULT_ERC721PORTAL_ADDRESS } from "@/shared/default";
import { InputBox__factory, ERC20Portal__factory, ERC721Portal__factory, IERC20__factory, IERC721__factory } from "@cartesi/rollups";
import { Signer, utils, ContractReceipt, BigNumber } from "ethers";

interface AdvanceOptions {
    sync?: boolean,
    cartesiNodeUrl?: string,
}

interface AdvanceInputOptions extends AdvanceOptions {
    inputBoxAddress?: string
}

interface ERC20DepositOptions extends AdvanceOptions {
    erc20PortalAddress?: string
}

interface ERC721DepositOptions extends AdvanceOptions {
    erc721PortalAddress?: string
}

interface AdvanceOutput {
    notices: Array<Notice>,
    reports: Array<Report>,
    vouchers: Array<Voucher>
}

const DEFAULT_SYNC_BEHAVIOR = true;

function setDefaultAdvanceValues(options:AdvanceOptions):AdvanceOptions {
    if (options === undefined) options = {}
    if (options.sync === undefined) {
        options.sync = DEFAULT_SYNC_BEHAVIOR;
    }
    if (options.cartesiNodeUrl === undefined) {
        options.cartesiNodeUrl = DEFAULT_CARTESI_NODE_URL;
    }
    return options;
}

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param payload payload to send
 * @returns Object with a list of notices and reports for an input
 */
export async function advanceInput(
    client:Signer,
    dappAddress:string,
    payload:string,
):Promise<AdvanceOutput>;

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param payload payload to send
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceInput(
    client:Signer,
    dappAddress:string,
    payload:string,
    options:AdvanceInputOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceInput(
    client:Signer,
    dappAddress:string,
    payload:string,
    options?:AdvanceInputOptions
):Promise<AdvanceOutput|ContractReceipt> {
    options = setDefaultAdvanceValues(options);
    if (options.inputBoxAddress === undefined) {
        options.inputBoxAddress = DEFAULT_INPUT_BOX_ADDRESS;
    }

    const inputContract = InputBox__factory.connect(
        options.inputBoxAddress,
        client
    );

    const payload_hex = utils.toUtf8Bytes(payload);
    const input = await inputContract.addInput(
        dappAddress, payload_hex);
    const receipt = await input.wait();

    // call is async, return addInput's receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[0].args[1]._hex);
    return await getInputResult(
        `${options.cartesiNodeUrl}/graphql`,
        inputIndex
    );
}



/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC20 token address
 * @param amount amount of the ERC20 token to deposit
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceERC20Deposit(
    client:Signer,
    dappAddress:string,
    tokenAddress:string,
    amount:number
):Promise<AdvanceOutput>;

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC20 token address
 * @param amount amount of the ERC20 token to deposit
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceERC20Deposit(
    client:Signer, dappAddress:string,
    tokenAddress:string, amount:number,
    options:ERC20DepositOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceERC20Deposit(
    client:Signer, dappAddress:string,
    tokenAddress:string, amount:number,
    options?:ERC20DepositOptions
):Promise<AdvanceOutput|ContractReceipt> {
    options = setDefaultAdvanceValues(options);
    if (options.erc20PortalAddress === undefined) {
        options.erc20PortalAddress = DEFAULT_ERC20PORTAL_ADDRESS;
    }

    const erc20Portal = ERC20Portal__factory.connect(
        options.erc20PortalAddress,
        client
    );

    // increase allowance for ERC20 Portal if needed
    const erc20Contract = IERC20__factory.connect(
        tokenAddress,
        client
    );
    const signerAddress = await client.getAddress();
    const allowance = await erc20Contract.allowance(
        signerAddress,
        options.erc20PortalAddress
    );
    if (allowance.lt(amount)) {
        const allowanceApproveAmount = BigNumber.from(amount).sub(allowance);
        const tx = await erc20Contract.approve(
            options.erc20PortalAddress,
            allowanceApproveAmount
        );
        await tx.wait();
    }

    // deposit
    const deposit = await erc20Portal.depositERC20Tokens(
        tokenAddress, dappAddress, amount, "0x");
    const receipt = await deposit.wait();

    // call is async, return depositERC20Tokens' receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[0].args[1]._hex);
    return await getInputResult(
        `${options.cartesiNodeUrl}/graphql`,
        inputIndex
    );
}



/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC721 token address
 * @param tokenId id of the ERC721 token to deposit
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceERC721Deposit(
    client:Signer,
    dappAddress:string,
    tokenAddress:string,
    tokenId:number
):Promise<AdvanceOutput>;

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC721 token address
 * @param tokenId id of the ERC721 token to deposit
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceERC721Deposit(
    client:Signer, dappAddress:string,
    tokenAddress:string, tokenId:number,
    options:ERC721DepositOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceERC721Deposit(
    client:Signer, dappAddress:string,
    tokenAddress:string, tokenId:number,
    options?:ERC721DepositOptions
):Promise<AdvanceOutput|ContractReceipt> {
    options = setDefaultAdvanceValues(options);
    if (options.erc721PortalAddress === undefined) {
        options.erc721PortalAddress = DEFAULT_ERC721PORTAL_ADDRESS;
    }

    const erc721Portal = ERC721Portal__factory.connect(
        options.erc721PortalAddress,
        client
    );

    // Set the ERC721Portal as the new controller
    const erc721Contract = IERC721__factory.connect(
        tokenAddress,
        client
    );
    erc721Contract.approve(options.erc721PortalAddress, tokenId);

    // deposit
    const deposit = await erc721Portal.depositERC721Token(
        tokenAddress, dappAddress, tokenId, "0x", "0x"
    );
    const receipt = await deposit.wait();

    // call is async, return depositERC721Token' receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[0].args[1]._hex);
    return await getInputResult(
        `${options.cartesiNodeUrl}/graphql`,
        inputIndex
    );
}