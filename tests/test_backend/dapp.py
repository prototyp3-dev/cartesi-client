from os import environ
import logging
import requests
import json
from eth_abi.abi import encode
from eth_abi_ext import decode_packed

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
network = environ["NETWORK"]
logger.info(f"HTTP rollup_server url is {rollup_server}")

# Function selector (first 4 bytes keccak256-encoded function signature) to be called during the execution of a voucher
WITHDRAW_ETHER_FUNCTION_SELECTOR = b'R/h\x15' # "withdrawEther(address,uint256)"
TRANSFER_ERC20_FUNCTION_SELECTOR = b'\xa9\x05\x9c\xbb' # "transfer(address,uint256)"
SAFE_TRANSFER_FROM_SELECTOR = b'B\x84.\x0e' # "safeTransferFrom(address,address,uint256)"

# Setup contracts addresses
dapp_address_relay = json.load(open(f'./deployments/{network}/DAppAddressRelay.json'))
ether_portal = json.load(open(f'./deployments/{network}/EtherPortal.json'))
erc20_portal = json.load(open(f'./deployments/{network}/ERC20Portal.json'))
erc721_portal = json.load(open(f'./deployments/{network}/ERC721Portal.json'))

rollup_address = "0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C"

def hex2str(hex):
    return bytes.fromhex(hex[2:]).decode("utf-8")

def str2hex(s:str):
    return "0x" + s.encode().hex()

def generate_outputs(notice:dict=None, report:dict=None, voucher:dict=None):
    if notice:
        requests.post(f"{rollup_server}/notice", json=notice)
        logger.info(f"1) Notice generated!")
    if report:
        requests.post(f"{rollup_server}/report", json=report)
        logger.info(f"2) Report generated!")
    if voucher:
        requests.post(f"{rollup_server}/voucher", json=voucher)
        logger.info(f"3) Voucher generated!")

def handle_ether_deposit(data):
    binary = bytes.fromhex(data["payload"][2:])
    try:
        decoded = decode_packed(['address', 'uint256'],binary)
    except Exception as e:
        error_msg = f"Payload does not conform to ETHER deposit ABI.\n{e}"
        requests.post(f"{rollup_server}/report", json={"payload": str2hex(error_msg)})

        return "reject"
    depositor = decoded[0]
    amount = decoded[1]

    # notice
    notice = {
        "payload": str2hex(f"Received an {amount} ETHER deposit from {depositor}.")
    }

    # voucher
    withdraw_ether_payload = WITHDRAW_ETHER_FUNCTION_SELECTOR + encode(['address', 'uint256'], [depositor, amount])
    voucher = {
        "destination": rollup_address,
        "payload": "0x" + withdraw_ether_payload.hex()
    }
    generate_outputs(notice=notice, voucher=voucher)

    return "accept"

def handle_erc20_deposit(data):
    binary = bytes.fromhex(data["payload"][2:])
    try:
        decoded = decode_packed(['bool', 'address', 'address', 'uint256'], binary)
    except Exception as e:
        error_msg = f"Payload does not conform to ERC20 deposit ABI\n{e}"
        requests.post(f"{rollup_server}/report", json={"payload": str2hex(error_msg)})

        return "reject"

    success = decoded[0]
    erc20 = decoded[1]
    depositor = decoded[2]
    amount = decoded[3]

    # notice
    notice = {
        "payload": str2hex(f"Received an {amount} ERC20({erc20}) deposit from {depositor}.")
    }

    # Voucher
    transfer_payload = TRANSFER_ERC20_FUNCTION_SELECTOR + encode(['address', 'uint256'], [depositor, amount])
    voucher = {
        "destination": erc20,
        "payload": "0x" + transfer_payload.hex()
    }
    generate_outputs(notice=notice, voucher=voucher)

    return "accept"

def handle_erc721_deposit(data):
    binary = bytes.fromhex(data["payload"][2:])
    try:
        decoded = decode_packed(['address', 'address', 'uint256', 'bytes'], binary)
    except Exception as e:
        error_msg = f"Payload does not conform to ERC20 deposit ABI\n{e}"
        requests.post(f"{rollup_server}/report", json={"payload": str2hex(error_msg)})

        return "reject"

    erc721 = decoded[0]
    depositor = decoded[1]
    tokenId = decoded[2]

    # notice
    notice = {
        "payload": str2hex(f"Received the deposit of ERC721({erc721}) token {tokenId} from {depositor}.")
    }

    # voucher
    transfer_payload = SAFE_TRANSFER_FROM_SELECTOR + encode(['address', 'address', 'uint256'], [rollup_address, depositor, tokenId])
    voucher = {
        "destination": erc721,
        "payload": "0x" + transfer_payload.hex()
    }
    generate_outputs(notice=notice, voucher=voucher)

    return "accept"


'''
{
    "notices": [
        {"payload": ...},
        {"payload": ...}
    ],
    "reports": [
        {"payload": ...},
        {"payload": ...}
    ]
}
'''
def handle_input(data):
    payload = json.loads(hex2str(data["payload"]))
    notices = payload.get("notices")
    if notices:
        for notice in notices:
            generate_outputs(notice={"payload": str2hex(notice["payload"])})

    reports = payload.get("reports")
    if reports:
        for report in reports:
            generate_outputs(report={"payload": str2hex(report["payload"])})

    return "accept"


def handle_advance(data):
    global rollup_address
    logger.info(f"Received advance request data {data}")
    try:
        if data["metadata"]["msg_sender"].lower() == dapp_address_relay['address'].lower():
            logger.debug("Setting DApp address")
            rollup_address = data["payload"]
            generate_outputs(report={"payload": str2hex(f"Dapp Address Set!\n The address is: {rollup_address}")})
            return "accept"
        if not rollup_address:
            raise Exception("Rollup Address is not set.")
        elif data["metadata"]["msg_sender"].lower() == ether_portal['address'].lower():
            return handle_ether_deposit(data)
        elif data["metadata"]["msg_sender"].lower() == erc20_portal['address'].lower():
            return handle_erc20_deposit(data)
        elif data["metadata"]["msg_sender"].lower() == erc721_portal['address'].lower():
            return handle_erc721_deposit(data)
        else:
            return handle_input(data)

    except Exception as e:
        error = f"Error processing data {data}\n{e}"
        payload = str2hex(error)
        requests.post(f"{rollup_server}/report", json={"payload": payload})
        return "reject"


def handle_inspect(data):
    logger.info(f"Received inspect request data {data}")
    return "accept"


handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
}

finish = {"status": "accept"}

while True:
    logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    logger.info(f"Received finish status {response.status_code}")
    if response.status_code == 202:
        logger.info("No pending rollup request, trying again")
    else:
        rollup_request = response.json()
        data = rollup_request["data"]
        handler = handlers[rollup_request["request_type"]]
        finish["status"] = handler(rollup_request["data"])
