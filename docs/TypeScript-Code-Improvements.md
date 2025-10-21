# TypeScript/JavaScript Code Improvement Recommendations

This document provides comprehensive recommendations for improving the TypeScript and JavaScript code quality in the ISBE contracts project. These recommendations focus on type safety, maintainability, performance, and best practices.

## 📋 **Executive Summary**

After analyzing the codebase, we identified several areas for improvement across code organization, type safety, error handling, and maintainability. The recommendations are prioritized by impact and implementation effort.

## 🚨 **Critical Issues (High Priority)**

### 🆕 1. secp256r1 Event Handling Technical Debt

**Status**: 🔴 Critical - Recently Introduced  
**Effort**: High  
**Impact**: High

**Background**: Recent fixes for secp256r1 RoleGranted event detection have introduced significant technical debt that should be addressed in the next development cycle.

#### Issues Identified:

**A. Complex Event Detection Logic**

The `grantRole.ts` file now contains multiple fallback mechanisms that make the code complex and hard to maintain:

```typescript
// Current problematic implementation (lines 182-250+)
export async function grantRoleWithRawTransaction(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ role: string; account: string; sender: string }> {
    // ... 200+ lines of complex logic with multiple fallbacks

    // Multiple log parsing attempts
    for (let i = 0; i < finalReceipt.logs.length; i++) {
        /* ... */
    }

    // Receipt refetching logic
    if (receipt.logs.length === 0) {
        // Try multiple approaches to get logs
        const freshReceipt = await provider.getTransactionReceipt(
            txResponse.hash
        )
        // Try getting logs from the block directly
        const logs = await provider.getLogs({
            /* complex filter */
        })
    }

    // Manual event parsing by topic hash
    const matchingLogs = finalReceipt.logs.filter(
        (log) => log.topics[0] === roleGrantedTopic
    )

    // Fallback state validation with dynamic imports
    const { hasRole } = await import('./hasRole')
    const roleCheck = await hasRole(
        roleToGrant,
        accountToGrantTo,
        diamond,
        signer
    )
}
```

**Problems:**

- Single function with 250+ lines and multiple responsibilities
- Complex nested fallback logic that's hard to follow
- Dynamic imports that complicate dependency tracking
- Hardcoded topic hashes and magic numbers
- Mixed concerns: transaction execution, event parsing, state validation

**B. Inconsistent Error Handling**

```typescript
// Current inconsistent patterns
try {
    const signer = await signatureProvider.getSigner()
    provider = signer.provider
} catch {
    // Fallback to accessing HRE provider directly if signature provider exposes it
    if ('hre' in signatureProvider && signatureProvider.hre?.ethers?.provider) {
        provider = signatureProvider.hre.ethers.provider
    }
}

// Mix of error handling styles
console.log(
    `   ⚠️  Could not verify role state: ${stateCheckError instanceof Error ? stateCheckError.message : String(stateCheckError)}`
)
```

**Problems:**

- Inconsistent error handling patterns (try/catch vs instanceof checks)
- Silent failures in some fallback paths
- Mixed console.log error reporting instead of structured errors
- Provider access using string-in checks instead of proper interfaces

**C. Role Constant Management Issue**

Fixed a critical bug where wrong role constant was used:

```typescript
// Fixed in PreCommitValidator.ts (line 903)
const ISBE_PAUSER_ROLE =
    '0x643e67198985fdbcfc2807234f580aa2cab96bb7efe1ab3158da79255d493114' // CORRECT
// Was: '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239' // WRONG (ISBE_ROLE)
```

**Problems:**

- Magic string constants scattered across files
- No centralized role management
- Easy to introduce similar errors in future

#### Recommended Refactoring (High Priority):

**1. Create Specialized Event Detection Service**

```typescript
// services/EventDetectionService.ts
export interface EventDetectionResult<T = any> {
    found: boolean
    event?: T
    source: 'receipt' | 'block-logs' | 'state-validation'
    metadata: {
        transactionHash: string
        blockNumber: number
        gasUsed: bigint
        attempts: string[]
    }
}

export class Secp256r1EventDetectionService {
    constructor(
        private provider: Provider,
        private contractInterface: Interface
    ) {}

    async detectRoleGrantedEvent(
        txHash: string,
        expectedRole: string,
        expectedAccount: string,
        contractAddress: string
    ): Promise<EventDetectionResult<RoleGrantedEvent>> {
        const attempts: string[] = []

        // Strategy 1: Standard receipt parsing
        try {
            const result = await this.parseFromReceipt(txHash)
            if (result.found)
                return {
                    ...result,
                    source: 'receipt',
                    metadata: {
                        /* ... */
                    },
                }
            attempts.push('receipt-parsing')
        } catch (error) {
            attempts.push(`receipt-parsing-failed: ${error.message}`)
        }

        // Strategy 2: Block-based log retrieval
        try {
            const result = await this.parseFromBlockLogs(
                txHash,
                expectedRole,
                contractAddress
            )
            if (result.found)
                return {
                    ...result,
                    source: 'block-logs',
                    metadata: {
                        /* ... */
                    },
                }
            attempts.push('block-logs')
        } catch (error) {
            attempts.push(`block-logs-failed: ${error.message}`)
        }

        // Strategy 3: Direct state validation
        try {
            const result = await this.validateFromContractState(
                expectedRole,
                expectedAccount,
                contractAddress
            )
            return {
                ...result,
                source: 'state-validation',
                metadata: {
                    /* ... */
                },
            }
        } catch (error) {
            attempts.push(`state-validation-failed: ${error.message}`)
            return {
                found: false,
                source: 'state-validation',
                metadata: { attempts /* ... */ },
            }
        }
    }

    private async parseFromReceipt(
        txHash: string
    ): Promise<Partial<EventDetectionResult>> {
        // Clean, focused implementation
    }

    private async parseFromBlockLogs(
        txHash: string,
        role: string,
        address: string
    ): Promise<Partial<EventDetectionResult>> {
        // Clean, focused implementation
    }

    private async validateFromContractState(
        role: string,
        account: string,
        address: string
    ): Promise<Partial<EventDetectionResult>> {
        // Clean, focused implementation
    }
}
```

**2. Centralized Role Constants**

```typescript
// constants/Roles.ts
export const ISBE_ROLES = {
    DEFAULT_ADMIN:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    PAUSER: '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
    ISBE_PAUSER:
        '0x643e67198985fdbcfc2807234f580aa2cab96bb7efe1ab3158da79255d493114', // CORRECT VALUE
    ISBE: '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239',
    // ... other roles from contracts/constants/roles.sol
} as const

// Type safety
export type IsbeRoleType = keyof typeof ISBE_ROLES
export type IsbeRoleValue = (typeof ISBE_ROLES)[IsbeRoleType]

// Validation
export function validateRole(role: string): role is IsbeRoleValue {
    return Object.values(ISBE_ROLES).includes(role as IsbeRoleValue)
}

// Usage in PreCommitValidator.ts
import { ISBE_ROLES } from '../constants/Roles'

// Replace hardcoded string with constant
const ISBE_PAUSER_ROLE = ISBE_ROLES.ISBE_PAUSER
```

**3. Simplified grantRole Function**

```typescript
// Refactored grantRole.ts
export async function grantRole(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ role: string; account: string; sender: string }> {
    // Input validation
    validateRole(roleToGrant)
    validateEthereumAddress(accountToGrantTo)
    validateEthereumAddress(diamond)

    // Execute transaction based on curve type
    const txHash = await this.executeRoleGrant(
        roleToGrant,
        accountToGrantTo,
        diamond,
        signatureProvider
    )

    // Detect event with specialized service
    const eventService = new Secp256r1EventDetectionService(
        await signatureProvider.getSigner().provider,
        AccessControlGovernanceFacet__factory.createInterface()
    )

    const result = await eventService.detectRoleGrantedEvent(
        txHash,
        roleToGrant,
        accountToGrantTo,
        diamond
    )

    if (!result.found) {
        throw new TransactionError(
            `Role grant verification failed: ${result.metadata.attempts.join(', ')}`,
            txHash
        )
    }

    // Log diagnostic info for secp256r1 debugging
    if (signatureProvider.getCurveType() === 'secp256r1') {
        logger.debug('secp256r1 role grant completed', {
            source: result.source,
            attempts: result.metadata.attempts.length,
            gasUsed: result.metadata.gasUsed.toString(),
        })
    }

    return result.event
}
```

### 2. JavaScript to TypeScript Migration

**Status**: 🔴 Critical  
**Effort**: Medium  
**Impact**: High

Several key files are still in JavaScript and should be migrated to TypeScript for better type safety and developer experience:

#### Files to Migrate:

- `scripts/check-coverage.js`
- `scripts/post-docgen.js`
- `.solcover.js`
- `commitlint.config.js`

#### Example Migration:

**Before** (`scripts/check-coverage.js`):

```javascript
const fs = require('fs')

const coverage = JSON.parse(
    fs.readFileSync('./coverage/coverage-final.json', 'utf8')
)

const thresholds = {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100,
}
```

**After** (`scripts/check-coverage.ts`):

