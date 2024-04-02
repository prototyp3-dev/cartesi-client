// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
import {
    VouchersDocument,
    VouchersByInputDocument,
    Voucher,
    Input,
    VoucherDocument,
    VouchersByInputQueryVariables,
    VouchersByInputQuery,
    VouchersQuery,
    VoucherQuery,
    VoucherQueryVariables,
} from "@/generated/graphql";

import { GraphqlOptions, setDefaultGraphqlOptions, getGraphqlUrl } from "./lib"
import request from "graphql-request";

// define PartialVoucher type only with the desired fields of the full Voucher defined by the GraphQL schema
export type PartialInput = Pick<Input, "index">;
export type PartialVoucher = Pick<
    Voucher,
    "__typename" | "index" | "destination" | "payload"
> & {
    input: PartialInput;
};
export type PartialVoucherEdge = { node: PartialVoucher };

// define a type predicate to filter out vouchers
const isPartialVoucherEdge = (
    n: PartialVoucherEdge | null
): n is PartialVoucherEdge => n !== null;



/**
 * Queries a GraphQL server for vouchers based on an input index
 * @param url URL of the GraphQL server
 * @param input input index
 * @returns List of vouchers, returned as PartialVoucher objects
 */
export const getVouchers = async (
    url: string,
    inputIndex?: number
): Promise<PartialVoucher[]> => {
    console.log(
        `querying ${url} for vouchers of input index "${inputIndex}"...`
    );

    if (inputIndex !== undefined) {
        const variables:VouchersByInputQueryVariables = {inputIndex: inputIndex};
        // list vouchers querying by input
        const data:VouchersByInputQuery = await request(url, VouchersByInputDocument, variables);
        if (data?.input?.vouchers?.edges) {
            return data.input.vouchers.edges
                .filter(isPartialVoucherEdge)
                .map((e) => e.node);
        } else {
            return [];
        }
    } else {
        // list vouchers using top-level query
        const data:VouchersQuery = await request(url, VouchersDocument);
        if (data?.vouchers?.edges) {
            return data.vouchers.edges
                .filter(isPartialVoucherEdge)
                .map((e) => e.node);
        } else {
            return [];
        }
    }
};



/**
 * Queries a GraphQL server looking for a specific voucher
 * @param url URL of the GraphQL server
 * @param noticeIndex notice index
 * @param inputIndex input index
 * @returns The corresponding voucher, returned as a full Voucher object
 */
export const getVoucher = async (
    url: string,
    voucherIndex: number,
    inputIndex: number
): Promise<Voucher> => {
    // create GraphQL client to reader server
    // query the GraphQL server for the voucher
    console.log(
        `querying ${url} for voucher with index "${voucherIndex}" from input "${inputIndex}"...`
    );

    const variables:VoucherQueryVariables = {inputIndex: inputIndex, voucherIndex: voucherIndex};
    const data:VoucherQuery = await request(url, VoucherDocument, variables);

    if (data?.voucher) {
        return data.voucher as Voucher;
    } else {
        throw new Error("Voucher not found.");
    }
};

/**
 * Queries a GraphQL server for vouchers based on input keys
 * @param options options that have default values
 * @returns List of vouchers, returned as PartialVoucher objects
 */
export const queryVouchers = async (
    options?: GraphqlOptions
): Promise<PartialVoucher[]> => {
    options = setDefaultGraphqlOptions(options);
    return getVouchers(getGraphqlUrl(options),options.inputIndex);
}

/**
 * Queries a GraphQL server looking for a specific voucher
 * @param options options that have default values
 * @returns The corresponding voucher, returned as a full Voucher object
 */
export const queryVoucher = async (
    options?: GraphqlOptions
): Promise<Voucher> => {
    options = setDefaultGraphqlOptions(options);
    return getVoucher(getGraphqlUrl(options),options.inputIndex,options.outputIndex);
}
