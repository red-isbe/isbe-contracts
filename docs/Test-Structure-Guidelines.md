# Test Structure Guidelines

This document outlines the standardized test structure for ISBE contracts, emphasizing proper error management before transactions and organized getter validation grouped by facet.

## Standard Test Structure Pattern

### 1. File Organization

```typescript
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {} from /* Contract Types */ '../typechain-types'
import {} from /* Constants */ './constants'

describe('FacetName', function () {
    // State variables
    let contract: ContractType
    let account: Signer
    let accountAddress: string

    // Fixture function
    async function deployFixture() {
        const [signer1, signer2] = await ethers.getSigners()
        const address1 = await signer1.getAddress()

        // Deploy contracts
        const result = await deployGovernance(signer1, roles, config)

        return {
            account: signer1,
            accountAddress: address1,
            contract: result.contract,
            // ... other contracts
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployFixture)
        account = contracts.account
        contract = contracts.contract
        // ... assign other contracts
    })

    // Test groups organized by functionality
})
```

### 2. Test Case Structure

Each test case must follow this order:

1. **Error validation tests FIRST** (before the transaction)
2. **Successful transaction test**
3. **Getter/state validation** (after successful transaction)

## Pattern Examples by Test Type

### Pattern A: Transaction with Precondition Errors

```typescript
describe('functionName', function () {
    // 1. ERROR CASES FIRST
    it('GIVEN precondition WHEN invalid input THEN reverts with error', async function () {
        await expect(
            contract.functionName(invalidParam)
        ).to.be.revertedWithCustomError(contract, 'ErrorName')
    })

    it('GIVEN precondition WHEN unauthorized caller THEN reverts with AccountHasNoRole', async function () {
        await expect(
            contract.connect(unauthorized).functionName(param)
        ).to.be.revertedWithCustomError(contract, 'AccountHasNoRole')
    })

    it('GIVEN paused contract WHEN calling function THEN reverts with IsPaused', async function () {
        await pause.pause()
        await expect(
            contract.functionName(param)
        ).to.be.revertedWithCustomError(contract, 'IsPaused')
    })

    // 2. SUCCESS CASE
    it('GIVEN valid conditions WHEN calling function THEN succeeds', async function () {
        await expect(contract.functionName(param))
            .to.emit(contract, 'EventName')
            .withArgs(expectedArg1, expectedArg2)
    })

    // 3. GETTERS VALIDATION (after successful execution)
    it('GIVEN successful transaction WHEN querying state THEN returns expected values', async function () {
        await contract.functionName(param)

        expect(await contract.getter1()).to.equal(expected1)
        expect(await contract.getter2()).to.equal(expected2)
    })
})
```

### Pattern B: State Change with Multiple Error Conditions

```typescript
describe('setState', function () {
    // Group related setup
    beforeEach(async function () {
        const fixture = async () => {
            await contract.initialize(params)
            await accessControl.grantRole(ROLE, accountAddress)
        }
        await loadFixture(fixture)
    })

    // ERROR CASES (all variations)
    it('GIVEN zero value WHEN setting state THEN reverts with EmptyUint', async function () {
        await expect(contract.setState(0)).to.be.revertedWithCustomError(
            contract,
            'EmptyUint'
        )
    })

    it('GIVEN invalid range WHEN setting state THEN reverts with InvalidRange', async function () {
        await expect(contract.setState(9999)).to.be.revertedWithCustomError(
            contract,
            'InvalidRange'
        )
    })

    it('GIVEN insufficient authority WHEN setting state THEN reverts with InsufficientAuthorityLevel', async function () {
        await expect(
            contract.connect(lowAuthority).setState(value)
        ).to.be.revertedWithCustomError(contract, 'InsufficientAuthorityLevel')
    })

    // SUCCESS CASE
    it('GIVEN valid parameters WHEN setting state THEN succeeds and emits event', async function () {
        await expect(contract.setState(newValue))
            .to.emit(contract, 'StateChanged')
            .withArgs(accountAddress, newValue)

        // Immediate state validation
        expect(await contract.getState()).to.equal(newValue)
    })
})
```

