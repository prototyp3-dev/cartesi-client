# Cartesi Client
A typescript package that abstracts the complexity of the interaction with a Cartesi Rollups DApp.

## Table of Contents
- [Build](#build)
- [Import it locally](#import-it-locally)
- [Input Functions](#input-functions)
    - [Advance](#advance)
        - [advanceInput](#advanceinput)
        - [advanceERC20Deposit](#advanceerc20deposit)
        - [advanceERC721Deposit](#advanceerc721deposit)
    - [Inspect](#inspect)
        - [inspect](#inspect-1)
- [Output Functions](#output-functions)
    - [getUnexecutedVouchers](#getUnexecutedVouchers)
    - [getVouchersReady](#getVouchersReady)
    - [executeVoucher](#executeVoucher)

# Build
```shell
npm install
npm run build
```

# Import it locally
```shell
cd \<path_to_my_project\>
npm link \<path_to_cartesi_client\>
```
In your code
```typescript
import { advanceInput } from "cartesi-client";
```
# Input Functions
## Advance
### advanceInput
### advanceERC20Deposit
### advanceERC721Deposit
## Inspect
### inspect

# Output Functions
## Vouchers
### getUnexecutedVouchers
### getVouchersReady
### executeVoucher
## Notices
## Reports

# Run package Tests

1. Run the test backend in one of the terminals
```shell
cd backend
sunodo build
sunodo run
```

2. Open a new terminal to deploy the ERC721 contract and mint the NFT used for tests
```shell
export MNEMONIC="test test test test test test test test test test test junk"
export RPC_URL="http://localhost:8545"
export PUBLIC_KEY="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
```

```shell
cd backend/contracts
```

```shell
docker run --rm ghcr.io/foundry-rs/foundry "forge build"
```

```shell
docker run --rm ghcr.io/foundry-rs/foundry "forge create --rpc-url \"${RPC_URL}\" --mnemonic \"${MNEMONIC}\" --json src/simpleERC721.sol:SimpleERC721"
```

```shell
docker run --rm --net="host" ghcr.io/foundry-rs/foundry "cast send --mnemonic \"${MNEMONIC}\" --rpc-url \"${RPC_URL}\" \"0xc6e7DF5E7b4f2A278906862b61205850344D4e7d\" \"mintTo(address)\" ${PUBLIC_KEY}"
```
