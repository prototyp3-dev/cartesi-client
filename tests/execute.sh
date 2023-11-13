#!/bin/bash

LOG_FILE="sunodo_test.log"

cd backend
sunodo build
# run the DApp in the background
sunodo run > ${LOG_FILE} 2>&1 &
SUNODO_PID=$!

cd contracts

# install simpleERC721 dependencies
npm install

# compile deploy contracts used by tests
docker run --rm ghcr.io/foundry-rs/foundry "forge build"

# wait for the cartesi node to be ready
while [ grep -c "Press Ctrl+C to stop the node" ../${LOG_FILE} == 0 ]
do
    sleep 1 # wait 1 sec, then try again
done

# deploy contracts used by tests
RPC_URL="http://localhost:8545"
MNEMONIC="test test test test test test test test test test test junk"
PUBLIC_KEY="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

docker run --rm ghcr.io/foundry-rs/foundry "forge create --rpc-url '${RPC_URL}' --mnemonic '${MNEMONIC}' --json src/simpleERC721.sol"

# mint an NFT
docker run --rm --net="host" ghcr.io/foundry-rs/foundry "cast send --mnemonic \"${MNEMONIC}\" --rpc-url \"${RPC_URL}\" \"0xc6e7DF5E7b4f2A278906862b61205850344D4e7d\" \"mintTo(address)\" ${PUBLIC_KEY}"

# go back to the test directory and run the tests
cd ../
jest


# send SIGINT (Ctrl+c) signal to the backend after the tests finishes
kill -2 ${SUNODO_PID}
rm ${LOG_FILE}