```typescript
import fs from 'fs'

interface CoverageMetric {
    covered: number
    total: number
}

interface CoverageData {
    [filename: string]: {
        s?: Record<string, number> // Statements
        f?: Record<string, number> // Functions
        b?: Record<string, number[][]> // Branches
    }
}

interface Thresholds {
    lines: number
    branches: number
    functions: number
    statements: number
}

const coverage: CoverageData = JSON.parse(
    fs.readFileSync('./coverage/coverage-final.json', 'utf8')
)

const thresholds: Thresholds = {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100,
}

const total: Record<keyof Thresholds, CoverageMetric> = {
    lines: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    statements: { covered: 0, total: 0 },
}
```

### 2. Hardhat Configuration Improvements ✅ **COMPLETED**

**Status**: ✅ **Implemented**  
**Effort**: Medium  
**Impact**: High

🆕 **Update**: The hardhat configuration has been completely refactored with a new unified system!

#### ✅ **Issues Resolved**:

- ✅ Repetitive account key processing logic → **Centralized in AccountManager**
- ✅ Lack of proper environment variable validation → **Environment validation implemented**
- ✅ Mixed configuration responsibilities → **Separated into dedicated modules**
- ✅ **New**: Silent-by-default logging with debug mode
- ✅ **New**: Unified network configuration with environment variable overrides

#### ✅ **Improvements Implemented**:

**✅ Account Management Extracted** (`config/AccountManager.ts` - **Implemented**):

```typescript
// ✅ IMPLEMENTED: config/AccountManager.ts with debug-aware logging
import { logger } from '../utils/logger'

export class AccountManager {
    private static normalizePrivateKey(key: string): string {
        return key.startsWith('0x') ? key : `0x${key}`
    }

    private static validatePrivateKey(key: string): boolean {
        const normalized = this.normalizePrivateKey(key)
        return /^0x[a-fA-F0-9]{64}$/.test(normalized)
    }

    static getAccounts(): string[] {
        const accountsEnv = process.env.ACCOUNTS
        if (!accountsEnv) {
            console.warn(
                '⚠️ ACCOUNTS not found in environment, generating random keys'
            )
            return Array.from(
                { length: 10 },
                () => '0x' + randomBytes(32).toString('hex')
            )
        }

        const accounts = accountsEnv
            .split(',')
            .map((key) => this.normalizePrivateKey(key.trim()))

        // Validate all keys
        const invalidKeys = accounts.filter(
            (key) => !this.validatePrivateKey(key)
        )
        if (invalidKeys.length > 0) {
            throw new Error(
                `Invalid private keys detected: ${invalidKeys.length} invalid keys`
            )
        }

        return accounts
    }

    static getSecp256r1Accounts(): Array<{
        address: string
        privateKey: string
    }> {
        const keys = this.getAccounts()
        return keys.map((privateKey) => {
            const wallet = new ethers.Wallet(privateKey)
            return {
                address: wallet.address,
                privateKey: privateKey.startsWith('0x')
                    ? privateKey.slice(2)
                    : privateKey,
            }
        })
    }
}
```

**✅ Network Configuration Unified** (`config/networks.ts` - **Implemented**):

🆕 **Major Update**: All network configurations are now centralized in a single, clean file!

```typescript
// ✅ IMPLEMENTED: config/networks.ts - Unified Network Configuration
import { AccountManager } from './AccountManager'
import type {
    NetworkConfigWithCurve,
    HardhatNetworkConfig,
    NetworksConfig,
} from '../types/networks'

// Environment variables for dynamic configuration
const LOCALHOST_URL = process.env.LOCALHOST_URL || 'http://172.16.240.30:8545'
const MVP_URL =
    process.env.MVP_URL ||
    'https://besu-node-non-validator-1.mvp.envs.redisbe.com'
// ... other environment variables

export class NetworkConfigManager {
    private accounts: string[]
    private secp256r1Accounts: Array<{ address: string; privateKey: string }>

    constructor() {
        this.accounts = AccountManager.getAccounts()
        this.secp256r1Accounts = AccountManager.getSecp256r1Accounts()
    }

    getNetworkConfigs(): Record<string, NetworkConfigWithCurve> {
        return {
            hardhat: this.createHardhatConfig(),
            localhost: this.createLocalhostConfig(),
            mvp: this.createMvpConfig(),
            // ... other networks
        }
    }

    private createHardhatConfig(): NetworkConfigWithCurve {
        return {
            mining: { auto: true, interval: 0 },
            blockGasLimit: 30000000,
            allowUnlimitedContractSize: true,
            curve: 'secp256k1',
        }
    }

    // ... other config methods
}
```

## 🔧 **Code Organization & Structure**

### 3. Extract Common Utilities

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: Medium

Create centralized utility modules to reduce code duplication and improve maintainability.

#### Create Ethereum Utilities:

```typescript
// utils/ethereum.ts
export function normalizePrivateKey(key: string): string {
    return key.startsWith('0x') ? key : `0x${key}`
}

export function validatePrivateKey(key: string): boolean {
    const normalized = normalizePrivateKey(key)
    return /^0x[a-fA-F0-9]{64}$/.test(normalized)
}

export function validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/i.test(address)
}

export function validateBytes32(input: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(input)
}
```

#### Enhanced Validation Utilities:

```typescript
// utils/validation.ts
export class ValidationError extends Error {
    constructor(field: string, value: any, expected: string) {
        super(`Invalid ${field}: ${value}. Expected: ${expected}`)
        this.name = 'ValidationError'
    }
}

export function isValidBytes(input: string): boolean {
    if (!/^0x[0-9a-fA-F]+$/.test(input)) {
        return false
    }
    const hexPart = input.slice(2)
    return hexPart.length % 2 === 0
}

export function isValidBytesAndLength(
    input: string,
    byteLength: number
): boolean {
    if (!isValidBytes(input)) {
        return false
    }
    return input.length === 2 + byteLength * 2
}

export function validateBusinessId(businessId: string): void {
    if (!isValidBytesAndLength(businessId, 32)) {
        throw new ValidationError(
            'businessId',
            businessId,
            '32-byte hex string (0x + 64 hex characters)'
        )
    }
}

export function validateBytecode(bytecode: string): void {
    if (!isValidBytes(bytecode)) {
        throw new ValidationError(
            'bytecode',
            bytecode,
            'valid hex string starting with 0x'
        )
    }
}
```

### 4. Improve Error Handling

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: High

Replace generic error handling with custom error classes for better debugging and user experience.

#### Custom Error Classes:

```typescript
// utils/errors.ts
export class IsbeError extends Error {
    constructor(
        message: string,
        public code?: string
    ) {
        super(message)
        this.name = this.constructor.name
    }
}

export class ValidationError extends IsbeError {
    constructor(field: string, value: any, expected: string) {
        super(`Invalid ${field}: ${value}. Expected: ${expected}`)
    }
}

export class TransactionError extends IsbeError {
    constructor(
        message: string,
        public txHash?: string,
        public blockNumber?: number
    ) {
        super(message)
    }
}

export class ContractInteractionError extends IsbeError {
    constructor(
        message: string,
        public contractAddress: string,
        public methodName?: string
    ) {
        super(`Contract interaction failed at ${contractAddress}: ${message}`)
    }
}

export class NetworkError extends IsbeError {
    constructor(
        message: string,
        public networkName: string
    ) {
        super(`Network error on ${networkName}: ${message}`)
    }
}
```

#### Enhanced Event Handling:

```typescript
// scripts/utils/getEvent.ts
import { ContractTransactionResponse, BaseContract } from 'ethers'
import { TransactionError } from '../utils/errors'

export async function getEvent(
    eventName: string,
    tx: ContractTransactionResponse,
    contract: BaseContract
) {
    const receipt = await tx.wait()

    if (!receipt) {
        throw new TransactionError('Transaction receipt is null', tx.hash)
    }

    let event = null
    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log)
            if (parsed && parsed.name === eventName) {
                event = parsed
                break
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            throw new TransactionError(
                `Error parsing event logs: ${errorMessage}`,
                tx.hash,
                receipt.blockNumber
            )
        }
    }

    if (!event) {
        throw new TransactionError(
            `Event '${eventName}' not found in transaction receipt`,
            tx.hash,
            receipt.blockNumber
        )
    }

    return event
}
```

## 📋 **Type Safety Improvements**

### 5. Add Comprehensive Type Definitions

**Status**: 🟡 Important  
**Effort**: Medium  
**Impact**: High

Create comprehensive type definitions to improve IntelliSense and catch errors at compile time.

```typescript
// types/contracts.ts
import { BigNumberish } from 'ethers'

export interface DeploymentResult {
    businessId: string
    businessAddress: string
    version: BigNumberish
    txHash: string
    blockNumber: number
    gasUsed: BigNumberish
    timestamp: Date
}

export interface BusinessData {
    businessId: string
    version: number
    description?: string
}

export interface ConfigurationData {
    configurationId: string
    businessData: BusinessData[]
    version: BigNumberish
    timestamp: Date
}

export interface RoleData {
    role: string
    account: string
    sender: string
    granted: boolean
    timestamp: Date
}
```

