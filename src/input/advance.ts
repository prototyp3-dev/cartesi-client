import { Notice, Report, Voucher } from "@/generated/graphql";
import { getInputResult, InputResult } from "@/graphql/inputs";
import {
    DEFAULT_CARTESI_NODE_URL,
    DEFAULT_INPUT_BOX_ADDRESS,
    DEFAULT_ERC20PORTAL_ADDRESS,
    DEFAULT_ERC721PORTAL_ADDRESS,
    DEFAULT_ETHERPORTAL_ADDRESS,
    DEFAULT_DAPP_RELAY_ADDRESS } from "@/shared/default";
import { InputBox__factory, ERC20Portal__factory, ERC721Portal__factory, IERC20__factory, IERC721__factory, EtherPortal__factory, DAppAddressRelay__factory } from "@cartesi/rollups";
import { Signer, utils, ContractReceipt, BigNumber, ethers } from "ethers";
import { PartialNotice, PartialReport, PartialVoucher } from "..";

interface AdvanceOptions {
    sync?: boolean;
    cartesiNodeUrl?: string;
    initialDelay?: number;
    delayInterval?: number;
}

export interface AdvanceInputOptions extends AdvanceOptions {
    inputBoxAddress?: string
}

export interface ERC20DepositOptions extends AdvanceOptions {
    erc20PortalAddress?: string,
    decimals?: number
}

export interface ERC721DepositOptions extends AdvanceOptions {
    erc721PortalAddress?: string
}

export interface EtherDepositOptions extends AdvanceOptions {
    etherPortalAddress?: string
}

export interface DappRelayOptions extends AdvanceOptions {
    dappRelayAddress?: string
}

