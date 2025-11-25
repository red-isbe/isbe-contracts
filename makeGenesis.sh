#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Timer start
start=$(date +%s)

# Default values
BESU_DIR="../isbe-besu-local-deployer"
TEMPLATE_FILE="#"
OUTPUT_FILE="#"
GOBERNANCE_ADDRESS="#"
SECRET_FILE="config/pks_local_env.txt"
IS_LOCAL=false

TEMPORARY_OUTPUT_FILE="genesis_temp.json"

EXEC_BESU="bash install.sh -b"

# Flags
SKIP_GEN=false
SKIP_BESU_STARTUP=true
SKIP_VALIDATION=true
CHANGE_ALLOC=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-gen)
      SKIP_GEN=true
      shift
      ;;
    --do-besu-startup)
      SKIP_BESU_STARTUP=false
      shift
      ;;
    --do-validation)
      SKIP_VALIDATION=false
      shift
      ;;
    --besu-dir)
      BESU_DIR="$2"
      shift 2
      ;;
    --template-file)
      TEMPLATE_FILE="$2"
      shift 2
      ;;
    --output-file)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --gobernance-address)
      GOBERNANCE_ADDRESS="$2"
      shift 2
      ;;
    *)
      if [ $1 != --help ]; then
        echo "⚠️  Unknown argument: $1"
      fi
      echo ""
      echo "Usage:"
      echo "  --skip-gen                      Skip the genesis generation process."
      echo "  --do-besu-startup               Run the Besu startup procedure."
      echo "  --do-validation                 Execute post-start validation steps."
      echo "  --besu-dir <path>               Specify the directory containing the Besu build."
      echo "  --template-file <file>          Specify the genesis template JSON file to use. (MANDATORY)"
      echo "  --output-file <file>            Specify the generated output JSON file. (MANDATORY if not skipping genesis)"
      echo "  --gobernance-address <address>  Specify the governance contract address."
      echo ""
      echo "Example:"
      echo "  ./script.sh --skip-gen --do-besu-startup --besu-dir ./besu/"
      echo ""
      echo "Description:"
      echo "  This script orchestrates the Besu genesis setup. "
      shift
      exit 1
      ;;
  esac
done

if jq -e '.version == "genesis-local-template"' "$TEMPLATE_FILE" >/dev/null 2>&1; then
  echo "📁 Local genesis template detected."
  IS_LOCAL=true
fi

echo "📁 BESU_DIR set to: $BESU_DIR"
echo "   (use --besu-dir <path> to override)"
echo ""

if [ "$GOBERNANCE_ADDRESS" = "#" ]; then
  echo "📁 No Gobernance address specified."
  exit 1
fi

if [ "$TEMPLATE_FILE" = "#" ]; then
  echo "📁 Wrong template file specified."
  exit 1
fi

if [ "$OUTPUT_FILE" = "#" ] && [ "$SKIP_GEN" = false ]; then
  echo "📁 Wrong output file specified."
  exit 1
fi

if [ "$IS_LOCAL" = true ]; then
  echo "🔧 Modifying account allocations using: $TEMPLATE_FILE with secrests $SECRET_FILE"
  npx hardhat genesis:modifyAllocations --templatefile "$TEMPLATE_FILE" --outputfile "$TEMPORARY_OUTPUT_FILE" --pkfile "$SECRET_FILE"
  TEMPLATE_FILE="$TEMPORARY_OUTPUT_FILE"
  echo "✅ Account allocations modified in template file."
fi

# Step 1: Genesis generation
if [ "$SKIP_GEN" = false ]; then
  echo "🔧 Generating genesis..."
  EXEC_CHAIN="npx hardhat genesis:generate --templatefile "$TEMPLATE_FILE" --outputfile "$OUTPUT_FILE" --governanceaddress "$GOBERNANCE_ADDRESS""
  start=$(date +%s) 
  NODE_OPTIONS="--max-old-space-size=24576" $EXEC_CHAIN
  end=$(date +%s)
  elapsed=$(( end - start ))
  echo "✅ Generated: $OUTPUT_FILE in ${elapsed} seconds"
else
  echo "⏩ Skipping genesis generation (--skip-gen)"
fi

# ADAPT GENESIS TO LOCAL ENVIRONMENT
echo "🔧 Adapting genesis to local environment..."
if jq empty "$OUTPUT_FILE" >/dev/null 2>&1; then
  OUT_DIR="$BESU_DIR/config"
  OUT_FILE="$OUT_DIR/qbftConfigFile.json"
  TMP_FILE="$(mktemp)"

  jq -n --slurpfile g "$OUTPUT_FILE" '{
    genesis: $g[0],
    blockchain: {
      nodes: {
        generate: true,
        count: 4,
        besuVersion: "latest",
        ip: "172.16.240"
      }
    }
  }' > "$TMP_FILE"
  mv "$TMP_FILE" "$OUT_FILE"
else
  echo "$OUTPUT_FILE is not valid JSON" >&2
  echo "Skipping adaptation of genesis to local environment."
fi

echo "✅ Generated: $OUT_FILE"


# Step 2: Start Besu node network
if [ "$SKIP_BESU_STARTUP" = false ]; then
  echo "******************************************************************************************"
  echo "🚀 Starting Besu node network..."
  CURRENT_DIR=$(pwd)
  cd "$BESU_DIR" || exit 1
  $EXEC_BESU
  cd "$CURRENT_DIR" || exit 1
else
  echo "⏩ Skipping Besu startup (--skip-besu-startup)"
fi

# Step 3: Validate genesis
if [ "$SKIP_VALIDATION" = false ]; then
  npx hardhat genesis:validate --network NO_NETWORK --templatefile "$TEMPLATE_FILE" --governanceaddress "$GOBERNANCE_ADDRESS" 
  echo "✅ Genesis validation completed."
fi

rm -f "$TEMPORARY_OUTPUT_FILE"

end=$(date +%s)
elapsed=$(( end - start ))

echo "⏱️ Execution time: ${elapsed} seconds"