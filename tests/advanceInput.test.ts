import { advanceInput } from "../src/index";
import { TransactionReceipt } from "@ethersproject/providers";
import { ethers, ContractReceipt } from "ethers";

import { Notice, Report, Voucher } from "../src/generated/graphql";
import { InputBox__factory } from "@cartesi/rollups";
import { DEFAULT_INPUT_BOX_ADDRESS } from "../src/shared/default";
import { provider, dappAddress, testTimeout } from "./conf";
//import { NonceManager } from "@ethersproject/experimental";


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

let input:InputTest;
let output:OutputTest|ContractReceipt;
const signer = ethers.Wallet
    .fromMnemonic("test test test test test test test test test test test junk",
    `m/44'/60'/0'/0/1`)
    .connect(provider);
//const signer = new NonceManager(my_signer);




function expectedAsyncInput(input:InputTest, output:OutputTest) {
  if (input.notices && input.notices.length > 0) expect(input.notices.length).toBe(output.notices.length);
  for (let i = 0; i < output.notices.length; i++) {
    expect(output.notices[i].payload).toBe(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input.notices![i].payload))
    );  
  }  

  if (input.reports && input.reports.length > 0) expect(input.reports.length).toBe(output.reports.length);
  for (let i = 0; i < output.reports.length; i++) {
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
  output = await advanceInput(signer, dappAddress, JSON.stringify(input));
  
  expectedAsyncInput(input, output);
}, testTimeout);


// TEST 1
input = {
  "notices": [{"payload": "Notice 0"}, {"payload": "Notice 1"}]
}
test('Two notices', async () => {
  output = await advanceInput(signer, dappAddress, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, testTimeout);


// TEST 2
input = {
  "notices": [{"payload": "Notice 0"}],
  "reports": [{"payload": "Report 0"}]
}
test('One notice and one report', async () => {
  output = await advanceInput(signer, dappAddress, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, testTimeout);


// TEST 3
input = {
  "notices": [{"payload": "Notice 0"}, {"payload": "Notice 1"}],
  "reports": [{"payload": "Report 0"}]
}
test('Two notices and one report', async () => {
  output = await advanceInput(signer, dappAddress, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, testTimeout);


// TEST 4
input = {
  "notices": [{"payload": "Notice 0"}, {"payload": "Notice 1"}],
  "reports": [{"payload": "Report 0"}, {"payload": "Report 1"}]
}
test('Two notices and two reports', async () => {
  output = await advanceInput(signer, dappAddress, JSON.stringify(input));

  expectedAsyncInput(input, output);
}, testTimeout);


// TEST 5
input = {
  "notices": [{"payload": "Notice 0"}],
}
test('Sync advanceInput', async () => {
  output = await advanceInput(signer, dappAddress, JSON.stringify(input), {sync: false});
  const inputContract = InputBox__factory.connect(
    DEFAULT_INPUT_BOX_ADDRESS,
    provider
  );

  // Validate Receipt using events
  const events = await inputContract.queryFilter(
    inputContract.filters.InputAdded(),
    (output as TransactionReceipt).blockHash
  );

  const received_event = (output as ContractReceipt).events![0];
  const expected_event = events[0];

  expect(received_event.eventSignature).toBe(expected_event.eventSignature);
  expect(received_event.args).toEqual(expected_event.args);
  expect(received_event.address).toBe(expected_event.address);
  expect(received_event.transactionHash).toBe(expected_event.transactionHash);
  expect(received_event.blockNumber).toBe(expected_event.blockNumber);
  expect(received_event.blockHash).toBe(expected_event.blockHash);
  expect(received_event.data).toBe(expected_event.data);
}, testTimeout);