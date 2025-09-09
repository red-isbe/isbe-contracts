# Test Template Reference - Following DiDRegistry.spec.ts Model

## Critical Test Ordering

**FUNDAMENTAL RULE**: Tests MUST ALWAYS follow this strict order:

1. **FIRST**: Failure/error tests (THEN it fails)
2. **AFTER**: Success tests (THEN it success)

---

## Complete File Structure

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

    // Test-specific variables
    const emptyString = ''
    const emptyBytes = randomHx(0)
    let testVariable: string
    let anotherTestVariable: string

    // ====================================================================
    // 3.2. HELPER FUNCTIONS
    // ====================================================================
    const helperFunction = (param: any): string => {
        // Helper function logic
        return param.toString()
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
    // 3.3. DEPLOYMENT FUNCTIONS (RECOMMENDED PATTERN)
    // ====================================================================
    async function deployInitial() {
        const [admin, other] = await ethers.getSigners()
        const adminAddress = await admin.getAddress()
        const otherAddress = await other.getAddress()
        
        const result = await deployGovernance(
            admin,
            [],
            CONFIGURATION_ID_FOR_CONTRACT,
            false,  // Don't initialize yet
            '0x',
            [],
            [],
            false
        )

        return {
            ...result,
            admin,
            other,
            adminAddress,
            otherAddress,
            contractFacetOne: result.contractFacetOne || result.contractFacetOneFacet,
            contractFacetTwo: result.contractFacetTwo || result.contractFacetTwoFacet,
            mainContract: result.mainContract || result.mainContractFacet,
            mockTimestamp: result.mockTimestamp || result.mockTimestampFacet
        }
    }

    async function deployInitialized() {
        const result = await deployInitial()
        
        // Initialize the main contract
        await result.mainContract.initializeFunction(validValue)
        
        // Grant necessary roles
        await result.accessControl.grantRole(REQUIRED_ROLE, result.adminAddress)
        
        return result
    }

    // ====================================================================
    // 3.4. WALLET HELPER (IF APPLICABLE)
    // ====================================================================
    function walletOfFirstSigner(): HDNodeWallet {
        const mnemonic = config.networks.hardhat.accounts.mnemonic
        return ethers.HDNodeWallet.fromPhrase(mnemonic, "m/44'/60'/0'/0/0")
    }

    // ====================================================================
    // 4. NO GLOBAL SETUP REQUIRED WITH loadFixture
    // ====================================================================
    // When using loadFixture pattern, no global before() setup is needed
    // Each test gets fresh state from the fixture functions

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
                const { mainContract, contractFacetOne } = await loadFixture(deployInitial)
                
                await expect(
                    mainContract.initializeFunction(invalidValue)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'ExpectedErrorName'
                )
            })

            it('GIVEN deployed contract WHEN try to initialize twice THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitial)
                
                // First initialization should succeed
                await expect(mainContract.initializeFunction(validValue))
                    .to.emit(mainContract, 'InitializationEvent')
                    .withArgs(validValue)

                // Second initialization should fail
                await expect(
                    mainContract.initializeFunction(validValue)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'ContractIsAlreadyInitialized'
                )
            })

            // ✅ AFTER: SUCCESSES
            it('GIVEN deployed contract WHEN try to initialize with correct parameters THEN it success', async () => {
                const { mainContract } = await loadFixture(deployInitial)
                
                await expect(mainContract.initializeFunction(validValue))
                    .to.emit(mainContract, 'InitializationEvent')
                    .withArgs(validValue)
            })
        })

        // ================================================================
        // 5.2. SECOND GROUP: MAIN FUNCTION 1
        // ================================================================
        describe('mainFunction', () => {
            // ⚠️ CRITICAL ORDER: ALL FAILURES FIRST
            it('GIVEN initialized contract WHEN try to call function with empty parameter1 THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.mainFunction(
                        emptyString,
                        validParam2,
                        validParam3
                    )
                ).to.be.revertedWithCustomError(contractFacetOne, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN try to call function with empty parameter2 THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.mainFunction(
                        validParam1,
                        emptyString,
                        validParam3
                    )
                ).to.be.revertedWithCustomError(contractFacetOne, 'EmptyString')
            })

            it('GIVEN initialized contract WHEN try to call function with invalid parameter3 THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.mainFunction(
                        validParam1,
                        validParam2,
                        invalidParam3
                    )
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'InvalidParameterError'
                )
            })

            it('GIVEN initialized contract WHEN try to call function with unauthorized user THEN it fails', async () => {
                const { mainContract, contractFacetOne, other } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract
                        .connect(other)
                        .mainFunction(validParam1, validParam2, validParam3)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'UnauthorizedError'
                )
            })

            // ✅ AFTER: ALL SUCCESSES
            it('GIVEN initialized contract WHEN try to call function with valid parameters THEN it success', async () => {
                const { mainContract } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.mainFunction(
                        validParam1,
                        validParam2,
                        validParam3
                    )
                )
                    .to.emit(mainContract, 'FunctionEvent')
                    .withArgs(validParam1, validParam2, validParam3)
            })
        })

        // ================================================================
        // 5.3. THIRD GROUP: MAIN FUNCTION 2
        // ================================================================
        describe('updateFunction', () => {
            // ⚠️ CRITICAL ORDER: FAILURES FIRST
            it('GIVEN an existing record WHEN try to update with empty parameter THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                // First create the record to update
                await mainContract.mainFunction(
                    validParam1,
                    validParam2,
                    validParam3
                )
                
                await expect(
                    mainContract.updateFunction(validId, emptyString)
                ).to.be.revertedWithCustomError(contractFacetOne, 'EmptyString')
            })

            it('GIVEN an existing record WHEN try to update non-existent record THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.updateFunction(nonExistentId, validParam)
                )
                    .to.be.revertedWithCustomError(
                        contractFacetOne,
                        'RecordNotFound'
                    )
                    .withArgs(nonExistentId)
            })

            it('GIVEN an existing record WHEN try to update without rights THEN it fails', async () => {
                const { mainContract, contractFacetOne, other } = await loadFixture(deployInitialized)
                
                // First create the record to update
                await mainContract.mainFunction(
                    validParam1,
                    validParam2,
                    validParam3
                )
                
                await expect(
                    mainContract
                        .connect(other)
                        .updateFunction(validId, validParam)
                ).to.be.revertedWithCustomError(
                    contractFacetOne,
                    'UnauthorizedError'
                )
            })

            // ✅ AFTER: SUCCESSES
            it('GIVEN an existing record WHEN try to update with valid parameters THEN it success', async () => {
                const { mainContract } = await loadFixture(deployInitialized)
                
                // First create the record to update
                await mainContract.mainFunction(
                    validParam1,
                    validParam2,
                    validParam3
                )
                
                await expect(
                    mainContract.updateFunction(validId, newValidParam)
                )
                    .to.emit(mainContract, 'UpdateEvent')
                    .withArgs(validId, newValidParam)
            })
        })

        // ================================================================
        // 5.4. CONTINUE PATTERN FOR OTHER FUNCTIONS...
        // ================================================================
        describe('additionalFunction', () => {
            // ⚠️ CRITICAL ORDER: ALL FAILURES FIRST
            it('GIVEN initialized contract WHEN try to call with invalid parameter THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.additionalFunction(invalidParam)
                ).to.be.revertedWithCustomError(contractFacetOne, 'InvalidParameterError')
            })

            // ✅ AFTER: ALL SUCCESSES
            it('GIVEN initialized contract WHEN try to call with valid parameter THEN it success', async () => {
                const { mainContract } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.additionalFunction(validParam)
                )
                    .to.emit(mainContract, 'AdditionalEvent')
                    .withArgs(validParam)
            })
        })

        // ================================================================
        // 5.5. LAST GROUP: VIEW FUNCTIONS (IF APPLICABLE)
        // ================================================================
        describe('viewFunctions', () => {
            // Tests for read-only functions
            it('GIVEN initialized contract WHEN try to get data that does not exist THEN it fails', async () => {
                const { mainContract, contractFacetOne } = await loadFixture(deployInitialized)
                
                await expect(
                    mainContract.getData(nonExistentId)
                ).to.be.revertedWithCustomError(contractFacetOne, 'DataNotFoundError')
            })

            it('GIVEN initialized contract WHEN try to get existing data THEN it success', async () => {
                const { mainContract } = await loadFixture(deployInitialized)
                
                // First create some data
                await mainContract.mainFunction(
                    validParam1,
                    validParam2,
                    validParam3
                )
                
                const result = await mainContract.getData(validId)
                expect(result).to.equal(expectedValue)
            })
        })
    })
})
```

---

## Critical Ordering Rules

### ⚠️ WITHIN EACH `describe()`:

1. **ALL** tests with `THEN it fails` FIRST
2. **ALL** tests with `THEN it success` AFTER

### ⚠️ FAILURE TEST ORDER (TYPICAL):

1. Empty parameters (`EmptyString`, `EmptyBytes`, `EmptyUint`)
2. Invalid parameters (`Invalid*Error`)
3. Invalid states (`AlreadyExists`, `NotFound`)
4. Permissions (`Unauthorized`, `AccountHasNoRole`)
5. Specific business logic

### ⚠️ SUCCESS TEST ORDER (TYPICAL):

1. Basic successful case
2. Successful edge cases
3. Cases with verified events

---

## Naming Conventions

### Structure of `it()`:

```typescript
it('GIVEN [initial state] WHEN [action] THEN [expected result]', async () => {
    // Test implementation
})
```

### Examples:

- `GIVEN deployed contract WHEN try to initialize with invalid parameter THEN it fails`
- `GIVEN initialized contract WHEN try to call function with empty parameter THEN it fails`
- `GIVEN existing record WHEN try to update with valid parameters THEN it success`

### Error Verifications:

```typescript
await expect(contractCall)
    .to.be.revertedWithCustomError(facetContract, 'ErrorName')
    .withArgs(expectedParam) // Only if error has parameters
```

### Success Verifications with Events:

```typescript
await expect(contractCall)
    .to.emit(contract, 'EventName')
    .withArgs(param1, param2, param3)
```

---

## Setup Patterns

### Global Setup:

```typescript
before(async () => {
    await loadFixture(deployInitial)
})
```

### Per-Function Setup:

```typescript
describe('functionName', () => {
    before(async () => {
        // One-time specific setup
        randomizeTestData(ethers.Wallet.createRandom())
    })

    beforeEach(async () => {
        const fixture = async () => {
            // Setup before each test
            await contractInitialization()
        }
        await loadFixture(fixture)
        // Variables that change per test
        testVariable = randomStr()
    })
})
```

---

## Important Validations

- [ ] All failure tests are BEFORE success tests
- [ ] Consistent GIVEN/WHEN/THEN naming
- [ ] Correct setup with `loadFixture`
- [ ] Error verification with `.revertedWithCustomError`
- [ ] Event verification with `.emit` and `.withArgs`
- [ ] Test variables correctly initialized
- [ ] Imports organized by categories

---

_This template must be followed STRICTLY to maintain consistency with DiDRegistry.spec.ts_