```typescript
// types/networks.ts
export type CurveType = 'secp256k1' | 'secp256r1'

export interface NetworkConfig {
    url: string
    chainId: number
    accounts: string[]
    gasPrice: number
    gas: number
    blockGasLimit: number
    curve: CurveType
    mining?: {
        auto: boolean
        interval: number
    }
    allowUnlimitedContractSize?: boolean
}

export interface Secp256r1Account {
    address: string
    privateKey: string
    publicKey?: string
}

export interface NetworkConfigWithCurve extends NetworkConfig {
    secp256r1Accounts?: Secp256r1Account[]
}
```

### 6. Strengthen Function Parameters with Branded Types

**Status**: 🟢 Nice to Have  
**Effort**: Medium  
**Impact**: Medium

Use branded types to prevent mixing up similar string parameters.

```typescript
// types/branded.ts
declare const __brand: unique symbol
type Brand<B> = { [__brand]: B }
export type Branded<T, B> = T & Brand<B>

// Branded types for common Ethereum concepts
export type Address = Branded<string, 'Address'>
export type BusinessId = Branded<string, 'BusinessId'>
export type Bytecode = Branded<string, 'Bytecode'>
export type RoleHash = Branded<string, 'RoleHash'>
export type TransactionHash = Branded<string, 'TransactionHash'>

// Type guards
export function isAddress(value: string): value is Address {
    return /^0x[a-fA-F0-9]{40}$/.test(value)
}

export function isBusinessId(value: string): value is BusinessId {
    return /^0x[a-fA-F0-9]{64}$/.test(value)
}

export function isBytecode(value: string): value is Bytecode {
    return /^0x[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0
}

// Factory functions
export function createAddress(value: string): Address {
    if (!isAddress(value)) {
        throw new ValidationError('address', value, 'valid Ethereum address')
    }
    return value as Address
}

export function createBusinessId(value: string): BusinessId {
    if (!isBusinessId(value)) {
        throw new ValidationError('businessId', value, '32-byte hex string')
    }
    return value as BusinessId
}
```

#### Updated Function Signatures:

```typescript
// scripts/businessLogic/deployBusinessLogic.ts
import {
    BusinessId,
    Address,
    Bytecode,
    createBusinessId,
    createAddress,
    createBytecode,
} from '../../types/branded'

export async function deployBusinessLogic(
    businessId: BusinessId,
    bytecode: Bytecode,
    factory: Address,
    signatureProvider: ISignatureProvider
): Promise<DeploymentResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for business logic deployment...`
    )

    const signer = await signatureProvider.getSigner()
    const businessLogicFactory = await getIsbeFactory(factory, signer)

    console.log('📡 Sending deployBusinessLogic transaction...')
    const tx = await businessLogicFactory.deploy(businessId, bytecode)

    console.log('⏳ Waiting for transaction to be mined...')
    const deployedEvent = await getEvent('Deployed', tx, businessLogicFactory)

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
        txHash: tx.hash,
        blockNumber: (await tx.wait())!.blockNumber,
        gasUsed: (await tx.wait())!.gasUsed,
        timestamp: new Date(),
    }
}

// Wrapper function for backward compatibility
export async function deployBusinessLogicSafe(
    businessId: string,
    bytecode: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<DeploymentResult> {
    return deployBusinessLogic(
        createBusinessId(businessId),
        createBytecode(bytecode),
        createAddress(factory),
        signatureProvider
    )
}
```

## ⚡ **Performance & Best Practices**

### 7. Async/Await Improvements

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: Medium

Replace sequential async operations with concurrent processing where appropriate.

#### Before (Sequential Processing):

```typescript
// tasks/deployTest.ts - Current implementation
for (let i = 0; i < DEFAULT_BUSINESS_LOGICS_CODE_PATHS.length; i++) {
    const bytecodeContentDefault = fs
        .readFileSync(
            path.resolve(DEFAULT_BUSINESS_LOGICS_CODE_PATHS[i]),
            'utf8'
        )
        .trim()

    const bytecodeDefault = JSON.parse(bytecodeContentDefault).bytecode

    const resultDeployDefaultBL = await deployBusinessLogic(
        DEFAULT_BUSINESS_LOGICS_IDS[i],
        bytecodeDefault,
        GovernanceAddress,
        signatureProvider
    )
}
```

#### After (Concurrent Processing):

```typescript
// Enhanced deployment with concurrency
interface BusinessLogicDeployment {
    path: string
    id: string
    description: string
}

const businessLogicConfigs: BusinessLogicDeployment[] = [
    {
        path: './artifacts/contracts/proxies/isbeproxy/facets/IsbeCutFacet.sol/IsbeCutFacet.json',
        id: '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25',
        description: 'ISBE Cut Facet',
    },
    // ... other configs
]

async function deployBusinessLogicsConcurrently(
    configs: BusinessLogicDeployment[],
    governanceAddress: Address,
    signatureProvider: ISignatureProvider
): Promise<DeploymentResult[]> {
    console.log(
        `🚀 Deploying ${configs.length} business logics concurrently...`
    )

    const deploymentPromises = configs.map(async (config, index) => {
        try {
            console.log(
                `📦 [${index + 1}/${configs.length}] Loading ${config.description}...`
            )

            const bytecodeContent = await fs.promises.readFile(
                path.resolve(config.path),
                'utf8'
            )
            const bytecode = JSON.parse(bytecodeContent.trim()).bytecode

            const result = await deployBusinessLogic(
                createBusinessId(config.id),
                createBytecode(bytecode),
                governanceAddress,
                signatureProvider
            )

            console.log(
                `✅ [${index + 1}/${configs.length}] ${config.description} deployed successfully`
            )
            return { ...result, description: config.description }
        } catch (error) {
            console.error(
                `❌ [${index + 1}/${configs.length}] Failed to deploy ${config.description}:`,
                error
            )
            throw new Error(`Failed to deploy ${config.description}: ${error}`)
        }
    })

    const results = await Promise.allSettled(deploymentPromises)

    const successful = results
        .filter(
            (r): r is PromiseFulfilledResult<DeploymentResult> =>
                r.status === 'fulfilled'
        )
        .map((r) => r.value)

    const failed = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason)

    console.log(
        `📊 Deployment Summary: ${successful.length} successful, ${failed.length} failed`
    )

    if (failed.length > 0) {
        console.error('Failed deployments:', failed)
        throw new Error(`${failed.length} business logic deployments failed`)
    }

    return successful
}
```

### 8. Configuration Management

**Status**: 🟡 Important  
**Effort**: Medium  
**Impact**: Medium

Create a centralized configuration manager for better maintainability.

```typescript
// config/ConfigManager.ts
import { NetworkConfigWithCurve } from '../types/networks'
import { ValidationError } from '../utils/errors'

export class ConfigManager {
    private static instance: ConfigManager
    private config: Record<string, any> = {}

    private constructor() {
        this.loadConfig()
    }

    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager()
        }
        return ConfigManager.instance
    }

    private loadConfig(): void {
        try {
            this.config = {
                networks: this.validateNetworkConfigs(),
                accounts: this.validateAccounts(),
                deployment: this.getDeploymentConfig(),
                testing: this.getTestingConfig(),
            }
        } catch (error) {
            throw new Error(`Configuration loading failed: ${error}`)
        }
    }

    private validateNetworkConfigs(): Record<string, NetworkConfigWithCurve> {
        // Implementation for network validation
        const networkManager = new NetworkConfigManager()
        return networkManager.getNetworkConfigs()
    }

    private validateAccounts(): string[] {
        const accounts = AccountManager.getAccounts()
        console.log(`✅ Loaded ${accounts.length} valid accounts`)
        return accounts
    }

    private getDeploymentConfig() {
        return {
            gasLimit: 30000000,
            timeout: 300000,
            retries: 3,
            confirmations: 1,
        }
    }

    private getTestingConfig() {
        return {
            timeout: 60000,
            parallel: true,
            coverage: {
                threshold: {
                    lines: 100,
                    branches: 100,
                    functions: 100,
                    statements: 100,
                },
            },
        }
    }

    getNetworkConfig(name: string): NetworkConfigWithCurve {
        const config = this.config.networks[name]
        if (!config) {
            throw new ValidationError('network', name, 'valid network name')
        }
        return config
    }

    getAccounts(): string[] {
        return this.config.accounts
    }

    getDeploymentConfig() {
        return this.config.deployment
    }

    getTestingConfig() {
        return this.config.testing
    }
}
```

## 🧪 **Testing & Documentation**

### 9. Test Performance Optimizations ✅ **COMPLETED**

**Status**: ✅ **Successfully Implemented**  
**Effort**: Medium  
**Impact**: High

#### ✅ **Performance Improvements Achieved**:

**Before Optimization:**

- Total test suite: 18 seconds (556 tests)
- ERC20 tests: 12 seconds (50 tests)
- Average per test: ~32ms

**After Optimization:**

- Total test suite: 13 seconds (556 tests) - **28% improvement**
- ERC20 tests: 6 seconds (50 tests) - **50% improvement**
- Average per test: ~23ms
- Performance gain: 5 seconds total runtime reduction

#### ✅ **Key Bottlenecks Resolved**:

**1. Eliminated Redundant `deployGovernance()` Calls:**

```typescript
// ❌ BEFORE: Inefficient pattern (Fixed)
async function deployInitializedFixture() {
    const contracts = await deployFixture()      // deployGovernance() call #1
    const result = await deployGovernance(...)   // deployGovernance() call #2 ❌
    return { ...contracts, ...result }
}

