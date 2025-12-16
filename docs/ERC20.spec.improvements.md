# ERC20.spec.ts Test Improvement Analysis

## Executive Summary

This document outlines comprehensive improvements for the ERC20.spec.ts test file based on analysis of code patterns, duplication, and structural issues identified throughout the test suite.

## Current State Analysis

### File Structure Overview

Based on the provided code section (lines 2212-3295), the test file appears to contain:

- **Multiple contract deployments** (ERC20, AccessControl, Pausable, Capped features)
- **Complex role-based testing** (MINTER_ROLE, SPONSOR_ROLE, PAUSER_ROLE, CAP_ROLE)
- **ERC712 signature testing** for transfer, mint, and burn operations
- **Modifier coverage tests** for pause state and role validation
- **Event emission validation** for signature-based operations

### Identified Issues

#### 1. Code Duplication Patterns

```typescript
// REPEATED ROLE SETUP (found in multiple beforeEach blocks)
await accessControl.grantRole(MINTER_ROLE, ownerAddress)
await accessControl.grantRole(CAP_ROLE, ownerAddress)
await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
await accessControl.grantRole(SPONSOR_ROLE, otherAccountAddress)

// REPEATED CONTRACT INSTANCE CREATION
erc203643CappedSigned = await ethers.getContractAt(
    'ERC203643CappedSigned',
    await erc20.getAddress()
)
erc20BurnableSigned = await ethers.getContractAt(
    'ERC20BurnableSignedFacet',
    await erc20.getAddress()
)

// REPEATED TIME CALCULATIONS
Math.floor(Date.now() / 1000) + 3600
```

#### 2. Inconsistent Fixture Usage

- Some sections use `loadFixture()` while others use manual `beforeEach` setup
- No standardized fixture hierarchy
- Fixture dependencies not properly managed

#### 3. Magic Numbers and Hardcoded Values

```typescript
1000 // Cap amount
500 // Mint amount
100 // Transfer amount
3600 // 1 hour in seconds
1 // Nonce start, expired timestamp
```

#### 4. Test Data Creation Repetition

Similar signature message creation patterns repeated across different test types.

## Recommended Improvements

### 1. Create Centralized Fixtures System

#### File: `test/fixtures/ERC20Fixtures.ts`

```typescript
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ethers } from 'hardhat'

export const ERC20Fixtures = {
    // Level 1: Base deployment
    baseDeployment: async () => {
        const [owner, otherAccount] = await ethers.getSigners()
        const erc20 = await ethers.deployContract('ERC203643')
        const accessControl = await ethers.getContractAt(
            'AccessControlFacet',
            await erc20.getAddress()
        )
        const pause = await ethers.getContractAt(
            'PausableFacet',
            await erc20.getAddress()
        )
        return { owner, otherAccount, erc20, accessControl, pause }
    },

    // Level 2: With roles
    withCoreRoles: async () => {
        const base = await loadFixture(baseDeployment)
        await base.accessControl.grantRole(MINTER_ROLE, base.owner.address)
        await base.accessControl.grantRole(CAP_ROLE, base.owner.address)
        await base.accessControl.grantRole(PAUSER_ROLE, base.owner.address)
        return base
    },

    // Level 3: Signature ready
    signatureReady: async () => {
        const withRoles = await loadFixture(withCoreRoles)
        await withRoles.accessControl.grantRole(
            SPONSOR_ROLE,
            withRoles.otherAccount.address
        )

        // Initialize cap and mint tokens
        const erc20Capped = await ethers.getContractAt(
            'ERC20CappedFacet',
            await withRoles.erc20.getAddress()
        )
        await erc20Capped.initializeCap(1000)
        await erc20Capped.mint(withRoles.owner.address, 500)

        return { ...withRoles, erc20Capped }
    },

    // Level 4: Specific contract instances
    withContractInstances: async () => {
        const ready = await loadFixture(signatureReady)
        const contracts = await ContractHelpers.getAllContractInstances(
            await ready.erc20.getAddress()
        )
        return { ...ready, ...contracts }
    },
}
```

### 2. Create Test Utilities

#### File: `test/utils/TestConstants.ts`

```typescript
export const TestConstants = {
    // Amounts
    CAP_AMOUNT: 1000,
    INITIAL_MINT: 500,
    STANDARD_TRANSFER: 100,
    LARGE_TRANSFER: 150,

    // Time
    ONE_HOUR: 3600,
    ONE_DAY: 86400,

    // Nonces
    INITIAL_NONCE: 1,
    SECOND_NONCE: 2,

    // Roles
    ROLES: {
        MINTER: MINTER_ROLE,
        SPONSOR: SPONSOR_ROLE,
        PAUSER: PAUSER_ROLE,
        CAP: CAP_ROLE,
    },
}
```

#### File: `test/utils/TimeHelpers.ts`

