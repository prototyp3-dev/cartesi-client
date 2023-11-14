import { advanceERC20Deposit } from "../src/index";
import { ethers } from "ethers";
import { provider, dappAddress, sunodoToken, testTimeout } from "./conf"

const AMOUNT = 500;
const signer = ethers.Wallet
    .fromMnemonic("test test test test test test test test test test test junk")
    .connect(provider);

// TEST 0
test('ERC20 Deposit', async () => {
    const output = await advanceERC20Deposit(signer, dappAddress, sunodoToken, AMOUNT);
    const signer_address = (await signer.getAddress()).toLowerCase();

    // validate notice
    const expected_notice_payload = `Received an ${AMOUNT} ERC20(${sunodoToken}) deposit from ${signer_address}.`;

    expect(output.notices[0].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(expected_notice_payload))
    );  


    // validate voucher (destination and payload)
    const expected_voucher_destination = sunodoToken;
    expect(output.vouchers[0].destination).toBe(expected_voucher_destination);
    
    const abi = ethers.utils.defaultAbiCoder;
    
    const transfer_function_selector = ethers.utils.id("transfer(address,uint256)").slice(2, 10);
    const transfer_function_params = abi.encode(
        ["address", "uint256"],
        [signer_address, AMOUNT]
    ).substring(2); // substring to remove "0x"
    
    const expected_voucher_payload = `0x${transfer_function_selector}${transfer_function_params}`;
    expect(output.vouchers[0].payload).toBe(expected_voucher_payload);
    
}, testTimeout);