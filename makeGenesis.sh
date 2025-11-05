#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Timer start
start=$(date +%s)

# Default values
BESU_DIR="../isbe-besu-local-deployer"
TEMPLATE_FILE="#"
OUTPUT_FILE="#"

EXEC_BESU="bash install.sh -b"

# Flags
SKIP_GEN=false
SKIP_BESU_STARTUP=true
SKIP_VALIDATION=true
GENERATE_REGISTER=false

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
      GENERATE_REGISTER=true
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
    --do-generate-register)
      GENERATE_REGISTER=true
      shift
      ;;
    *)
      if [ $1 != --help ]; then
        echo "⚠️  Unknown argument: $1"
      fi
      echo ""
      echo "Usage:"
      echo "  --skip-gen              Skip the genesis generation process."
      echo "  --do-besu-startup       Run the Besu startup procedure."
      echo "  --do-validation          Execute post-start validation steps."
      echo "  --besu-dir <path>       Specify the directory containing the Besu build."
      echo "  --template-file <file>  Specify the genesis template JSON file to use. (MANDATORY)"
      echo "  --output-file <file>    Specify the generated output JSON file. (MANDATORY if not skipping genesis)"
      echo "  --do-generate-register     Generate contract register JSON. (Default: false)"
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

echo "📁 BESU_DIR set to: $BESU_DIR"
echo "   (use --besu-dir <path> to override)"
echo ""

if [ "$TEMPLATE_FILE" = "#" ]; then
  echo "📁 Wrong template file specified."
  exit 1
fi

if [ "$OUTPUT_FILE" = "#" ] && [ "$SKIP_GEN" = false ]; then
  echo "📁 Wrong template file specified."
  exit 1
fi

# Step 1: Genesis generation
if [ "$SKIP_GEN" = false ]; then
  echo "🔧 Generating genesis..."
  EXEC_CHAIN="npx hardhat genesis:generate --templatefile "$TEMPLATE_FILE" --outputfile "$OUTPUT_FILE""
  if [ "$GENERATE_REGISTER" = true ]; then
    EXEC_CHAIN="$EXEC_CHAIN --generateregister"
  fi
  NODE_OPTIONS="--max-old-space-size=24576" $EXEC_CHAIN
else
  echo "⏩ Skipping genesis generation (--skip-gen)"
fi

# ADAPT GENESIS TO LOCAL ENVIRONMENT
echo "🔧 Adapting genesis to local environment..."
if ! jq empty "$OUTPUT_FILE" >/dev/null 2>&1; then
  echo "❌ $OUTPUT_FILE no contiene JSON válido" >&2
  exit 1
fi

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
  npx hardhat genesis:validate --network NO_NETWORK --templatefile "$TEMPLATE_FILE" --outputfile "$OUTPUT_FILE"
  echo "✅ Genesis validation completed."
fi

end=$(date +%s)
elapsed=$(( end - start ))

echo "⏱️ Execution time: ${elapsed} seconds"