// ✅ AFTER: Optimized pattern
async function deployInitializedFixture() {
    const result = await deployGovernance(
        owner,
        [],
        undefined,
        false,
        '0x',
        [ERC20_RESOLVER_KEY, ERC20_CAPPED_RESOLVER_KEY],
        [initData1, initData2] // Initialization in single call
    )
    return result
}
```

**2. Shared Fixture System Implementation:**

- **Created `test/fixtures/common.ts`** with 5 standardized fixtures
- **Single deployment per fixture** pattern
- **Eliminated nested fixture calls**
- **Appropriate fixture choice** based on test requirements

**Available Fixtures:**

```typescript
// Located in test/fixtures/common.ts
export async function deployBasicERC20Fixture() // Basic ERC20 without initialization
export async function deployInitializedERC20Fixture() // Initialized ERC20 with standard params
export async function deployPausedERC20Fixture() // Initialized ERC20 in paused state
export async function deployPreparedERC20Fixture() // ERC20 with all roles granted
export async function deployLightweightERC20Fixture() // Minimal deployment for unit tests
export async function getTestSigners() // Standard signer utility
```

**3. Test Strategy Optimization:**

```typescript
// ✅ Optimized usage patterns

// Unit tests - use lightweight
await loadFixture(deployLightweightERC20Fixture)

// Integration tests - use standard
await loadFixture(deployInitializedERC20Fixture)

// Complex scenarios - use full governance
await loadFixture(() => deployGovernance(...))
```

#### ✅ **Files Optimized**:

1. **test/ERC20.spec.ts** (820 lines)
    - Eliminated 3 redundant `deployGovernance()` calls
    - **50% performance improvement** (12s → 6s)
    - Fixed fixtures: `deployInitializedFixture`, `deployPausedFixture`, `deployPreparedTokensFixture`

2. **test/fixtures/common.ts** (New - 234 lines)
    - Created shared fixture utilities
    - Standardized deployment patterns
    - Added lightweight deployment options

#### ✅ **Best Practices Established**:

```typescript
// ✅ Good - Use shared fixtures
import { deployInitializedERC20Fixture } from '../fixtures/common'

// ❌ Avoid - Custom deployment in each test
async function myCustomDeployment() {
    const result = await deployGovernance(...)
    // ... custom setup
}

// ✅ Good - Single deployment with all setup
async function deployMyFeatureFixture() {
    const result = await deployGovernance(owner, rbacs, config, pause, init, businessIds, data)
    await setupSpecificRequirements(result)
    return result
}

// ❌ Avoid - Multiple deployments
async function deployMyFeatureFixture() {
    const basic = await deployBasicFixture()
    const enhanced = await deployGovernance(...)  // Redundant!
    return { ...basic, ...enhanced }
}
```

#### 📊 **Performance Monitoring**:

**Benchmarking Commands:**

```bash
# Test specific files
npm test test/ERC20.spec.ts
npm test test/governance/ProxyFactory.spec.ts

# Full suite with performance monitoring
npm test
npm run test:coverage
```

**Performance Targets Achieved:**

- ✅ Individual tests: <50ms average (achieved: ~23ms)
- ✅ File test suites: <2s for <50 tests
- ✅ Full test suite: <15s (achieved: 13s)

### 10. Enhanced JSDoc Comments

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: Medium

Add comprehensive JSDoc comments to all public functions.

````typescript
/**
 * Deploys business logic to the ISBE network using the specified signature provider
 *
 * This function handles the complete deployment process including validation,
 * transaction submission, and event parsing. It supports both secp256k1 and
 * secp256r1 signature providers automatically.
 *
 * @param businessId - Unique identifier for the business logic (32-byte hex string)
 * @param bytecode - Compiled contract bytecode (must be valid hex string)
 * @param factory - Address of the ISBE factory contract
 * @param signatureProvider - Provider for signing transactions (secp256k1 or secp256r1)
 *
 * @returns Promise resolving to deployment result with address, version, and metadata
 *
 * @throws {ValidationError} When businessId format is invalid (not 32-byte hex)
 * @throws {ValidationError} When bytecode format is invalid (not valid hex)
 * @throws {TransactionError} When deployment transaction fails or times out
 * @throws {ContractInteractionError} When factory contract interaction fails
 *
 * @example
 * ```typescript
 * const signatureProvider = SignatureProviderFactory.create(hre)
 * const result = await deployBusinessLogic(
 *   "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
 *   "0x608060405234801561001057600080fd5b50...",
 *   "0xFactoryAddress123456789012345678901234567890",
 *   signatureProvider
 * )
 *
 * console.log(`✅ Business logic deployed at: ${result.businessAddress}`)
 * console.log(`📊 Version: ${result.version}`)
 * console.log(`⛽ Gas used: ${result.gasUsed}`)
 * ```
 *
 * @example Using with error handling
 * ```typescript
 * try {
 *   const result = await deployBusinessLogic(businessId, bytecode, factory, provider)
 *   console.log('Deployment successful:', result.businessAddress)
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Invalid input:', error.message)
 *   } else if (error instanceof TransactionError) {
 *     console.error('Transaction failed:', error.message, 'TX:', error.txHash)
 *   } else {
 *     console.error('Unexpected error:', error)
 *   }
 * }
 * ```
 *
 * @see {@link ISignatureProvider} for signature provider interface
 * @see {@link SignatureProviderFactory} for creating signature providers
 * @see {@link getBusinessLogicAddress} for retrieving deployed business logic addresses
 *
 * @since 0.0.5
 * @version 1.0.0
 */
export async function deployBusinessLogic(
    businessId: BusinessId,
    bytecode: Bytecode,
    factory: Address,
    signatureProvider: ISignatureProvider
): Promise<DeploymentResult> {
    // Implementation...
}
````

### 10. ESLint Configuration Enhancements

**Status**: 🟢 Nice to Have  
**Effort**: Low  
**Impact**: Low

Enhance ESLint configuration to catch more potential issues.

```javascript
// eslint.config.mjs - Enhanced configuration
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.strict,
    {
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/prefer-readonly': 'warn',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            '@typescript-eslint/prefer-optional-chain': 'warn',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-definitions': [
                'error',
                'interface',
            ],
            '@typescript-eslint/consistent-type-imports': 'error',

            // General rules
            'prefer-const': 'error',
            'no-var': 'error',
            'no-console': 'off', // Keep console for this project
            'no-debugger': 'error',
            'no-alert': 'error',

            // Best practices
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'no-throw-literal': 'error',
            'prefer-promise-reject-errors': 'error',

            // Async/await
            'require-await': 'error',
            'no-return-await': 'error',
            'prefer-async-await': 'error',
        },
    },
    {
        // Test file overrides
        files: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*', 'tests/**/*'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-unused-expressions': 'off',
        },
    },
    {
        // Configuration file overrides
        files: ['*.config.{js,ts,mjs}', 'hardhat.config.ts'],
        rules: {
            '@typescript-eslint/no-var-requires': 'off',
            'no-console': 'off',
        },
    },
    {
        ignores: [
            'typechain-types/**',
            'build/**',
            'coverage/**',
            'artifacts/**',
            'cache/**',
            'docs/generated/**',
            'node_modules/**',
        ],
    }
)
```

## 🚨 **secp256r1 Technical Debt (Urgent)**

### 11. secp256r1 Address Derivation Issue

**Status**: 🔴 Critical  
**Effort**: High  
**Impact**: High

```typescript
// secp256r1Utils.ts - Current derivation method
export function deriveEthereumAddress(publicKey: string): string {
    const pubKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey
    if (pubKey.length !== 128) {
        throw new Error(`Invalid public key length: ${pubKey.length}, expected 128`)
    }
    const pubKeyBuffer = Buffer.from(pubKey, 'hex')
    const hash = createKeccakHash(pubKeyBuffer)
    return '0x' + hash.slice(-40)
}

// AccountManager.ts - Different method using ethers.Wallet
static getSecp256r1Accounts(): Secp256r1Account[] {
    const keys = this.getAccounts()
    return keys.map((privateKey) => {
        const wallet = new ethers.Wallet(privateKey)
        return {
            address: wallet.address,
            privateKey: privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey,
        }
    })
}
```

**Problems**:

- Two different methods for deriving Ethereum addresses from secp256r1 keys
- Potential inconsistency in address generation
- Risk of deploying contracts to unexpected addresses
- Possible transaction signing issues

**Solution**:

```typescript
// New unified secp256r1 address management
export class Secp256r1AddressManager {
    private static instance: Secp256r1AddressManager

    private constructor() {}

    static getInstance(): Secp256r1AddressManager {
        if (!this.instance) {
            this.instance = new Secp256r1AddressManager()
        }
        return this.instance
    }

    deriveAddress(input: { publicKey?: string; privateKey?: string }): string {
        if (input.privateKey) {
            return this.deriveFromPrivateKey(input.privateKey)
        }
        if (input.publicKey) {
            return this.deriveFromPublicKey(input.publicKey)
        }
        throw new Error('Either publicKey or privateKey must be provided')
    }

