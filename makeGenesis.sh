#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Timer start
start=$(date +%s)

# Default values
BESU_DIR="../isbe-besu-local-deployer"
EXEC_BESU="bash install.sh -b"

# Flags
SKIP_GEN=false
SKIP_BESU_STARTUP=true
SKIP_VALIDATION=true

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

# Step 1: Genesis generation
if [ "$SKIP_GEN" = false ]; then
  echo "🔧 Generating genesis..."
  NODE_OPTIONS="--max-old-space-size=24576" npx hardhat genesis:generate
else
  echo "⏩ Skipping genesis generation (--skip-gen)"
fi

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
  npx hardhat genesis:validate --network NO_NETWORK 
  echo "✅ Genesis validation completed."
fi

end=$(date +%s)
elapsed=$(( end - start ))

echo "⏱️ Execution time: ${elapsed} seconds"