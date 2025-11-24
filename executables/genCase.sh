#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

./makeGenesis.sh \
    --do-besu-startup \
    --do-validation \
    --besu-dir "modules/isbe-besu-local-deployer" \
    --template-file "modules/isbe-genesis-files/DEV/case/genesis-case-dev.json" \
    --output-file "modules/isbe-genesis-files/DEV/case/genesis-case-dev-GEN2.json" \
    --gobernance-address 0x00000000000000000000000000000000000015BE