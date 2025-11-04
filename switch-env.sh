#!/bin/bash

# ISBE Environment Switcher
# Switches between secp256k1 and secp256r1 .env configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 ISBE Environment Switcher${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# Check if required files exist
if [[ ! -f ".env.secp256k1" ]]; then
    echo -e "${RED}❌ Error: .env.secp256k1 not found${NC}"
    exit 1
fi

if [[ ! -f ".env.secp256r1" ]]; then
    echo -e "${RED}❌ Error: .env.secp256r1 not found${NC}"
    exit 1
fi

# Show current configuration
if [[ -f ".env" ]]; then
    CURRENT_CURVE=$(grep -o "Curve: SECP256[KR]1" .env | head -1 || echo "Unknown")
    echo -e "${YELLOW}📋 Current configuration: ${CURRENT_CURVE}${NC}"
else
    echo -e "${YELLOW}📋 No current .env file${NC}"
fi

echo ""
echo "Available configurations:"
echo "  1) secp256k1 (Standard Ethereum)"
echo "  2) secp256r1 (P-256/Hyperledger Besu)"
echo ""

# Get user choice
read -p "Select configuration (1 or 2): " choice

case $choice in
    1)
        cp .env.secp256k1 .env
        echo -e "${GREEN}✅ Switched to secp256k1 configuration${NC}"
        echo -e "${BLUE}📍 Network: Use 'localhost' (secp256k1)${NC}"
        ;;
    2)
        cp .env.secp256r1 .env
        echo -e "${GREEN}✅ Switched to secp256r1 configuration${NC}"
        echo -e "${BLUE}📍 Network: Use 'customR1Network' (secp256r1)${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please select 1 or 2.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}💡 Deployment commands:${NC}"
if [[ $choice == "1" ]]; then
    echo "   npx hardhat deployAll --network localhost"
    echo "   npx hardhat curveAwareDeployAll --network localhost"
else
    echo "   npx hardhat deployAll --network customR1Network"
    echo "   npx hardhat curveAwareDeployAll --network customR1Network"
fi

echo ""
echo -e "${GREEN}🎯 Environment switch completed!${NC}"