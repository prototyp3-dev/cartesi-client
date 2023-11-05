import { advanceERC20Deposit } from "../src/index";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";

const SUNODO_TOKEN = "0xae7f61eCf06C65405560166b259C54031428A9C4".toLowerCase();
const AMOUNT = 500;

const provider = new JsonRpcProvider("http://localhost:8545");
const signer = ethers.Wallet
.fromMnemonic("test test test test test test test test test test test junk")
.connect(provider);
const dapp_address = "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C".toLowerCase();
const test_timeout = 60000


// TEST 0
test('ERC20 Deposit', async () => {
    const output = await advanceERC20Deposit(signer, dapp_address, SUNODO_TOKEN, AMOUNT);
    const signer_address = (await signer.getAddress()).toLowerCase();

    // validate notice
    const expected_notice_payload = `Received an ${AMOUNT} ERC20(${SUNODO_TOKEN}) deposit from ${signer_address}.`;

    expect(output.notices[0].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(expected_notice_payload))
    );  


    // validate voucher (destination and payload)
    const expected_voucher_destination = SUNODO_TOKEN;
    expect(output.vouchers[0].destination).toBe(expected_voucher_destination);
    
    const abi = ethers.utils.defaultAbiCoder;
    
    const transfer_function_selector = ethers.utils.id("transfer(address,uint256)").slice(2, 10);
    const transfer_function_params = abi.encode(
        ["address", "uint256"],
        [signer_address, AMOUNT]
    ).substring(2); // substring to remove "0x"
    
    const expected_voucher_payload = `0x${transfer_function_selector}${transfer_function_params}`;
    expect(output.vouchers[0].payload).toBe(expected_voucher_payload);
    
}, test_timeout);