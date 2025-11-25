# Test Template Reference - Following DiDRegistry.spec.ts Model

## Critical Test Ordering

**FUNDAMENTAL RULE**: Tests MUST ALWAYS follow this strict order:

1. **FIRST**: Failure/error tests (THEN it fails)
2. **AFTER**: Success tests (THEN it success)

## Performance Optimization Notice

**PERFORMANCE IMPROVEMENT**: Using `loadFixture` with optimized patterns can provide **~400x performance improvement** over traditional setup methods. The optimized template includes:

- **Specialized fixtures** for different contract states
- **Centralized hooks** for common setups
- **Type safety** throughout the test suite

---

## Complete File Structure (DiDRegistry Model)

```typescript
// ========================================================================
// 1. IMPORTS
// ========================================================================
import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import {
    // Main contract interfaces
    ContractFacetOne,
    ContractFacetTwo,
    IMainContract,
    MockTimestampFacet,
} from '../../typechain-types'
import { HDNodeWallet, Signer, Typed } from 'ethers'
import {
    // Project constants
    CONSTANT_ONE,
    CONSTANT_TWO,
    ROLE_CONSTANT,
} from '../constants'
import {
    CONFIGURATION_ID_FOR_CONTRACT,
    deployGovernance,
} from '../initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    // Test-specific utilities (if any)
    UtilityClassOne,
    UtilityClassTwo,
} from './utils'

// ========================================================================
// 2. ENUMS AND TYPES (IF APPLICABLE)
// ========================================================================
enum ExampleEnum {
    NONE = 0,
    OPTION_ONE = 1,
    OPTION_TWO = 2,
}

// ========================================================================
// 3. MAIN DESCRIBE
// ========================================================================
describe('ContractName', function () {
    // ====================================================================
    // 3.1. GLOBAL VARIABLES
    // ====================================================================
    let admin: Signer
    let other: Signer
    let otherAddress: string
    let contractFacetOne: ContractFacetOne
    let contractFacetTwo: ContractFacetTwo
    let mainContract: IMainContract
    let mockTimestamp: MockTimestampFacet

    // Test constants
    const emptyString = ''
    const emptyBytes = randomHx(0)

    // Test-specific variables
    let testVariable: string
    let anotherTestVariable: string

    // ====================================================================
    // 3.2. UTILITY FUNCTIONS (DiDRegistry Style)
    // ====================================================================
    const walletToPublicKey = (wallet: HDNodeWallet): string => {
        return wallet.signingKey.publicKey
    }

    const randomizeTestData = (wallet: HDNodeWallet) => {
        testVariable = randomStr()
        anotherTestVariable = randomStr()
        // Initialize all test variables
    }

    // Generate random data
    function randomHx(length: number = 32): string {
        return ethers.hexlify(ethers.randomBytes(length))
    }

    function randomStr(length: number = 10): string {
        const bytes = ethers.randomBytes(Math.ceil(length / 2))
        const hex = ethers.hexlify(bytes).slice(2)
        return hex.slice(0, length)
    }

    function randomInt(): bigint {
        const randomBytes = ethers.randomBytes(32)
        return ethers.toBigInt(ethers.hexlify(randomBytes))
    }

    // ====================================================================
    // 3.3. DEPLOYMENT FUNCTIONS (DiDRegistry Pattern)
    // ====================================================================
    async function deployInitial() {
        ;[admin, other] = await ethers.getSigners()
        otherAddress = await other.getAddress()

        const result = await deployGovernance(
            admin,
            undefined, // or [] depending on contract
            CONFIGURATION_ID_FOR_CONTRACT
        )

        // Assign contract instances
        contractFacetOne = result.contractFacetOne
        contractFacetTwo = result.contractFacetTwo
        mainContract = result.mainContract
        mockTimestamp = result.mockTimestamp

        // Verify deployment (if applicable)
        expect(await contractFacetOne.businessIdIntrospection()).to.be.equal(
            EXPECTED_RESOLVER_KEY
        )
        expect(
            await contractFacetOne.interfacesIntrospection()
        ).to.be.deep.equal(['0x12345678'])
    }

    // ====================================================================
    // 3.4. WALLET HELPER (DiDRegistry Style)
    // ====================================================================
    function walletOfFirstSigner(): HDNodeWallet {
        const mnemonic = (
            config.networks.hardhat.accounts as {
                mnemonic: string
                path: string
            }
        ).mnemonic
        return ethers.HDNodeWallet.fromPhrase(mnemonic)
    }

    function deriveWallet(wallet: HDNodeWallet, path: string): HDNodeWallet {
        return wallet.derivePath(path)
    }

    // ====================================================================
    // 4. HOOKS (DiDRegistry Pattern)
    // ====================================================================
    beforeEach(async () => {
        await loadFixture(deployInitial)
    })

    // ====================================================================
    // 5. MAIN NESTED DESCRIBE
    // ====================================================================
    describe('ContractName', () => {
        // ================================================================
        // 5.1. FIRST GROUP: INITIALIZATION
        // ================================================================
        describe('initializeFunction', () => {
            // ⚠️ CRITICAL ORDER: FAILURES FIRST
            it('GIVEN deployed contract WHEN try to initialize with invalid parameter THEN it fails', async () => {
                await expect(
                    mainContract.initializeFunction(invalidValue)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'ExpectedErrorName'
                )
            })

            it('GIVEN deployed contract WHEN try to initialize twice THEN it fails', async () => {
                // First initialization should succeed
                await mainContract.initializeFunction(validValue)

                // Second initialization should fail
                await expect(
                    mainContract.initializeFunction(validValue)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'ContractIsAlreadyInitialized'
                )
            })

            // ✅ SUCCESS TESTS AFTER FAILURES
            it('GIVEN deployed contract WHEN initialize with valid parameters THEN it succeeds', async () => {
                expect(await mainContract.initializeFunction(validValue))
                    .to.emit(mainContract, 'InitializationEvent')
                    .withArgs(validValue)
            })
        })

        // ================================================================
        // 5.2. FUNCTION GROUPS WITH SETUP
        // ================================================================
        describe('mainFunction', () => {
            before(async () => {
                // Setup data that persists across tests in this describe block
                randomizeTestData(ethers.Wallet.createRandom())
            })

            beforeEach(async () => {
                // Individual test setup using fixture
                const fixture = async () => {
                    await mainContract.initializeFunction(validValue)
                    // Additional setup for this test group
                }
                await loadFixture(fixture)

                // Per-test randomization
                testVariable = randomStr()
            })

            // ⚠️ FAILURES FIRST
            it('GIVEN initialized contract WHEN try function with empty parameter THEN it fails', async () => {
                await expect(
                    mainContract.mainFunction(emptyString)
                ).to.be.revertedWithCustomError(contractFacetOne, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN try function with invalid parameter THEN it fails', async () => {
                await expect(
                    mainContract.mainFunction(invalidParameter)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'InvalidParameter'
                )
            })

            // ✅ SUCCESS TESTS AFTER FAILURES
            it('GIVEN initialized contract WHEN call function with valid parameters THEN it succeeds', async () => {
                const result = await mainContract.mainFunction(validParameter)
                expect(result).to.equal(expectedResult)
            })
        })

        // ================================================================
        // 5.3. NESTED GROUPS FOR COMPLEX SCENARIOS
        // ================================================================
        describe('complexFunction', () => {
            beforeEach(async () => {
                const fixture = async () => {
                    await mainContract.initializeFunction(validValue)
                    await mainContract.setupForComplexFunction()
                }
                await loadFixture(fixture)
            })

            describe('when condition A', () => {
                beforeEach(async () => {
                    const nestedFixture = async () => {
                        await mainContract.setupConditionA()
                    }
                    await loadFixture(nestedFixture)
                })

                it('GIVEN condition A WHEN perform action THEN it fails', async () => {
                    await expect(
                        mainContract.performAction()
                    ).to.be.revertedWithCustomError(
                        contractFacetOne,
                        'ConditionAError'
                    )
                })

                it('GIVEN condition A WHEN perform valid action THEN it succeeds', async () => {
                    const result = await mainContract.performValidAction()
                    expect(result).to.be.true
                })
            })
        })
    })
})
```