### Pattern C: Complex Transaction with Multiple State Changes

```typescript
describe('complexTransaction', function () {
    // Setup with multiple preconditions
    beforeEach(async function () {
        const fixture = async () => {
            await erc721.initializeErc721(name, symbol)
            await erc721Capped.initializeCap(3)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
        }
        await loadFixture(fixture)
    })

    // ERROR CASES (all edge cases)
    it('GIVEN token not owned WHEN transferring THEN reverts with CallerNotOwnerNorApproved', async function () {
        await expect(
            erc721.connect(other).transferFrom(ownerAddress, thirdAddress, 1)
        ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
    })

    it('GIVEN invalid recipient WHEN transferring THEN reverts with AddressZero', async function () {
        await expect(
            erc721.transferFrom(ownerAddress, ethers.ZeroAddress, 1)
        ).to.be.revertedWithCustomError(erc721, 'AddressZero')
    })

    it('GIVEN paused state WHEN transferring THEN reverts with IsPaused', async function () {
        await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
        await pause.pause()
        await expect(
            erc721.transferFrom(ownerAddress, otherAddress, 1)
        ).to.be.revertedWithCustomError(erc721, 'IsPaused')
    })

    // SUCCESS CASE with comprehensive validation
    it('GIVEN valid transfer WHEN executing THEN succeeds and updates all states', async function () {
        // Execute transaction
        await expect(erc721.transferFrom(ownerAddress, otherAddress, 1))
            .to.emit(erc721, 'Transfer')
            .withArgs(ownerAddress, otherAddress, 1)

        // Validate ALL state changes
        expect(await erc721.ownerOf(1)).to.equal(otherAddress)
        expect(await erc721.balanceOf(ownerAddress)).to.equal(0)
        expect(await erc721.balanceOf(otherAddress)).to.equal(1)
    })
})
```

## Grouping by Facet

### Example: Multi-Facet Contract Tests

```typescript
describe('ERC721 Token', function () {
    // Shared fixtures and setup
    let erc721: ERC721
    let erc721Capped: ERC721Capped
    let erc721Snapshot: ERC721Snapshot
    let erc721Burn: ERC721Burnable
    let accessControl: AccessControl
    let pause: ISBEPause

    async function deployFixture() {
        // ... deployment logic
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        // ... assign contracts
    })

    // GROUP 1: Base ERC721 functionality
    describe('Deployment', () => {
        // Initialization errors
        // Successful initialization
        // State getters validation
    })

    describe('Mint', () => {
        beforeEach(async () => {
            const fixture = async () => {
                await erc721.initializeErc721(name, symbol)
                await erc721Capped.initializeCap(3)
                await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            }
            await loadFixture(fixture)
        })

        // Mint error cases
        // Mint success cases
        // State validation after mint
    })

    // GROUP 2: Burnable facet
    describe('Burn', () => {
        beforeEach(async () => {
            /* setup */
        })

        // Burn error cases
        // Burn success cases
        // State validation after burn
    })

    // GROUP 3: Transfer functionality
    describe('Transfer', () => {
        beforeEach(async () => {
            /* setup */
        })

        // Transfer error cases
        // Transfer success cases
        // State validation after transfer
    })

    // GROUP 4: Capped facet
    describe('Cap', () => {
        describe('Initialization', () => {
            // Cap initialization errors
            // Cap initialization success
            // Cap getters
        })

        describe('Behavior with initialized cap', () => {
            beforeEach(async () => {
                /* setup with cap */
            })

            // Cap enforcement error cases
            // Cap update error cases
            // Cap update success cases
            // Cap getters validation
        })
    })

    // GROUP 5: Snapshot facet
    describe('Snapshot', () => {
        beforeEach(async () => {
            /* setup */
        })

        // Snapshot error cases
        // Snapshot success cases
        // Snapshot getters validation
    })

    // GROUP 6: Enumerable facet
    describe('Enumerable', () => {
        beforeEach(async () => {
            /* setup */
        })

        // Enumerable error cases
        // Enumerable success cases
        // Enumerable getters validation
    })

    // GROUP 7: Royalty facet
    describe('Royalty', () => {
        beforeEach(async () => {
            /* setup */
        })

        // Royalty error cases
        // Royalty success cases
        // Royalty getters validation
    })
})
```

