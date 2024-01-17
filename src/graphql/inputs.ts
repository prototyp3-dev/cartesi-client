import { createClient, fetchExchange } from "@urql/core";
import { retryExchange } from '@urql/exchange-retry';
import fetch from "cross-fetch";
import {
    Notice,
    GetInputResultDocument,
    Report,
    Voucher,
    GetInputResultQuery,
    CompletionStatus
} from "@/generated/graphql";

import { GraphqlOptions, setDefaultGraphqlOptions, getGraphqlUrl } from "./lib"

const DEFAULT_INITIAL_DELAY = 3000; // 3 seconds
const DEFAULT_DELAY_INTERVAL = 1000;

export interface InputResult extends GraphqlOptions {
    initialDelay: number;
    delayInterval: number;
}

const setDefaultInputResultOptions = (options: InputResult): InputResult => {
    options = setDefaultGraphqlOptions(options) as InputResult;
    if (options.initialDelay === undefined) {
        options.initialDelay = DEFAULT_INITIAL_DELAY;
    }
    if (options.delayInterval === undefined) {
        options.delayInterval = DEFAULT_DELAY_INTERVAL;
    }
    return options;
}

/**
 * Queries a GraphQL server for notices based on an input index
 * @param url URL of the GraphQL server
 * @param input input index
 * @returns Object with a list of notices and reports for an input
 */
export const getInputResult = async (
    options: InputResult
): Promise<{notices: Array<Notice>, reports: Array<Report>, vouchers: Array<Voucher>}> => {
    if (options.inputIndex == undefined)
        throw new Error("Missing input index");
    options = setDefaultInputResultOptions(options);
    let result = {notices: [] as Array<Notice>, reports: [] as Array<Report>, vouchers: [] as Array<Voucher>}

    while (result.notices.length == 0 && result.reports.length == 0 && result.vouchers.length == 0) {
        // create GraphQL client to reader server
        const client = createClient({ url:getGraphqlUrl(options), exchanges: [retryExchange({
            initialDelayMs: options.initialDelay,
            maxNumberAttempts: Number.POSITIVE_INFINITY,
            retryIf: error => { // retry if has a graphql error (ex: notice not found for this inputIndex)
                console.log("Checking error then retrying...")
                return !!(error.graphQLErrors.length > 0);
            }}), fetchExchange], fetch });

        // query the GraphQL server for the reports and notices
        console.log(
            `querying ${getGraphqlUrl(options)} for notices and reports for input with index "${options.inputIndex}"...`
        );

        const { data, error } = await client
            .query(GetInputResultDocument, { inputIndex: options.inputIndex })
            .toPromise();


        if (data?.input) {
            if (data.input.status != CompletionStatus.Unprocessed){
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

                if (data.input.status != CompletionStatus.Accepted) {
                    const errorMessage = result.reports.length > 0 ? result.reports[0].payload : `Advance error: ${data.input.status}`
                    throw new Error(errorMessage);
                }
            }
        } else {
            throw new Error(error?.message);
        }
        await sleep(options.delayInterval);
    }

    return result;
};

const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Queries a GraphQL server for notices based on an input index
 * @param options options that have default values
 * @returns Object with a list of notices and reports for an input
 */
export const queryInputResult = async (
    options?: InputResult
): Promise<{notices: Array<Notice>, reports: Array<Report>, vouchers: Array<Voucher>}> => {
    if (options.outputIndex === undefined) {
        throw new Error("input index not defined");
    }
    options = setDefaultGraphqlOptions(options) as InputResult;
    return getInputResult(options);
}