---

## Key DiDRegistry Patterns

### 1. **DiDRegistry uses direct expect calls**

```typescript
await expect(
    mainContract.someFunction(invalidParam)
).to.be.revertedWithCustomError(contractFacet, 'ExpectedErrorName')
```

### 2. **Utility Functions for Data Generation**

```typescript
function randomHx(length: number = 32): string {
    return ethers.hexlify(ethers.randomBytes(length))
}

function randomStr(length: number = 10): string {
    const bytes = ethers.randomBytes(Math.ceil(length / 2))
    const hex = ethers.hexlify(bytes).slice(2)
    return hex.slice(0, length)
}

const randomizeTestData = (wallet: HDNodeWallet) => {
    // Initialize test variables
}
```

### 3. **Fixture Pattern with loadFixture**

```typescript
beforeEach(async () => {
    const fixture = async () => {
        await mainContract.initializeFunction(validValue)
        // Additional setup
    }
    await loadFixture(fixture)
})
```

### 4. **Variable Assignment Pattern**

```typescript
;[admin, other] = await ethers.getSigners()
otherAddress = await other.getAddress()
```

---

## Best Practices Summary (DiDRegistry Faithful)

1. **Use `loadFixture`** for all setup functions
2. **NO helper functions for error checking** - use direct expect calls
3. **Use utility functions** for data generation and randomization
4. **Follow strict test ordering**: Failures first, then Success
5. **Use proper TypeScript types** throughout
6. **Use before() and beforeEach()** for different setup levels
7. **Name tests descriptively** with GIVEN-WHEN-THEN pattern
8. **Use nested describe blocks** for complex scenarios
9. **Use semicolon prefix** for destructuring assignments: `;[admin, other] = ...`