export interface AdvanceOutput {
    notices: Array<PartialNotice>,
    reports: Array<PartialReport>,
    vouchers: Array<PartialVoucher>
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
 * @returns Object with a list of notices, reports, and vouchers for an input
 */
export async function advanceInput(
    client:Signer,
    dappAddress:string,
    payload:string|Uint8Array,
):Promise<AdvanceOutput>;

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param payload payload to send
 * @param options options that have default values
 * @returns Object with a list of notices, reports, and vouchers an input, or addInput's receipt
 */
export async function advanceInput(
    client:Signer,
    dappAddress:string,
    payload:string|Uint8Array,
    options:AdvanceInputOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceInput(
    client:Signer,
    dappAddress:string,
    payload:string|Uint8Array,
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

    let payloadBytes: Uint8Array;
    if (typeof payload == "string") {
        if (utils.isHexString(payload))
            payloadBytes = utils.arrayify(payload);
        else
            payloadBytes = utils.toUtf8Bytes(payload);
    } else {
        payloadBytes = payload;
    }
    const input = await inputContract.addInput(
        dappAddress, payloadBytes);
    const receipt = await input.wait();

    // call is async, return addInput's receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[0].args[1]._hex);
    const inputResultOptions: InputResult = options as InputResult;
    inputResultOptions.inputIndex = inputIndex;
    return await getInputResult(inputResultOptions);
}



/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC20 token address
 * @param amount amount of the ERC20 token to deposit
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceERC20Deposit(
    client:Signer,
    dappAddress:string,
    tokenAddress:string,
    amount:ethers.BigNumberish
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
    tokenAddress:string, amount:ethers.BigNumberish,
    options:ERC20DepositOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceERC20Deposit(
    client:Signer, dappAddress:string,
    tokenAddress:string, amount:ethers.BigNumberish,
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

    let correctedAmount = BigNumber.from(amount);
    if (options.decimals != undefined) {
        correctedAmount = ethers.utils.parseUnits(`${amount}`,options.decimals);
    }

    const allowance = await erc20Contract.allowance(
        signerAddress,
        options.erc20PortalAddress
    );
    if (allowance.lt(correctedAmount)) {
        const allowanceApproveAmount = correctedAmount.sub(allowance);
        const tx = await erc20Contract.approve(
            options.erc20PortalAddress,
            allowanceApproveAmount
        );
        await tx.wait();
    }

    // deposit
    const deposit = await erc20Portal.depositERC20Tokens(
        tokenAddress, dappAddress, correctedAmount, "0x");
    const receipt = await deposit.wait();

    // call is async, return depositERC20Tokens' receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[2].topics[2]);
    const inputResultOptions: InputResult = options as InputResult;
    inputResultOptions.inputIndex = inputIndex;
    return await getInputResult(inputResultOptions);
}



/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC721 token address
 * @param tokenId id of the ERC721 token to deposit
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceERC721Deposit(
    client:Signer,
    dappAddress:string,
    tokenAddress:string,
    tokenId:ethers.BigNumberish
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
    tokenAddress:string, tokenId:ethers.BigNumberish,
    options:ERC721DepositOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceERC721Deposit(
    client:Signer, dappAddress:string,
    tokenAddress:string, tokenId:ethers.BigNumberish,
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
    const approve_receipt = await erc721Contract.approve(options.erc721PortalAddress, tokenId);
    await approve_receipt.wait();

    // deposit
    const deposit = await erc721Portal.depositERC721Token(
        tokenAddress, dappAddress, tokenId, "0x", "0x"
    );
    const receipt = await deposit.wait();

    // call is async, return depositERC721Token' receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[1].topics[2]);
    const inputResultOptions: InputResult = options as InputResult;
    inputResultOptions.inputIndex = inputIndex;
    return await getInputResult(inputResultOptions);
}


/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param amount amount of ETHER to deposit (in ETHER)
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceEtherDeposit(
    client:Signer,
    dappAddress:string,
    amount:ethers.BigNumberish
):Promise<AdvanceOutput>;

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC20 token address
 * @param amount amount of ETHER to deposit (in ETHER)
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceEtherDeposit(
    client:Signer, dappAddress:string,
    amount:ethers.BigNumberish, options:EtherDepositOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceEtherDeposit(
    client:Signer, dappAddress:string,
    amount:ethers.BigNumberish, options?:EtherDepositOptions
):Promise<AdvanceOutput|ContractReceipt> {
    options = setDefaultAdvanceValues(options);
    if (options.etherPortalAddress === undefined) {
        options.etherPortalAddress = DEFAULT_ETHERPORTAL_ADDRESS;
    }

    const value = utils.parseEther(amount.toString());
    const etherPortal = EtherPortal__factory.connect(
        options.etherPortalAddress,
        client
    );

    // deposit
    const deposit = await etherPortal.depositEther(
        dappAddress, "0x", {value: value});
    const receipt = await deposit.wait();

    // call is async, return depositEther' receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[0].topics[2]);
    const inputResultOptions: InputResult = options as InputResult;
    inputResultOptions.inputIndex = inputIndex;
    return await getInputResult(inputResultOptions);
}


/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceDAppRelay(
    client:Signer,
    dappAddress:string
):Promise<AdvanceOutput>;

/**
 * Queries a GraphQL server for notices based on an input index
 * @param client signer
 * @param dappAddress Cartesi Rollup DApp contract address
 * @param tokenAddress ERC20 token address
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input or addInput's receipt
 */
export async function advanceDAppRelay(
    client:Signer, dappAddress:string,
    options:DappRelayOptions
):Promise<AdvanceOutput|ContractReceipt>;

export async function advanceDAppRelay(
    client:Signer, dappAddress:string,
    options?:DappRelayOptions
):Promise<AdvanceOutput|ContractReceipt> {
    options = setDefaultAdvanceValues(options);
    if (options.dappRelayAddress === undefined) {
        options.dappRelayAddress = DEFAULT_DAPP_RELAY_ADDRESS;
    }

    const dappRelay = DAppAddressRelay__factory.connect(
        options.dappRelayAddress,
        client
    );

    // deposit
    const deposit = await dappRelay.relayDAppAddress(dappAddress);
    const receipt = await deposit.wait();

    // call is async, return depositEther' receipt
    if (!options.sync) return receipt;

    // call is sync, fetch input processing result (reports, notices, and vouchers)
    const inputIndex = Number(receipt.events[0].topics[2]);
    const inputResultOptions: InputResult = options as InputResult;
    inputResultOptions.inputIndex = inputIndex;
    return await getInputResult(inputResultOptions);
}