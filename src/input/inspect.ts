import { utils } from "ethers";

const DECODE_OPTIONS = ["no-decode", "utf-8", "uint8Array"] as const;
type DECODE = typeof DECODE_OPTIONS;        // type x = readonly ['op1', 'op2', ...]
type DECODE_OPTIONS_TYPE = DECODE[number];  // 'op1' | 'op2' | ...

interface InspectOptions {
    aggregate?:boolean,
    decodeTo?:DECODE_OPTIONS_TYPE
}

interface InspectResponse {
    status:string,
    exception_payload:string|null,
    reports: Array<InspectResponseReport>,
    processed_input_count:BigInteger
}

interface InspectResponseReport {
    payload:string
}

const DEFAULT_AGGREGATE = false;
const DEFAULT_DECODE_TO = DECODE_OPTIONS[0];

function setDefaultInspectValues(options:InspectOptions):InspectOptions {
    if (options === undefined) options = {}
    if (options.aggregate === undefined) {
        options.aggregate = DEFAULT_AGGREGATE;
    }
    if (options.decodeTo === undefined) {
        options.decodeTo = DEFAULT_DECODE_TO;
    }
    return options;
}

/**
 * Sends an inspect to a Cartesi Node with input payload
 * @param cartesiNodeUrl DApp's Cartesi Node URL
 * @param payload payload to send
 * @returns string
 */
export async function inspect(
    cartesiNodeUrl:string,
    payload:string,
):Promise<string>

/**
 * Sends an inspect to a Cartesi Node with input payload
 * @param cartesiNodeUrl DApp's Cartesi Node URL
 * @param payload payload to send
 * @param options options that have default values
 * @returns string
 */
export async function inspect(
    cartesiNodeUrl:string,
    payload:string,
    options:InspectOptions
):Promise<string|Uint8Array>

export async function inspect(
    cartesiNodeUrl:string,
    payload:string,
    options?:InspectOptions
):Promise<string|Uint8Array> {
    options = setDefaultInspectValues(options);

    let url = `${cartesiNodeUrl}/inspect/${payload}`;
    let response = await fetch(url, {method: 'GET', mode: 'cors',});

    if (response.status != 200) {
        throw Error(`Status code ${response.status}.`);
    }

    const response_json:InspectResponse = await response.json();

    let response_payload:string;
    if (options.aggregate) {
        response_payload = aggregate(response_json);
    } else {
        response_payload = response_json.reports[0].payload;
    }

    const result = decodeTo(response_payload, options.decodeTo);
    return result;
}


function aggregate(inspectResponse:InspectResponse):string {
    let agg_response = "0x";
    for (let i = 0; i < inspectResponse.reports.length; i++) {
        agg_response = agg_response.concat(
            inspectResponse.reports[i].payload.substring(2)
        );
    }

    return agg_response;
}

function decodeTo(payload:string, decodeOption:DECODE_OPTIONS_TYPE):string|Uint8Array {
    if (decodeOption === DECODE_OPTIONS[0]) {
        return payload;
    } else if (decodeOption === DECODE_OPTIONS[1]) {
        return utils.toUtf8String(payload);
    } else if (decodeOption === DECODE_OPTIONS[2]) {
        return utils.arrayify(payload);
    }

    throw Error(`Unkown decode option ${decodeOption}`);
}
