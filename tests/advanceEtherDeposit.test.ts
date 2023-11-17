import { advanceEtherDeposit } from "../src/index";
import { ethers } from "ethers";
import { provider, dappAddress, testTimeout } from "./conf"

const signer = ethers.Wallet
    .fromMnemonic("test test test test test test test test test test test junk",
    `m/44'/60'/0'/0/3`)
    .connect(provider);
const AMOUNT = 100

// TEST 0
test('Ether Deposit', async () => {
    const output = await advanceEtherDeposit(signer, dappAddress, AMOUNT);
    const signer_address = (await signer.getAddress()).toLowerCase();
    const value = ethers.utils.parseEther(AMOUNT.toString());

    // validate notice
    const expected_notice_payload = `Received an ${value} ETHER deposit from ${signer_address}.`;

    expect(output.notices[0].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(expected_notice_payload))
    );  


    // validate voucher (destination and payload)
    const expected_voucher_destination = dappAddress;
    expect(output.vouchers[0].destination).toBe(expected_voucher_destination);
    
    const abi = ethers.utils.defaultAbiCoder;
    
    const transfer_function_selector = ethers.utils.id("withdrawEther(address,uint256)").slice(2, 10);
    const transfer_function_params = abi.encode(
        ["address", "uint256"],
        [signer_address, value]
    ).substring(2); // substring to remove "0x"
    
    const expected_voucher_payload = `0x${transfer_function_selector}${transfer_function_params}`;
    expect(output.vouchers[0].payload).toBe(expected_voucher_payload);
    
}, testTimeout);