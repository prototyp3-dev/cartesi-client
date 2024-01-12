import { createClient, fetchExchange } from "@urql/core";
import { retryExchange } from '@urql/exchange-retry';
import fetch from "cross-fetch";
import {
    Notice,
    GetInputResultDocument,
    Report,
    Voucher
} from "@/generated/graphql";

import { GraphqlOptions, setDefaultGraphqlOptions, getGraphqlUrl } from "./lib"


/**
 * Queries a GraphQL server for notices based on an input index
 * @param url URL of the GraphQL server
 * @param input input index
 * @returns Object with a list of notices and reports for an input
 */
export const getInputResult = async (
    url: string,
    inputIndex: number
): Promise<{notices: Array<Notice>, reports: Array<Report>, vouchers: Array<Voucher>}> => {
    let result = {notices: [] as Array<Notice>, reports: [] as Array<Report>, vouchers: [] as Array<Voucher>}

    while (result.notices.length == 0 && result.reports.length == 0 && result.vouchers.length == 0) {
        // create GraphQL client to reader server
        const client = createClient({ url, exchanges: [retryExchange({
            initialDelayMs: 3000, // 3 seconds
            maxNumberAttempts: Number.POSITIVE_INFINITY,
            retryIf: error => { // retry if has a graphql error (ex: notice not found for this inputIndex)
                console.log("Checking error then retrying...")
                return !!(error.graphQLErrors.length > 0);
            }}), fetchExchange], fetch });

        // query the GraphQL server for the reports and notices
        console.log(
            `querying ${url} for notices and reports for input with index "${inputIndex}"...`
        );

        const { data, error } = await client
            .query(GetInputResultDocument, { inputIndex: inputIndex })
            .toPromise();


        if (data?.input) {
            result = {notices: [] as Array<Notice>, reports: [] as Array<Report>, vouchers: [] as Array<Voucher>}
            // add notices to the result
            for (let i = 0; i < data.input.notices.edges.length; i++) {
                result.notices.push(data.input.notices.edges[i].node);
            }

            // add reports to the result
            for (let i = 0; i < data.input.reports.edges.length; i++) {
                result.reports.push(data.input.reports.edges[i].node);
            }

            // add vouchers to the result
            for (let i = 0; i < data.input.vouchers.edges.length; i++) {
                result.vouchers.push(data.input.vouchers.edges[i].node);
            }
        } else {
            throw new Error(error?.message);
        }
    }

    return result;
};

/**
 * Queries a GraphQL server for notices based on an input index
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input
 */
export const queryInputResult = async (
    options?: GraphqlOptions
): Promise<{notices: Array<Notice>, reports: Array<Report>, vouchers: Array<Voucher>}> => {
    if (options.outputIndex === undefined) {
        throw new Error("input index not defined");
    }
    options = setDefaultGraphqlOptions(options);
    return getInputResult(getGraphqlUrl(options),options.inputIndex);
}
