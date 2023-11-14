import { advanceERC721Deposit } from "../src/index";
import { ethers } from "ethers";
import { provider, dappAddress, erc721Token, testTimeout } from "./conf"

const ERC721_TOKEN_ID = 1
const signer = ethers.Wallet
    .fromMnemonic("test test test test test test test test test test test junk",
    `m/44'/60'/0'/0/2`)
    .connect(provider);


// TEST 0
test('ERC721 Deposit', async () => {
    const output = await advanceERC721Deposit(signer, dappAddress, erc721Token, ERC721_TOKEN_ID);
    const signer_address = (await signer.getAddress()).toLowerCase();

    // validate notice
    const expected_notice_payload = `Received the deposit of ERC721(${erc721Token}) token ${ERC721_TOKEN_ID} from ${signer_address}.`;

    expect(output.notices[0].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(expected_notice_payload))
    );  


    // validate voucher (destination and payload)
    const expected_voucher_destination = erc721Token;
    expect(output.vouchers[0].destination).toBe(expected_voucher_destination);
    
    const abi = ethers.utils.defaultAbiCoder;
    
    const transfer_function_selector = ethers.utils.id("safeTransferFrom(address,address,uint256)").slice(2, 10);
    const transfer_function_params = abi.encode(
        ["address", "address", "uint256"],
        [dappAddress, signer_address, ERC721_TOKEN_ID]
    ).substring(2); // substring to remove "0x"
    
    const expected_voucher_payload = `0x${transfer_function_selector}${transfer_function_params}`;
    expect(output.vouchers[0].payload).toBe(expected_voucher_payload);
    
}, testTimeout);