## Standard Error Testing Checklist

For each function that modifies state, test these error conditions (when applicable):

### Access Control Errors

```typescript
it('GIVEN unauthorized caller WHEN calling function THEN reverts with AccountHasNoRole', async function () {
    await expect(
        contract.connect(unauthorized).function()
    ).to.be.revertedWithCustomError(contract, 'AccountHasNoRole')
})

it('GIVEN insufficient authority level WHEN calling function THEN reverts with InsufficientAuthorityLevel', async function () {
    await expect(contract.connect(lowAuthority).function())
        .to.be.revertedWithCustomError(contract, 'InsufficientAuthorityLevel')
        .withArgs(actualLevel, requiredLevel)
})
```

### Pause Mechanism Errors

```typescript
it('GIVEN paused contract WHEN calling function THEN reverts with IsPaused', async function () {
    await accessControl.grantRole(PAUSER_ROLE, account)
    await pause.pause()

    await expect(contract.function()).to.be.revertedWithCustomError(
        contract,
        'IsPaused'
    )
})
```

### Input Validation Errors

```typescript
it('GIVEN zero value WHEN calling function THEN reverts with EmptyUint', async function () {
    await expect(contract.function(0)).to.be.revertedWithCustomError(
        contract,
        'EmptyUint'
    )
})

it('GIVEN zero address WHEN calling function THEN reverts with AddressZero', async function () {
    await expect(
        contract.function(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(contract, 'AddressZero')
})
```

### State Validation Errors

```typescript
it('GIVEN already initialized WHEN initializing again THEN reverts with ContractIsAlreadyInitialized', async function () {
    await contract.initialize(params)

    await expect(contract.initialize(params)).to.be.revertedWithCustomError(
        contract,
        'ContractIsAlreadyInitialized'
    )
})

it('GIVEN invalid state WHEN calling function THEN reverts with specific error', async function () {
    await expect(contract.function()).to.be.revertedWithCustomError(
        contract,
        'InvalidState'
    )
})
```

## Getter Testing Pattern

Group getters at the end of each functional test group:

```typescript
describe('Reading state', function () {
    beforeEach(async () => {
        const fixture = async () => {
            await contract.initialize(params)
            await contract.setState(value)
        }
        await loadFixture(fixture)
    })

    it('GIVEN initialized contract WHEN reading state1 THEN returns correct value', async function () {
        expect(await contract.getter1()).to.equal(expectedValue1)
    })

    it('GIVEN initialized contract WHEN reading state2 THEN returns correct value', async function () {
        expect(await contract.getter2()).to.equal(expectedValue2)
    })

    it('GIVEN multiple state changes WHEN reading derived state THEN returns correct computation', async function () {
        await contract.updateState(newValue)
        expect(await contract.derivedGetter()).to.equal(expectedDerivedValue)
    })
})
```

## Complete Test Template

