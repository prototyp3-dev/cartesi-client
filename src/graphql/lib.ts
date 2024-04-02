
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


function parseError(error:Error) {
    const errorObjIndexStart = error.message.indexOf(":")+1;
    const errorObjString = error.message.slice(errorObjIndexStart);
    if (errorObjString.length === 0) return null;

    try {
        return JSON.parse(errorObjString);
    } catch (error) {
        return null;
    }
}

export function isInputNotFound(error:Error) {
    const errorObj = parseError(error);
    if (!errorObj) return null;


    for (let i = 0; i < errorObj.response.errors.length; i++) {
        const error = errorObj.response.errors[i];
        if (error.message === "input not found") return true;
    }

    return false;
}