    private deriveFromPrivateKey(privateKey: string): string {
        // Standardized derivation using ethers.Wallet
        const normalizedKey = privateKey.startsWith('0x')
            ? privateKey
            : `0x${privateKey}`
        const wallet = new ethers.Wallet(normalizedKey)
        return wallet.address.toLowerCase()
    }

    private deriveFromPublicKey(publicKey: string): string {
        // Direct derivation for public keys
        const normalizedKey = publicKey.startsWith('04')
            ? publicKey.slice(2)
            : publicKey
        if (normalizedKey.length !== 128) {
            throw new Error(
                `Invalid public key length: ${normalizedKey.length}, expected 128`
            )
        }
        const pubKeyBuffer = Buffer.from(normalizedKey, 'hex')
        const hash = createKeccakHash(pubKeyBuffer)
        return `0x${hash.slice(-40)}`.toLowerCase()
    }
}

// Updated account manager
export class AccountManager {
    static getSecp256r1Accounts(): Secp256r1Account[] {
        const addressManager = Secp256r1AddressManager.getInstance()
        return this.getAccounts().map((privateKey) => ({
            address: addressManager.deriveAddress({ privateKey }),
            privateKey: privateKey.startsWith('0x')
                ? privateKey.slice(2)
                : privateKey,
        }))
    }
}
```

### 12. Centralized secp256r1 Event Detection

**Status**: 🔴 Critical  
**Effort**: High  
**Impact**: High

```typescript
// Current scattered event detection logic
export async function grantRoleWithRawTransaction(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ role: string; account: string; sender: string }> {
    // ... 250+ lines of complex nested fallback logic
}
```

**Solution**:

```typescript
// services/Secp256r1EventDetectionService.ts
export interface EventDetectionResult<T = any> {
    found: boolean
    event?: T
    source: 'receipt' | 'block-logs' | 'state-validation'
    metadata: EventMetadata
}

interface EventMetadata {
    transactionHash: string
    blockNumber: number
    gasUsed: bigint
    attempts: string[]
}

export class Secp256r1EventDetectionService {
    constructor(
        private provider: Provider,
        private contractInterface: Interface,
        private logger = createLogger('Secp256r1EventDetection')
    ) {}

    async detectEvent(
        txHash: string,
        eventName: string,
        expectedValues: Record<string, any>
    ): Promise<EventDetectionResult> {
        const attempts: string[] = []
        let result: Partial<EventDetectionResult>

        // Strategy 1: Standard receipt parsing
        try {
            result = await this.parseFromReceipt(
                txHash,
                eventName,
                expectedValues
            )
            if (result.found)
                return this.createResult(result, 'receipt', attempts)
            attempts.push('receipt-parsing')
        } catch (error) {
            this.logger.debug('Receipt parsing failed', { error })
            attempts.push(`receipt-parsing-failed: ${error.message}`)
        }

        // Strategy 2: Block-based log retrieval
        try {
            result = await this.parseFromBlockLogs(
                txHash,
                eventName,
                expectedValues
            )
            if (result.found)
                return this.createResult(result, 'block-logs', attempts)
            attempts.push('block-logs')
        } catch (error) {
            this.logger.debug('Block logs parsing failed', { error })
            attempts.push(`block-logs-failed: ${error.message}`)
        }

        // Strategy 3: State validation
        try {
            result = await this.validateFromContractState(expectedValues)
            return this.createResult(result, 'state-validation', attempts)
        } catch (error) {
            this.logger.debug('State validation failed', { error })
            attempts.push(`state-validation-failed: ${error.message}`)
            return {
                found: false,
                source: 'state-validation',
                metadata: { attempts },
            }
        }
    }

    private createResult(
        result: Partial<EventDetectionResult>,
        source: string,
        attempts: string[]
    ): EventDetectionResult {
        return {
            ...result,
            source,
            metadata: {
                attempts,
                ...result.metadata,
            },
        }
    }

    // Implementation of detection strategies...
}
```

### 13. Unified secp256r1 Management

**Status**: 🔴 Critical  
**Effort**: High  
**Impact**: High

```typescript
// Current: Scattered logic across multiple files
// - secp256r1Utils.ts
// - secp256r1TransactionSigner.ts
// - secp256r1DeploymentUtils.ts
// - networkUtils.ts
// - AccountManager.ts
```

**Solution**:

```typescript
// New unified manager
export class Secp256r1Manager {
    private static instance: Secp256r1Manager
    private addressManager = Secp256r1AddressManager.getInstance()
    private eventDetection: Secp256r1EventDetectionService
    private networkConfig: NetworkConfigWithCurve
    private logger = createLogger('Secp256r1Manager')

    private constructor(networkConfig: NetworkConfigWithCurve) {
        this.networkConfig = networkConfig
    }

    static getInstance(
        networkConfig: NetworkConfigWithCurve
    ): Secp256r1Manager {
        if (!this.instance) {
            this.instance = new Secp256r1Manager(networkConfig)
        }
        return this.instance
    }

    // Address management
    deriveAddress(input: { publicKey?: string; privateKey?: string }): string {
        return this.addressManager.deriveAddress(input)
    }

    // Event detection
    async detectEvent(
        txHash: string,
        eventName: string,
        expectedValues: Record<string, any>
    ): Promise<EventDetectionResult> {
        return this.eventDetection.detectEvent(
            txHash,
            eventName,
            expectedValues
        )
    }

    // Transaction signing
    async signTransaction(tx: TransactionRequest): Promise<SignedTransaction> {
        // Implementation using secp256r1TransactionSigner
    }

    // Network validation
    isSecp256r1Network(): boolean {
        return this.networkConfig.curve === 'secp256r1'
    }

    // Configuration validation
    validateConfiguration(): ConfigurationValidationResult {
        // Implementation
    }

    // Diagnostic utilities
    async validateDeployment(
        deploymentResult: DeploymentResult
    ): Promise<void> {
        // Implementation
    }

    getDiagnosticInfo(): SepcDiagnosticInfo {
        return {
            networkType: this.networkConfig.curve,
            chainId: this.networkConfig.chainId,
            validationSettings: this.networkConfig.validation,
        }
    }
}

// Usage example
const manager = Secp256r1Manager.getInstance(networkConfig)

// Address derivation
const address = manager.deriveAddress({ privateKey: '0x123...' })

// Event detection
const result = await manager.detectEvent(txHash, 'RoleGranted', {
    role: ROLES.ADMIN,
    account: address,
})

// Transaction signing
const signedTx = await manager.signTransaction({
    to: address,
    value: parseEther('1.0'),
})
```

## 🏗️ **Architecture Improvements**

### 14. Factory Pattern for Contract Interactions

**Status**: 🟢 Nice to Have  
**Effort**: Medium  
**Impact**: Medium

Create a factory pattern for consistent contract interactions.

```typescript
// contracts/ContractFactory.ts
import type { ISignatureProvider } from '../tasks/deployment/providers/ISignatureProvider'
import type { NetworkConfigWithCurve } from '../types/networks'
import type { Address } from '../types/branded'

export class ContractFactory {
    private signerCache = new Map<string, any>()

    constructor(
        private signatureProvider: ISignatureProvider,
        private networkConfig: NetworkConfigWithCurve
    ) {}

    async getSigner() {
        const curve = this.signatureProvider.getCurveType()
        if (!this.signerCache.has(curve)) {
            const signer = await this.signatureProvider.getSigner()
            this.signerCache.set(curve, signer)
        }
        return this.signerCache.get(curve)!
    }

    async getIsbeFactory(address: Address) {
        const signer = await this.getSigner()
        return getIsbeFactory(address, signer)
    }

    async getAccessControl(address: Address) {
        const signer = await this.getSigner()
        return getAccessControl(address, signer)
    }

    async getDiamondLoupe(address: Address) {
        const signer = await this.getSigner()
        return getDiamondLoupe(address, signer)
    }

    async getDiamondCut(address: Address) {
        const signer = await this.getSigner()
        return getDiamondCut(address, signer)
    }

    async getPause(address: Address) {
        const signer = await this.getSigner()
        return getPause(address, signer)
    }

    // Utility methods
    getCurveType(): 'secp256k1' | 'secp256r1' {
        return this.signatureProvider.getCurveType()
    }

    getNetworkInfo() {
        return {
            chainId: this.networkConfig.chainId,
            curve: this.networkConfig.curve,
            url: this.networkConfig.url,
        }
    }
}
```

### 12. Environment-Specific Configuration

**Status**: 🟢 Nice to Have  
**Effort**: Low  
**Impact**: Low

Create environment-specific configurations.

```typescript
// config/environments.ts
export interface EnvironmentConfig {
    gasLimit: number
    gasPrice: number
    timeout: number
    retries: number
    confirmations: number
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error'
        enableColors: boolean
        enableTimestamps: boolean
    }
}