```typescript
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { ContractType, AccessControl, ISBEPause } from '../typechain-types'
import { ROLE_CONSTANT, OTHER_CONSTANT } from './constants'

describe('FacetName', function () {
    // State variables
    let contract: ContractType
    let accessControl: AccessControl
    let pause: ISBEPause
    let owner: Signer
    let other: Signer
    let ownerAddress: string
    let otherAddress: string

    // Deployment fixture
    async function deployFixture() {
        const [ownerSigner, otherSigner] = await ethers.getSigners()
        const ownerAddr = await ownerSigner.getAddress()
        const otherAddr = await otherSigner.getAddress()

        const result = await deployGovernance(
            ownerSigner,
            [{ role: ROLE_CONSTANT, members: [ownerAddr] }],
            CONFIGURATION_ID
        )

        return {
            owner: ownerSigner,
            other: otherSigner,
            ownerAddress: ownerAddr,
            otherAddress: otherAddr,
            contract: result.contract,
            accessControl: result.accessControl,
            pause: result.pause,
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        owner = contracts.owner
        other = contracts.other
        ownerAddress = contracts.ownerAddress
        otherAddress = contracts.otherAddress
        contract = contracts.contract
        accessControl = contracts.accessControl
        pause = contracts.pause
    })

    describe('Initialization', () => {
        it('GIVEN contract deployed WHEN initializing twice THEN reverts with ContractIsAlreadyInitialized', async function () {
            await contract.initialize(params)

            await expect(
                contract.initialize(params)
            ).to.be.revertedWithCustomError(
                contract,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN valid parameters WHEN initializing THEN succeeds', async function () {
            await expect(contract.initialize(params))
                .to.emit(contract, 'Initialized')
                .withArgs(expectedValue)
        })

        it('GIVEN initialized contract WHEN reading state THEN returns expected values', async function () {
            await contract.initialize(params)

            expect(await contract.getter1()).to.equal(expected1)
            expect(await contract.getter2()).to.equal(expected2)
        })
    })

    describe('mainFunction', () => {
        // Setup if needed
        beforeEach(async () => {
            const fixture = async () => {
                await contract.initialize(params)
                await accessControl.grantRole(ROLE_CONSTANT, ownerAddress)
            }
            await loadFixture(fixture)
        })

        // ERROR CASES FIRST
        it('GIVEN unauthorized caller WHEN calling function THEN reverts with AccountHasNoRole', async function () {
            await expect(
                contract.connect(other).mainFunction(param)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN invalid input WHEN calling function THEN reverts with EmptyUint', async function () {
            await expect(
                contract.mainFunction(0)
            ).to.be.revertedWithCustomError(contract, 'EmptyUint')
        })

        it('GIVEN paused contract WHEN calling function THEN reverts with IsPaused', async function () {
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await pause.pause()

            await expect(
                contract.mainFunction(param)
            ).to.be.revertedWithCustomError(contract, 'IsPaused')
        })

        // SUCCESS CASE
        it('GIVEN valid conditions WHEN calling function THEN succeeds and emits event', async function () {
            await expect(contract.mainFunction(param))
                .to.emit(contract, 'FunctionExecuted')
                .withArgs(ownerAddress, param)

            // Immediate state validation
            expect(await contract.getState()).to.equal(expectedValue)
        })
    })

    describe('Reading state', function () {
        beforeEach(async () => {
            const fixture = async () => {
                await contract.initialize(params)
                await accessControl.grantRole(ROLE_CONSTANT, ownerAddress)
                await contract.mainFunction(value)
            }
            await loadFixture(fixture)
        })

        it('GIVEN updated state WHEN reading getter1 THEN returns expected value', async function () {
            expect(await contract.getter1()).to.equal(expected1)
        })

        it('GIVEN updated state WHEN reading getter2 THEN returns expected value', async function () {
            expect(await contract.getter2()).to.equal(expected2)
        })
    })
})
```

## Key Principles

1. **Always test errors BEFORE success cases** - This catches edge cases and validates proper error handling
2. **Group by facet/functionality** - Makes tests easier to navigate and maintain
3. **Use descriptive test names** - Follow the GIVEN-WHEN-THEN pattern consistently
4. **Validate ALL state changes** - After successful transactions, check all affected getters
5. **Use fixtures properly** - Share setup code efficiently with `loadFixture`
6. **Test pause mechanism** - Every state-changing function should be tested when paused
7. **Test access control** - Every restricted function should be tested with unauthorized callers
8. **Test input validation** - Check zero addresses, zero values, and invalid ranges

## Benefits of This Structure

- **Clear error coverage** - All error paths tested before happy paths
- **Easy to review** - Errors grouped together, success cases separate
- **Maintainable** - Facet-based organization matches contract architecture
- **Comprehensive** - Getters validated after each state change
- **Consistent** - Same pattern across all test files
- **Efficient** - Proper use of fixtures reduces redundant setup

<citations>
<document>
    <document_type>RULE</document_type>
    <document_id>8fiN6uGTkwxkp0Yg8EHCUV</document_id>
</document>
<document>
    <document_type>RULE</document_type>
    <document_id>/Users/marcosserradilla/dev/workspace/io.builders/isbe/isbe-contracts/WARP.md</document_id>
</document>
</citations>
