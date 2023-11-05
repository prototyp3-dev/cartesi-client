# syntax=docker.io/docker/dockerfile:1.4

# Deploy Cartesi's contracts locally
FROM cartesi/rollups-hardhat AS local-deployments

RUN <<EOF
  echo "Add localhost deployments"
  sh -c "npx hardhat deploy --write true --network hardhat"
EOF

ENTRYPOINT [ "/bin/sh" ]


# Build Machine
FROM --platform=linux/riscv64 cartesi/python:3.10-slim-jammy

LABEL io.sunodo.sdk_version=0.2.0
LABEL io.cartesi.rollups.ram_size=128Mi

ARG MACHINE_EMULATOR_TOOLS_VERSION=0.12.0
RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends build-essential=12.9ubuntu3
apt-get install -y --no-install-recommends busybox-static=1:1.30.1-7ubuntu3 ca-certificates=20230311ubuntu0.22.04.1 curl=7.81.0-1ubuntu1.14
curl -fsSL https://github.com/cartesi/machine-emulator-tools/releases/download/v${MACHINE_EMULATOR_TOOLS_VERSION}/machine-emulator-tools-v${MACHINE_EMULATOR_TOOLS_VERSION}.tar.gz \
  | tar -C / --overwrite -xvzf -
rm -rf /var/lib/apt/lists/*
EOF

ENV PATH="/opt/cartesi/bin:${PATH}"

#add deployments
COPY --from=local-deployments /app/rollups/deployments/hardhat/* /opt/cartesi/dapp/deployments/localhost/

WORKDIR /opt/cartesi/dapp
COPY ./requirements.txt .

RUN <<EOF
pip install -r requirements.txt --no-cache
find /usr/local/lib -type d -name __pycache__ -exec rm -r {} +
EOF

COPY ./eth_abi_ext.py .
COPY ./dapp.py .
COPY ./entrypoint.sh .

ENV ROLLUP_HTTP_SERVER_URL="http://127.0.0.1:5004"

ENTRYPOINT [ "./entrypoint.sh" ]