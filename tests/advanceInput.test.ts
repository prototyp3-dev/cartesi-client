import { advanceInput } from "../src/index";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers, ContractReceipt } from "ethers";

import { Notice, Report, Voucher } from "../src/generated/graphql";

interface Payload {
  payload: string
}

interface InputTest {
  notices?:Array<Payload>,
  reports?:Array<Payload>
}

interface OutputTest {
  notices: Array<Notice>,
  reports: Array<Report>,
  vouchers: Array<Voucher>
}

const provider = new JsonRpcProvider("http://localhost:8545");
const signer = ethers.Wallet
.fromMnemonic("test test test test test test test test test test test junk")
.connect(provider);
const dapp_address = "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C";
const test_timeout = 60000

let input:InputTest;
let output:OutputTest|ContractReceipt;




function expectedAsyncInput(input:InputTest, output:OutputTest) {
  for (let i = 0; i < output.notices?.length; i++) {
    expect(output.notices[i].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input.notices![i].payload))
    );  
  }  

  for (let i = 0; i < output.reports?.length; i++) {
    expect(output.reports[i].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input.reports![i].payload))
    );  
  }
}

// TEST 0
input = {
  "notices": [{"payload": "Notice 0"}]
}

test('Single notice', async () => {
  output = await advanceInput(signer, dapp_address, JSON.stringify(input));
  
  expectedAsyncInput(input, output);
}, test_timeout);


// TEST 1
input = {
  "notices": [{"payload": "Notice 0"}, {"payload": "Notice 1"}]
}
test('Two notices', async () => {
  output = await advanceInput(signer, dapp_address, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, test_timeout);


// TEST 2
input = {
  "notices": [{"payload": "Notice 0"}],
  "reports": [{"payload": "Report 0"}]
}
test('One notice and one report', async () => {
  output = await advanceInput(signer, dapp_address, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, test_timeout);


// TEST 3
input = {
  "notices": [{"payload": "Notice 0"}, {"payload": "Notice 1"}],
  "reports": [{"payload": "Report 0"}]
}
test('Two notices and one report', async () => {
  output = await advanceInput(signer, dapp_address, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, test_timeout);


// TEST 4
input = {
  "notices": [{"payload": "Notice 0"}, {"payload": "Notice 1"}],
  "reports": [{"payload": "Report 0"}, {"payload": "Report 1"}]
}
test('Two notices and two reports', async () => {
  output = await advanceInput(signer, dapp_address, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, test_timeout);