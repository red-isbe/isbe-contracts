# Dockerfile for role assignment execution
FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy Hardhat configuration and task definitions
COPY hardhat.config.ts ./
COPY tsconfig.json ./
COPY artifacts/  ./artifacts/
COPY config/ ./config/
COPY cache/ ./cache/
COPY deployment-configs/ ./deployment-configs/
COPY scripts/ ./scripts/
COPY tasks/ ./tasks/
COPY typechain-types/ ./typechain-types/
COPY types/ ./types/
COPY utils/  ./utils/

# Set entrypoint for Docker execution
ENTRYPOINT ["npx", "hardhat"]
