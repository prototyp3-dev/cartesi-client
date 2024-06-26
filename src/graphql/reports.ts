// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
import request from "graphql-request";
import {
    ReportsDocument,
    ReportsByInputDocument,
    Report,
    Input,
    ReportDocument,
    ReportsByInputQueryVariables,
    ReportsByInputQuery,
    ReportsQuery,
    ReportQueryVariables,
    ReportQuery,
} from "@/generated/graphql";

import { GraphqlOptions, setDefaultGraphqlOptions, getGraphqlUrl } from "./lib"

// define PartialReport type only with the desired fields of the full Report defined by the GraphQL schema
export type PartialInput = Pick<Input, "index">;
export type PartialReport = Pick<Report, "__typename" | "index" | "payload"> & {
    input: PartialInput;
};
export type PartialReportEdge = { node: PartialReport };

// define a type predicate to filter out reports
const isPartialReportEdge = (
    n: PartialReportEdge | null
): n is PartialReportEdge => n !== null;

/**
 * Queries a GraphQL server for reports based on input keys
 * @param url URL of the GraphQL server
 * @param input input identification keys
 * @returns List of reports, returned as PartialReport objects
 */
export const getReports = async (
    url: string,
    inputIndex?: number
): Promise<PartialReport[]> => {
    // query the GraphQL server for reports corresponding to the input index
    console.log(
        `querying ${url} for reports of input index "${inputIndex}"...`
    );

    if (inputIndex !== undefined) {
        // list reports querying by input
        const variables:ReportsByInputQueryVariables = {inputIndex: inputIndex};
        const data:ReportsByInputQuery = await request(url, ReportsByInputDocument, variables);
        
        if (data?.input?.reports?.edges) {
            return data.input.reports.edges
                .filter(isPartialReportEdge)
                .map((e:PartialReportEdge) => e.node);
        } else {
            return [];
        }
    } else {
        // list reports using top-level query
        const data:ReportsQuery = await request(url, ReportsDocument);

        if (data?.reports) {
            return data.reports.edges
                .filter(isPartialReportEdge)
                .map((e:PartialReportEdge) => e.node);
        } else {
            return [];
        }
    }
};

/**
 * Queries a GraphQL server looking for a specific report
 * @param url URL of the GraphQL server
 * @param inputIndex input index
 * @param reportIndex report index, default = 0
 * @returns The corresponding report, returned as a full Report object
 */
export const getReport = async (
    url: string,
    inputIndex: number,
    reportIndex = 0
): Promise<Report> => {
    // query the GraphQL server for the report
    console.log(
        `querying ${url} for report with index "${reportIndex}" from input "${inputIndex}"...`
    );

    const variables:ReportQueryVariables = {inputIndex: inputIndex, reportIndex: reportIndex};
    const data:ReportQuery = await request(url, ReportDocument, variables);

    if (data?.report) {
        return data.report as Report;
    } else {
        throw new Error("Unable to find report.");
    }
};

/**
 * Queries a GraphQL server for reports based on input keys
 * @param options options that have default values
 * @returns List of reports, returned as PartialReport objects
 */
export const queryReports = async (
    options?: GraphqlOptions
): Promise<PartialReport[]> => {
    options = setDefaultGraphqlOptions(options);
    return getReports(getGraphqlUrl(options),options.inputIndex);
}

/**
 * Queries a GraphQL server looking for a specific report
 * @param options options that have default values
 * @returns The corresponding report, returned as a full Report object
 */
export const queryReport = async (
    options?: GraphqlOptions
): Promise<Report> => {
    options = setDefaultGraphqlOptions(options);
    return getReport(getGraphqlUrl(options),options.inputIndex,options.outputIndex);
}
