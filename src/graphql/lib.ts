
import { DEFAULT_CARTESI_NODE_URL } from "@/shared/default";

export const DEFAULT_OUTPUT_INDEX: number = 0;

export interface GraphqlOptions {
    cartesiNodeUrl?: string;
    inputIndex?: number;
    outputIndex?: number;
}

export function setDefaultGraphqlOptions(options:GraphqlOptions):GraphqlOptions {
    if (options === undefined) options = {}
    if (options.cartesiNodeUrl === undefined) {
        options.cartesiNodeUrl = DEFAULT_CARTESI_NODE_URL;
    }
    if (options.outputIndex === undefined) {
        options.outputIndex = DEFAULT_OUTPUT_INDEX;
    }
    return options;
}

export function getGraphqlUrl(options:GraphqlOptions):string {
    return `${options.cartesiNodeUrl}/graphql`;
}
