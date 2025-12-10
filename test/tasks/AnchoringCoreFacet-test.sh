#!/usr/bin/env bash
set -euo pipefail

# ----------------------------------------
# Configurable variables
# ----------------------------------------

# Network (can be overridden by first CLI argument or env var NETWORK)
NETWORK="${NETWORK:-genesis_validation_network_k1}"
if [[ "${1-}" != "" ]]; then
  NETWORK="$1"
fi

# Governance Diamond address
GOVERNANCE_DIAMOND="${GOVERNANCE_DIAMOND:-0x00000000000000000000000000000000000015BE}"

# Common parameters
CHAIN_ID="${CHAIN_ID:-1}"

# Pagination for getRegisteredChains
PAGE_INDEX="${PAGE_INDEX:-0}"
PAGE_LENGTH="${PAGE_LENGTH:-10}"

# Range for getBlocksInRange
FROM_BLOCK="${FROM_BLOCK:-100}"
TO_BLOCK="${TO_BLOCK:-110}"

# For getLastNBlocks
LAST_N_BLOCKS="${LAST_N_BLOCKS:-5}"

# For isBlockAnchored / getAnchoredBlock / anchorBlock
BLOCK_NUMBER="${BLOCK_NUMBER:-100}"
BLOCK_HASH="${BLOCK_HASH:-0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"
STATE_ROOT="${STATE_ROOT:-0x1111111111111111111111111111111111111111111111111111111111111111}"

# For registerChain (can be same as CHAIN_ID or different)
REGISTER_CHAIN_ID="${REGISTER_CHAIN_ID:-1}"

# For anchorBlocksBatch
BATCH_CHAIN_ID="${BATCH_CHAIN_ID:-1}"
BATCH_BLOCK_NUMBERS="${BATCH_BLOCK_NUMBERS:-100,101,102}"
BATCH_BLOCK_HASHES="${BATCH_BLOCK_HASHES:-0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb,0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc}"
BATCH_STATE_ROOTS="${BATCH_STATE_ROOTS:-0x1111111111111111111111111111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222222222222222222222222222,0x3333333333333333333333333333333333333333333333333333333333333333}"

echo "============================================"
echo " Running AnchoringCoreFacet tasks"
echo " Network            : ${NETWORK}"
echo " Governance Diamond : ${GOVERNANCE_DIAMOND}"
echo "============================================"
echo

# 1. anchoringcorefacet:getregisteredchains
echo "[*] Task 1/11: anchoringcorefacet:getregisteredchains"
npx hardhat anchoringcorefacet:getregisteredchains \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --pageindex "${PAGE_INDEX}" \
  --pagelength "${PAGE_LENGTH}"
echo

# 2. anchoringcorefacet:getchainmetadata
echo "[*] Task 2/11: anchoringcorefacet:getchainmetadata"
npx hardhat anchoringcorefacet:getchainmetadata \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}"
echo

# 3. anchoringcorefacet:getanchoringstats
echo "[*] Task 3/11: anchoringcorefacet:getanchoringstats"
npx hardhat anchoringcorefacet:getanchoringstats \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}"
echo

# 4. anchoringcorefacet:getblocksinrange
echo "[*] Task 4/11: anchoringcorefacet:getblocksinrange"
npx hardhat anchoringcorefacet:getblocksinrange \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}" \
  --fromblock "${FROM_BLOCK}" \
  --toblock "${TO_BLOCK}"
echo

# 5. anchoringcorefacet:getlastnblocks
echo "[*] Task 5/11: anchoringcorefacet:getlastnblocks"
npx hardhat anchoringcorefacet:getlastnblocks \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}" \
  --count "${LAST_N_BLOCKS}"
echo

# 6. anchoringcorefacet:isblockanchored
echo "[*] Task 6/11: anchoringcorefacet:isblockanchored"
npx hardhat anchoringcorefacet:isblockanchored \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}" \
  --blocknumber "${BLOCK_NUMBER}"
echo

# 7. anchoringcorefacet:getanchoredblock
echo "[*] Task 7/11: anchoringcorefacet:getanchoredblock"
npx hardhat anchoringcorefacet:getanchoredblock \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}" \
  --blocknumber "${BLOCK_NUMBER}"
echo

# 8. anchoringcorefacet:getlastanchoredblock
echo "[*] Task 8/11: anchoringcorefacet:getlastanchoredblock"
npx hardhat anchoringcorefacet:getlastanchoredblock \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}"
echo

# 9. anchoringcorefacet:registerchain
echo "[*] Task 9/11: anchoringcorefacet:registerchain"
npx hardhat anchoringcorefacet:registerchain \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${REGISTER_CHAIN_ID}"
echo

# 10. anchoringcorefacet:anchorblock
echo "[*] Task 10/11: anchoringcorefacet:anchorblock"
npx hardhat anchoringcorefacet:anchorblock \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${CHAIN_ID}" \
  --blocknumber "${BLOCK_NUMBER}" \
  --blockhash "${BLOCK_HASH}" \
  --stateroot "${STATE_ROOT}"
echo

# 11. anchoringcorefacet:anchorblocksbatch
echo "[*] Task 11/11: anchoringcorefacet:anchorblocksbatch"
npx hardhat anchoringcorefacet:anchorblocksbatch \
  --network "${NETWORK}" \
  --governancediamond "${GOVERNANCE_DIAMOND}" \
  --chainid "${BATCH_CHAIN_ID}" \
  --blocknumbers "${BATCH_BLOCK_NUMBERS}" \
  --blockhashes "${BATCH_BLOCK_HASHES}" \
  --stateroots "${BATCH_STATE_ROOTS}"
echo

echo "============================================"
echo " All AnchoringCoreFacet tasks executed."
echo "============================================"