export const environments: Record<string, EnvironmentConfig> = {
    development: {
        gasLimit: 30000000,
        gasPrice: 0,
        timeout: 60000,
        retries: 1,
        confirmations: 1,
        logging: {
            level: 'debug',
            enableColors: true,
            enableTimestamps: true,
        },
    },
    testing: {
        gasLimit: 30000000,
        gasPrice: 1,
        timeout: 60000,
        retries: 3,
        confirmations: 1,
        logging: {
            level: 'warn',
            enableColors: false,
            enableTimestamps: false,
        },
    },
    production: {
        gasLimit: 8000000,
        gasPrice: 20000000000, // 20 gwei
        timeout: 300000,
        retries: 5,
        confirmations: 3,
        logging: {
            level: 'info',
            enableColors: false,
            enableTimestamps: true,
        },
    },
} as const

export type EnvironmentName = keyof typeof environments

export function getEnvironmentConfig(env: EnvironmentName): EnvironmentConfig {
    const config = environments[env]
    if (!config) {
        throw new Error(`Unknown environment: ${env}`)
    }
    return config
}

export function getCurrentEnvironment(): EnvironmentName {
    const env = process.env.NODE_ENV as EnvironmentName
    return env in environments ? env : 'development'
}
```

## 📋 **Implementation Roadmap**

### Phase 0: Critical secp256r1 Debt Resolution (Week 1) - URGENT

1. 🔴 **Refactor secp256r1 Event Detection** - URGENT
    - ❌ Extract EventDetectionService from `grantRole.ts` (250+ line function)
    - ❌ Centralize role constants from `contracts/constants/roles.sol`
    - ❌ Replace hardcoded magic strings and topic hashes
    - ❌ Implement proper error handling patterns
    - ❌ Add structured logging for secp256r1 debugging
    - ❌ Create proper interfaces for provider access patterns

2. 🔴 **Role Constants Management** - URGENT
    - ❌ Create `constants/Roles.ts` with type-safe role definitions
    - ❌ Update `PreCommitValidator.ts` to use centralized constants
    - ❌ Add role validation functions and type guards
    - ❌ Sync with Solidity role definitions in build process

3. 🔴 **Event Handling Architecture** - HIGH PRIORITY
    - ❌ Separate transaction execution from event detection concerns
    - ❌ Create reusable event detection patterns for other functions
    - ❌ Implement proper retry and timeout mechanisms
    - ❌ Add comprehensive logging for debugging secp256r1 issues

### Phase 1: Foundation (Week 2) - High Priority

1. ✅ **Convert JavaScript files to TypeScript** ✅ **COMPLETED**
    - ✅ `scripts/check-coverage.js` → `scripts/check-coverage.ts`
    - ✅ `scripts/post-docgen.js` → `scripts/post-docgen.ts`
    - ✅ Update `package.json` scripts to use `npx ts-node`
    - ✅ Added `ts-node` and `typescript` dependencies
    - ✅ Enhanced with proper interfaces and type safety
    - ✅ Improved error handling and documentation

2. ✅ **Add custom error classes** ✅ **COMPLETED**
    - ✅ Created `utils/errors.ts` with 9+ specialized error types
    - ✅ Base `IsbeError` class with JSON serialization and context
    - ✅ Specific errors: `ValidationError`, `TransactionError`, `ContractInteractionError`, `NetworkError`, `ConfigurationError`, `SignatureError`, `FileSystemError`, `TimeoutError`, `BatchError`
    - ✅ Updated `scripts/utils/getEvent.ts` with custom error handling
    - ✅ Enhanced `scripts/check-coverage.ts` and `scripts/post-docgen.ts` with custom errors
    - ✅ Utility functions: `isIsbeError()`, `getErrorMessage()`, `createErrorContext()`

3. ✅ **Extract common utilities** ✅ **COMPLETED**
    - ✅ Created `utils/ethereum.ts` with comprehensive Ethereum utilities
    - ✅ Enhanced `scripts/utils/validation.ts` with custom error integration
    - ✅ Added address validation, private key handling, hex string utilities
    - ✅ Common constants and conversion functions
    - ✅ Type-safe validation with helpful error suggestions

4. ✅ **Improve `hardhat.config.ts`** ✅ **COMPLETED**
    - ✅ **Extract account management logic** → `config/AccountManager.ts`
    - ✅ **Add proper error handling and validation** → Custom error classes integrated
    - ✅ **Unified network configuration** → `config/networks.ts`
    - ✅ **Silent-by-default logging** → `utils/logger.ts`
    - ✅ **Environment variable support** → Network URL overrides

### Phase 2: Type Safety (Week 2) - Medium Priority

1. ✅ **Add comprehensive type definitions**
    - Create `types/contracts.ts`, `types/networks.ts`
    - Add interfaces for all major data structures

2. ✅ **Enhance JSDoc comments**
    - Add comprehensive documentation to all public functions
    - Include examples and error handling information

3. ✅ **Improve async/await patterns**
    - Replace sequential operations with concurrent where appropriate
    - Add proper error handling for async operations

### Phase 3: Architecture (Week 3) - Low Priority

1. ✅ **Implement ConfigManager** ✅ **COMPLETED**
    - ✅ **Centralize configuration management** → `config/ConfigManager.ts`
    - ✅ **Add environment-specific configs** → Environment detection and validation
    - ✅ **Unified network configuration** → `config/networks.ts`
    - ✅ **Debug-aware logging** → `utils/logger.ts`

2. ✅ **Add ContractFactory pattern**
    - Standardize contract interaction patterns
    - Add caching for frequently used signers

3. ✅ **Enhance ESLint configuration**
    - Add stricter rules for better code quality
    - Configure environment-specific overrides

### Phase 4: Advanced Features (Week 4) - Nice to Have

1. 🔄 **Branded types implementation**
    - Add branded types for type safety
    - Create type guards and factory functions

2. 🔄 **Advanced error handling**
    - Implement retry mechanisms
    - Add circuit breaker patterns for network calls

3. 🔄 **Performance optimizations**
    - Add connection pooling for contract interactions
    - Implement smart caching strategies

### 15. Enhanced Event Detection for All Curve Types

```typescript
// services/EventDetectionService.ts
export class EventDetectionService {
    constructor(
        private provider: Provider,
        private contractInterface: Interface,
        private curveType: 'secp256k1' | 'secp256r1'
    ) {}

    async detectEvent(
        txHash: string,
        eventName: string,
        expectedValues: Record<string, any>,
        options?: EventDetectionOptions
    ): Promise<EventDetectionResult> {
        // Use appropriate strategy based on curve type
        const strategy = this.getDetectionStrategy(options)
        return strategy.detectEvent(txHash, eventName, expectedValues)
    }

    private getDetectionStrategy(
        options?: EventDetectionOptions
    ): IEventDetectionStrategy {
        if (this.curveType === 'secp256r1') {
            return new Secp256r1EventDetectionStrategy(
                this.provider,
                this.contractInterface,
                options
            )
        }
        return new StandardEventDetectionStrategy(
            this.provider,
            this.contractInterface,
            options
        )
    }
}

// Usage
const eventService = new EventDetectionService(
    provider,
    contractInterface,
    'secp256r1'
)