```typescript
export const TimeHelpers = {
    now: () => Math.floor(Date.now() / 1000),
    future: (hours: number = 1) => TimeHelpers.now() + hours * 3600,
    past: () => 1,
    farFuture: () => TimeHelpers.now() + 365 * 24 * 3600, // 1 year
}
```

#### File: `test/utils/SignatureHelpers.ts`

```typescript
export const SignatureHelpers = {
    generateInvalid: () => '0x' + '00'.repeat(65),

    createTransferMessage: (params: {
        to: string
        amount: number
        sender: string
        nonce: number
        expirationHours?: number
    }) => ({
        to: params.to,
        amount: params.amount,
        sender: params.sender,
        nonce: params.nonce,
        expirationTimestamp: TimeHelpers.future(params.expirationHours || 1),
    }),

    createMintMessage: (params: {
        to: string
        amount: number
        sender: string
        nonce: number
        expirationHours?: number
    }) => ({
        to: params.to,
        amount: params.amount,
        sender: params.sender,
        nonce: params.nonce,
        expirationTimestamp: TimeHelpers.future(params.expirationHours || 1),
    }),
}
```

### 3. Create Contract Instance Management

#### File: `test/utils/ContractHelpers.ts`

```typescript
export const ContractHelpers = {
    getAllContractInstances: async (erc20Address: string) => {
        const contractNames = [
            'ERC203643CappedSigned',
            'ERC20BurnableSignedFacet',
            'ERC203643TransferSigned',
            'ERC20CappedFacet',
            'PausableFacet',
            'AccessControlFacet',
        ]

        const instances = await Promise.all(
            contractNames.map((name) =>
                ethers.getContractAt(name, erc20Address)
            )
        )

        return Object.fromEntries(
            contractNames.map((name, index) => [
                camelCase(name),
                instances[index],
            ])
        )
    },
}
```

### 4. Improved Test Structure Template

```typescript test/ERC20.spec.ts
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

// Import utilities
import { ERC20Fixtures } from './fixtures/ERC20Fixtures'
import { TestConstants } from './utils/TestConstants'
import { TimeHelpers } from './utils/TimeHelpers'
import { SignatureHelpers } from './utils/SignatureHelpers'
import { ContractHelpers } from './utils/ContractHelpers'

describe('ERC20', () => {
    // Shared test context
    let context: any

    describe('ERC712', () => {
        let domain: any

        beforeEach(async function () {
            context = await loadFixture(ERC20Fixtures.withContractInstances)
            domain = {
                name: 'ERC203643',
                version: '1.0.0',
                chainId: await network.provider.send('eth_chainId'),
                verifyingContract: await context.erc20.getAddress(),
            }
        })

        describe('TransferWithSignature', () => {
            it('reverts when contract is paused', async function () {
                await context.pause.pause()

                await expect(
                    context.erc203643TransferSigned
                        .connect(context.otherAccount)
                        .transferWithSignature(
                            context.otherAccount.address,
                            TestConstants.STANDARD_TRANSFER,
                            context.owner.address,
                            TimeHelpers.future(),
                            TestConstants.INITIAL_NONCE,
                            SignatureHelpers.generateInvalid()
                        )
                ).to.be.revertedWithCustomError(context.erc20, 'IsPaused')
            })

            // Additional tests follow same pattern...
        })
    })
})
```

## Implementation Plan

### Phase 1: Foundation (Week 1)

1. Create utility files (`TestConstants.ts`, `TimeHelpers.ts`, `SignatureHelpers.ts`)
2. Create `ContractHelpers.ts` for instance management
3. Update imports in main test file

### Phase 2: Fixture Migration (Week 2)

1. Create `ERC20Fixtures.ts` with hierarchical fixtures
2. Migrate one test section to use new fixtures
3. Validate test execution and performance

### Phase 3: Full Migration (Week 3)

1. Migrate remaining test sections
2. Remove duplicate code from beforeEach blocks
3. Standardize test descriptions and patterns

### Phase 4: Optimization (Week 4)

1. Add custom matchers for common assertions
2. Implement performance monitoring
3. Create documentation for test patterns

## Expected Benefits

### Code Quality

- **60-70% reduction** in code duplication
- **Standardized patterns** across all test sections
- **Clear fixture hierarchy** for different test scenarios

### Maintainability

- **Single source of truth** for constants and helpers
- **Easier contract interface changes** - update in one place
- **Better test isolation** through proper fixture usage

### Performance

- **Faster test execution** through optimized fixture loading
- **Reduced deployment overhead** with shared setup

### Development Experience

- **Faster test writing** with helper functions
- **Better error messages** with standardized patterns
- **Easier debugging** with consistent test structure

## Next Steps

1. **Complete Analysis**: Review the full ERC20.spec.ts file to identify additional patterns
2. **Priority Implementation**: Start with the most duplicated code sections
3. **Incremental Migration**: Convert one test section at a time to validate approach
4. **Team Training**: Document the new patterns for team adoption

This improvement plan will transform the test suite from a collection of repetitive test cases into a well-structured, maintainable, and efficient testing system.
