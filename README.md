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