const result = await eventService.detectEvent(txHash, 'Transfer', {
    from: sender,
    to: recipient,
    value: amount,
})
```

## 🎯 **Quick Wins (Start Immediately)**

You can implement these improvements right away with minimal effort:

### 1. TypeScript Configuration

```json
// tsconfig.json - Add these compiler options
{
    "compilerOptions": {
        "strict": true,
        "noImplicitReturns": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "exactOptionalPropertyTypes": true
    }
}
```

### 2. Basic Type Annotations

Add return type annotations to functions:

```typescript
// Before
export async function deployBusinessLogic(/* params */) {

// After
export async function deployBusinessLogic(/* params */): Promise<DeploymentResult> {
```

### 3. Input Validation

Add validation to all public functions:

```typescript
export async function deployBusinessLogic(
    businessId: string,
    bytecode: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<DeploymentResult> {
    // Add validation at the start
    validateBusinessId(businessId)
    validateBytecode(bytecode)
    validateAddress(factory)

    // Rest of function...
}
```

### 4. Replace console.log with Structured Logging ✅ **IMPLEMENTED**

✅ **We've implemented a debug-aware logger that's silent by default!**

```typescript
// ✅ IMPLEMENTED: utils/logger.ts
export const logger = {
    error: (...args: any[]) => {
        if (isDebugEnabled()) {
            console.error(...args)
        }
    },
    warn: (...args: any[]) => {
        if (isDebugEnabled()) {
            console.warn(...args)
        }
    },
    info: (...args: any[]) => {
        if (isDebugEnabled()) {
            console.log(...args)
        }
    },
    success: (message: string, details?: any) => {
        if (isDebugEnabled()) {
            console.log(`✅ ${message}`)
            if (details) {
                console.log('[DEBUG]', details)
            }
        }
    },
    summary: (title: string, data: Record<string, any>) => {
        if (isDebugEnabled()) {
            console.log(`📊 ${title}:`)
            // ... detailed breakdown
        }
        // Silent in normal mode
    },
}

// Enable with: DEBUG=true or NODE_ENV=development
```

### 5. Constants File

```typescript
// constants/roles.ts
export const ROLES = {
    DEFAULT_ADMIN:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    PAUSE_ROLE:
        '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
    CONFIG_MANAGER:
        '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239',
} as const

// constants/config.ts
export const CONFIG = {
    DEFAULT_CONFIG_ID:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    SALT: '0x0000000000000000000000000000000000000000000000000000000000000001',
} as const
```

## 📊 **Expected Benefits**

Implementing these recommendations will provide:

- **🔒 Better Type Safety**: Catch errors at compile time instead of runtime
- **🚀 Improved Developer Experience**: Better IntelliSense and autocomplete
- **🛡️ Enhanced Error Handling**: More informative error messages and better debugging
- **📈 Better Maintainability**: Cleaner code structure and separation of concerns
- **⚡ Performance Improvements**: Concurrent processing where appropriate
- **📚 Better Documentation**: Comprehensive JSDoc comments for all functions
- **🧪 Easier Testing**: Better structured code is easier to test
- **🔄 Future-Proofing**: Modern TypeScript patterns and best practices

## 🚀 **Getting Started**

To begin implementing these recommendations:

1. **Create a feature branch**: `git checkout -b feat/typescript-improvements`
2. **Start with Phase 1 items** (high priority, quick wins)
3. **Run tests frequently**: `npm run test:coverage` to ensure nothing breaks
4. **Update documentation**: Keep README and docs in sync
5. **Create small, focused PRs**: Don't try to implement everything at once

Remember: The goal is to improve code quality incrementally while maintaining the existing functionality. Start with the high-impact, low-effort improvements first!

## 🎨 **Code Style & Quality**

### 16. ESLint Improvements

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: Medium

Enhance ESLint configuration for better code quality:

```typescript
// .eslintrc.js
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'security', 'sonarjs', 'import', 'unicorn'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:security/recommended',
        'plugin:sonarjs/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    rules: {
        // TypeScript
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/strict-boolean-expressions': 'warn',

        // Security
        'security/detect-object-injection': 'error',
        'security/detect-non-literal-require': 'error',
        'security/detect-possible-timing-attacks': 'warn',

        // Best Practices
        'sonarjs/cognitive-complexity': ['error', 20],
        'sonarjs/no-duplicate-string': 'warn',
        'sonarjs/no-identical-functions': 'warn',

        // Import/Export
        'import/no-cycle': 'error',
        'import/no-self-import': 'error',
        'import/no-useless-path-segments': 'error',

        // General
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'prefer-const': 'error',
        'no-var': 'error',
    },
    overrides: [
        {
            files: ['**/*.test.ts', '**/test/**/*'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                'sonarjs/no-duplicate-string': 'off',
            },
        },
    ],
}
```

### 17. Path Aliases

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: Medium

```typescript
// tsconfig.json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@core/*": ["src/core/*"],
            "@utils/*": ["src/utils/*"],
            "@types/*": ["src/types/*"],
            "@config/*": ["src/config/*"],
            "@services/*": ["src/services/*"],
            "@test/*": ["test/*"]
        }
    }
}

// Usage
import { Secp256r1Manager } from '@core/secp256r1/Secp256r1Manager'
import { EventDetectionService } from '@services/events/EventDetectionService'
import { NetworkConfig } from '@types/networks'
```

### 18. TypeScript Configuration

**Status**: 🟡 Important  
**Effort**: Low  
**Impact**: Medium

```json
// tsconfig.json
{
    "compilerOptions": {
        "target": "es2020",
        "module": "commonjs",
        "lib": ["es2020"],
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true,
        "importsNotUsedAsValues": "error",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    },
    "include": ["src", "test", "scripts", "tasks"],
    "exclude": ["node_modules", "dist"]
}
```

## 🏆 **Implementation Results (Phase 1 Completed + Critical Debt Added)**

### ✅ **Successfully Implemented**

As of **October 2025**, the following Phase 1 improvements have been successfully implemented:

### 🚨 **Critical Technical Debt Added (October 2025)**

**secp256r1 Event Detection Fixes** - While functionally successful, recent fixes for secp256r1 RoleGranted event detection have introduced significant technical debt:

- **250+ line function** in `grantRole.ts` with multiple fallback mechanisms
- **Complex nested try/catch logic** for event detection across 3 different strategies
- **Hardcoded role constants** that caused the original bug (wrong `ISBE_PAUSER_ROLE` value)
- **Mixed error handling patterns** with both structured and console.log approaches
- **Dynamic imports** and provider access via string-in checks
- **Multiple concerns in single function**: transaction execution + event parsing + state validation

**Impact**: The fixes work correctly and deployments now pass, but the code is harder to maintain and test. This should be prioritized for refactoring in the next development cycle.

#### 🆕 D. secp256r1 Management Architecture Issues

**Background**: Analysis of the secp256r1 implementation reveals a distributed architecture with inconsistencies and potential maintenance challenges.

**Critical Inconsistency - Address Derivation**:

```typescript
// TWO DIFFERENT METHODS for secp256r1 address derivation:

// Method 1: secp256r1Utils.ts - Custom Keccak-256 implementation
export function deriveEthereumAddress(publicKey: string): string {
    const pubKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey
    if (pubKey.length !== 128) {
        throw new Error(`Invalid public key length: ${pubKey.length}, expected 128`)
    }
    const pubKeyBuffer = Buffer.from(pubKey, 'hex')
    const hash = createKeccakHash(pubKeyBuffer)
    return '0x' + hash.slice(-40)
}

// Method 2: AccountManager.ts - Uses ethers.Wallet
static getSecp256r1Accounts(): Secp256r1Account[] {
    const keys = this.getAccounts()
    return keys.map((privateKey) => {
        const wallet = new ethers.Wallet(privateKey)  // <-- DIFFERENT APPROACH!
        return {
            address: wallet.address,  // <-- Potentially different address!
            privateKey: privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey,
        }
    })
}
```

**Risk**: This inconsistency could generate different addresses for the same private key, potentially causing:

- Deployment failures to unexpected addresses
- Transaction signing with wrong account
- State validation failures
- Asset loss or inaccessible contracts

**Scattered Architecture Issues**:

```typescript
// secp256r1 logic spread across multiple files:

// 1. Cryptographic operations - secp256r1Utils.ts
export function generateSecp256r1KeyPair(): Secp256r1KeyPair
export function signMessageHash(messageHash: string, privateKey: string)

// 2. Network detection - networkUtils.ts
export function isSecp256r1Network(hre: HardhatRuntimeEnvironment): boolean
export function getNetworkCurve(hre: HardhatRuntimeEnvironment): EllipticCurve

// 3. Account management - AccountManager.ts
static getAccountsForCurve(curve: 'secp256k1' | 'secp256r1')

// 4. Transaction signing - secp256r1TransactionSigner.ts
export class Secp256r1TransactionSigner implements TransactionSigner

// 5. Provider selection - SignatureProviderFactory.ts
static create(hre: HardhatRuntimeEnvironment): ISignatureProvider

// 6. Curve detection - getCurveAwareSigner.ts
export async function getCurveAwareSigner()
```

**Problems with Current Distribution**:

1. **No Single Source of Truth**: Configuration and behavior scattered across 6+ files
2. **Inconsistent Validation**: Different validation rules in different modules
3. **Mixed Responsibilities**: Account management mixes curve detection with account creation
4. **Configuration Drift**: No centralized secp256r1-specific settings
5. **Error Handling Inconsistencies**: Different error patterns across components
6. **Testing Complexity**: Hard to test secp256r1 behavior comprehensively

**Immediate Actions Required**:

1. **Address Derivation Fix** (Critical - Next Sprint)
    - Standardize on secp256r1Utils.deriveEthereumAddress approach
    - Update AccountManager to use consistent address derivation
    - Add validation tests for address consistency
    - Audit existing deployments for address mismatches

2. **Architecture Assessment** (High Priority)
    - Create secp256r1 management strategy document
    - Design unified Secp256r1Manager interface
    - Plan migration strategy for existing scattered logic
    - Define centralized configuration approach

**Recommended Solution Path**:

```typescript
// Proposed unified architecture:

// 1. Centralized Manager
export class Secp256r1Manager {
    private config: Secp256r1Config
    private utils: Secp256r1Utils
    private providers: Map<string, ISignatureProvider>

    // Single source of truth for all secp256r1 operations
    async createAccount(privateKey: string): Promise<Secp256r1Account>
    async getProvider(network: string): Promise<ISignatureProvider>
    async signTransaction(tx: Transaction): Promise<SignedTransaction>
    validateConfiguration(): ValidationResult
}

// 2. Unified Configuration
interface Secp256r1Config {
    enabled: boolean
    addressDerivationMethod: 'keccak256' // Standardize on one approach
    fallbackStrategies: ('receipt' | 'block-logs' | 'state-validation')[]
    validationLevel: 'strict' | 'permissive'
    providers: ProviderConfig[]
}

// 3. Consistent Error Handling
export class Secp256r1Error extends IsbeError {
    constructor(operation: string, details: any, cause?: Error)
}
```

**See**: `docs/secp256r1-Management-Strategy.md` for comprehensive refactoring plan.

### ✅ **Legacy Phase 1 Improvements**

#### **1. JavaScript to TypeScript Migration**

- **Files Converted**:
    - `scripts/check-coverage.js` → `scripts/check-coverage.ts` (140 lines, fully typed)
    - `scripts/post-docgen.js` → `scripts/post-docgen.ts` (225 lines, fully typed)
- **Enhancements Added**:
    - Comprehensive interfaces for all data structures
    - Proper error handling with custom error classes
    - JSDoc documentation for all functions
    - Type-safe operations throughout
- **Dependencies Updated**:
    - Added `typescript@^5.6.3` and `ts-node@^10.9.2`
    - Updated `package.json` scripts to use `npx ts-node`

#### **2. Custom Error System**

- **Core Error Classes** (`utils/errors.ts` - 421 lines):
    - `IsbeError` - Base error class with JSON serialization
    - `ValidationError` - Input validation failures with suggestions
    - `TransactionError` - Blockchain transaction failures
    - `ContractInteractionError` - Smart contract interaction failures
    - `NetworkError` - Network-related failures
    - `ConfigurationError` - Configuration issues
    - `SignatureError` - Signature operation failures
    - `FileSystemError` - File system operation failures
    - `TimeoutError` - Timeout scenarios
    - `BatchError` - Batch operation failures

- **Utility Functions**:
    - `isIsbeError()` - Type guard for error checking
    - `getErrorMessage()` - Safe error message extraction
    - `createErrorContext()` - Rich error context for logging

- **Integration Completed**:
    - Enhanced `scripts/utils/getEvent.ts` with transaction error handling
    - Updated `scripts/check-coverage.ts` with file system error handling
    - Enhanced `scripts/post-docgen.ts` with comprehensive error handling

#### **3. Common Utilities**

- **Ethereum Utilities** (`utils/ethereum.ts` - 251 lines):
    - Address validation and manipulation functions
    - Private key validation and normalization
    - Hex string utilities and validation
    - Wei/Ether conversion functions
    - Common Ethereum constants (addresses, roles, gas limits)
    - Type guards and utility functions

- **Enhanced Validation** (`scripts/utils/validation.ts` - 228 lines):
    - Comprehensive validation functions with custom errors
    - Helpful error suggestions for common mistakes
    - Type-safe validation with proper type guards
    - Support for business IDs, addresses, private keys, roles
    - Range validation and required field validation

### 📊 **Metrics and Benefits**

- **Lines of Code Enhanced**: ~1,100+ lines converted to TypeScript
- **Error Classes Created**: 9 specialized error types + base class
- **Type Safety Improvement**: 100% type coverage for converted files
- **Error Message Quality**: Enhanced with actionable suggestions
- **Developer Experience**: Improved IntelliSense and compile-time error detection
- **Maintainability**: Structured error handling and comprehensive utilities

### 🗺️ **File Structure Impact**

```
Project Root/
├── utils/                     # New utility directory
│   ├── errors.ts             # Custom error system (421 lines)
│   └── ethereum.ts           # Ethereum utilities (251 lines)
├── scripts/
│   ├── check-coverage.ts     # Enhanced TypeScript version (140 lines)
│   ├── post-docgen.ts        # Enhanced TypeScript version (225 lines)
│   └── utils/
│       ├── validation.ts      # Enhanced validation (228 lines)
│       └── getEvent.ts        # Enhanced error handling (82 lines)
└── package.json              # Updated with TypeScript dependencies
```

### 🚀 **Next Phase Recommendations**

With Phase 1 successfully completed, the project is now ready for Phase 2 implementation:

1. **Phase 2 Priority**: Type Safety Improvements
    - Add comprehensive type definitions (`types/contracts.ts`, `types/networks.ts`)
    - Enhance JSDoc comments across the codebase
    - Implement branded types for better type safety

2. **Phase 3 Priority**: Architecture Improvements
    - Complete `hardhat.config.ts` refactoring
    - Implement ConfigManager for centralized configuration
    - Add ContractFactory pattern for consistent contract interactions

---

_This document serves as a living guide for improving TypeScript/JavaScript code quality in the ISBE contracts project. Update it as improvements are implemented and new patterns emerge._

## 📈 **Performance Improvements**

### 19. Concurrent Processing

**Status**: 🟡 Important  
**Effort**: Medium  
**Impact**: High

```typescript
// services/ConcurrentEventDetector.ts
export class ConcurrentEventDetector {
    constructor(
        private provider: Provider,
        private contractInterface: Interface,
        private options: ConcurrentDetectionOptions = {}
    ) {}

    async detectEvents(
        transactions: string[],
        eventName: string,
        expectedValues: Record<string, any>[]
    ): Promise<EventDetectionResult[]> {
        const batchSize = this.options.batchSize || 10
        const results: EventDetectionResult[] = []

        // Process in batches
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize)
            const batchPromises = batch.map((txHash, index) =>
                this.detectSingleEvent(
                    txHash,
                    eventName,
                    expectedValues[i + index]
                )
            )

            const batchResults = await Promise.allSettled(batchPromises)
            results.push(...this.processBatchResults(batchResults))
        }

        return results
    }

    private async detectSingleEvent(
        txHash: string,
        eventName: string,
        expectedValues: Record<string, any>
    ): Promise<EventDetectionResult> {
        const detector = new EventDetectionService(
            this.provider,
            this.contractInterface
        )
        return detector.detectEvent(txHash, eventName, expectedValues)
    }

    private processBatchResults(
        results: PromiseSettledResult<EventDetectionResult>[]
    ): EventDetectionResult[] {
        return results.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value
            }
            return {
                found: false,
                source: 'error',
                error: result.reason,
                metadata: {
                    error: true,
                    message: result.reason?.message || 'Unknown error',
                },
            }
        })
    }
}

// Usage example
const detector = new ConcurrentEventDetector(provider, contractInterface, {
    batchSize: 5,
    timeout: 30000,
    retries: 3,
})

const results = await detector.detectEvents([tx1, tx2, tx3], 'Transfer', [
    { from: addr1 },
    { from: addr2 },
    { from: addr3 },
])
```

### 20. Cache Management

**Status**: 🟡 Important  
**Effort**: Medium  
**Impact**: High

```typescript
// services/CacheManager.ts
export class CacheManager {
    private static instance: CacheManager
    private cache = new Map<string, CacheEntry>()
    private ttl: number

    private constructor(ttl = 5 * 60 * 1000) {
        this.ttl = ttl
    }

    static getInstance(ttl?: number): CacheManager {
        if (!this.instance) {
            this.instance = new CacheManager(ttl)
        }
        return this.instance
    }

    async get<T>(
        key: string,
        fetchFn: () => Promise<T>,
        options?: CacheOptions
    ): Promise<T> {
        const entry = this.cache.get(key)
        if (entry && !this.isExpired(entry)) {
            return entry.value as T
        }

        const value = await fetchFn()
        this.set(key, value, options)
        return value
    }

    set(key: string, value: any, options?: CacheOptions): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: options?.ttl || this.ttl,
        })
    }

    delete(key: string): void {
        this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
    }

    private isExpired(entry: CacheEntry): boolean {
        return Date.now() - entry.timestamp > entry.ttl
    }
}

// Usage example
const cache = CacheManager.getInstance()

const result = await cache.get(
    `event-${txHash}`,
    () => eventDetector.detectEvent(txHash, eventName, values),
    { ttl: 60000 } // 1 minute TTL
)
```

## 🚨 **URGENT: Next Development Priorities**

Based on the recent secp256r1 fixes, the following should be addressed immediately:

### 🔥 **Week 1 (Critical)**

1. **Fix secp256r1 Address Derivation Inconsistency** - URGENT: Two different methods could generate different addresses
2. **Extract EventDetectionService** from 250+ line `grantRoleWithRawTransaction` function
3. **Centralize role constants** to prevent future bugs like the `ISBE_PAUSER_ROLE` mixup
4. **Implement structured error handling** to replace mixed console.log patterns

### 🔍 **Week 2 (High Priority)**

5. **Design unified secp256r1 management architecture** - Create Secp256r1Manager class
6. **Create proper interfaces** for provider access instead of string-in checks
7. **Add comprehensive logging** for secp256r1 debugging and monitoring
8. **Implement retry mechanisms** for event detection robustness

### ⚡ **Week 3 (Medium Priority)**

9. **Migrate scattered secp256r1 logic** to unified manager
10. **Extract reusable patterns** for other functions that might face similar secp256r1 issues
11. **Add comprehensive tests** for all event detection fallback scenarios
12. **Create documentation** for secp256r1-specific troubleshooting

### 📋 **New Documentation**

- **secp256r1 Management Strategy**: `docs/secp256r1-Management-Strategy.md` - Comprehensive refactoring plan
- **Architecture Analysis**: Detailed assessment of current distributed approach
- **Migration Roadmap**: 3-phase implementation plan with risk assessment
- **Critical Issues**: Address derivation inconsistency and scattered logic problems

## 📚 Related Documentation

- [Deployment Logging Improvements](DEPLOYMENT_LOGGING_IMPROVEMENTS.md) - Enhanced logging system implementation for better deployment visibility
- [Secp256R1 Complete Guide](SECP256R1_COMPLETE_GUIDE.md) - Comprehensive secp256r1 implementation guide

---

**Last Updated**: October 2025 - Phase 1 Completed + secp256r1 Architectural Debt Documented ✅⚠️
