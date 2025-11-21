import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import {
    CounterFacetTestWrapper,
    CounterV2FacetTestWrapper,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet,
    EIP2535AccessControl,
} from '../typechain-types'
import { DEFAULT_ADMIN_ROLE, GOVERNANCE_MANAGER_ROLE } from '../utils/constants'
import { MaxUint256, Signer, ZeroAddress } from 'ethers'
import { COUNTER_RESOLVER_KEY } from '../utils/constants'

describe('Initializable', function () {
    let proxy: EIP2535AccessControl
    let cutFacet: DiamondCutAccessControlFacet
    let loupeFacet: DiamondLoupeFacet
    let counterFacet: CounterFacetTestWrapper
    let counterV2Facet: CounterV2FacetTestWrapper
    let cut: DiamondCutAccessControlFacet
    let loupe: DiamondLoupeFacet
    let counter: CounterFacetTestWrapper
    let counterV2: CounterV2FacetTestWrapper
    let admin: Signer
    let adminAddress: string

    async function deployFixture() {
        ;[admin] = await ethers.getSigners()
        adminAddress = await admin.getAddress()

        // Deploy proxy
        const DiamondCutAccessControlFacetFactory =
            await ethers.getContractFactory('DiamondCutAccessControlFacet')
        cutFacet =
            (await DiamondCutAccessControlFacetFactory.deploy()) as DiamondCutAccessControlFacet
        await cutFacet.waitForDeployment()

        const DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')
        loupeFacet =
            (await DiamondLoupeFacetFactory.deploy()) as DiamondLoupeFacet
        await loupeFacet.waitForDeployment()

        // Deploy Counter (v1)
        const CounterFactory = await ethers.getContractFactory(
            'CounterFacetTestWrapper'
        )
        counterFacet =
            (await CounterFactory.deploy()) as CounterFacetTestWrapper
        await counterFacet.waitForDeployment()

        // Deploy CounterV2 (v2)
        const CounterV2Factory = await ethers.getContractFactory(
            'CounterV2FacetTestWrapper'
        )
        counterV2Facet =
            (await CounterV2Factory.deploy()) as CounterV2FacetTestWrapper
        await counterV2Facet.waitForDeployment()

        const facets = [
            await cutFacet.getAddress(),
            await loupeFacet.getAddress(),
            await counterFacet.getAddress(),
        ]
        const args = {
            rbacs: [
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [adminAddress],
                },
                {
                    role: GOVERNANCE_MANAGER_ROLE,
                    members: [adminAddress],
                },
            ],
            init: ZeroAddress,
            initCalldata: '0x',
        }
        const DiamondFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        proxy = await DiamondFactory.deploy(facets, args)
        await proxy.waitForDeployment()
        const proxyAddress = await proxy.getAddress()
        cut = DiamondCutAccessControlFacetFactory.attach(
            proxyAddress
        ) as DiamondCutAccessControlFacet
        loupe = DiamondLoupeFacetFactory.attach(
            proxyAddress
        ) as DiamondLoupeFacet
        counter = CounterFactory.attach(proxyAddress) as CounterFacetTestWrapper
        counterV2 = CounterV2Factory.attach(
            proxyAddress
        ) as CounterV2FacetTestWrapper
    }

    beforeEach(async () => {
        await loadFixture(deployFixture)
    })

    // Test 1: Initializer on a fresh contract (version 0)
    describe('Initializer on fresh contract', function () {
        it('GIVEN a fresh contract WHEN initializer is called with version 1 THEN it initializes successfully', async function () {
            const version = 1
            await expect(counter.initializeCounter(100))
                .to.emit(counter, 'Initialized')
                .withArgs(COUNTER_RESOLVER_KEY, version)
            const storedVersion = await loupe.facetVersion(COUNTER_RESOLVER_KEY)
            expect(storedVersion).to.equal(version)
        })
        it('GIVEN a fresh contract WHEN initializer is called with version 0 THEN it fails', async () => {
            await expect(
                counter.badInitializer()
            ).to.be.revertedWithCustomError(counter, 'InvalidVersionZero')
        })
    })
    // Test 2: Initializer on already initialized contract
    describe('Initializer on already initialized contract', function () {
        beforeEach(async function () {
            await counter.initializeCounter(100)
        })
        it('GIVEN an initialized contract WHEN initializer is called again THEN it reverts', async function () {
            await expect(counter.initializeCounter(200))
                .to.be.revertedWithCustomError(
                    counter,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(COUNTER_RESOLVER_KEY, 1, 1)
        })
    })
    // Test 3: Reinitializer with higher version
    describe('Reinitializer with higher version', function () {
        beforeEach(async function () {
            await counter.initializeCounter(100)
            await cut.facetUpdates(
                [
                    await cutFacet.getAddress(),
                    await loupeFacet.getAddress(),
                    await counterV2Facet.getAddress(),
                ],
                ZeroAddress,
                '0x'
            )
        })
        it('GIVEN a 0 versioned contract WHEN initializer is called THEN it reverts', async function () {
            await expect(
                counterV2.badInitializer()
            ).to.be.revertedWithCustomError(counterV2, 'InvalidVersionZero')
        })
        it('GIVEN an versioned contract WHEN initializer is called again THEN it reverts', async function () {
            await expect(counterV2.initializeCounter(200))
                .to.be.revertedWithCustomError(
                    counterV2,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(COUNTER_RESOLVER_KEY, 1, 2)
        })
        it('GIVEN a contract with version 1 WHEN reinitializer is called with version 2 THEN it upgrades successfully', async function () {
            const version = 2
            await expect(counterV2.reinitializeCounter(200))
                .to.emit(counterV2, 'Reinitialized')
                .withArgs(COUNTER_RESOLVER_KEY, 1, version)
            const storedVersion = await loupe.facetVersion(COUNTER_RESOLVER_KEY)
            expect(storedVersion).to.equal(version)
        })
        it('GIVEN a contract with version 0 WHEN reinitializer is called with version 2 THEN it reverts', async function () {
            await counterV2.setVersion(0)
            await expect(counterV2.reinitializeCounter(200))
                .to.be.revertedWithCustomError(
                    counterV2,
                    'InvalidReinitializerVersion'
                )
                .withArgs(COUNTER_RESOLVER_KEY, 0, 2)
        })
    })
    // Test 4: Disabling initializers
    describe('Disabling initializers', function () {
        it('GIVEN a locked contract WHEN initializer is called THEN it reverts', async function () {
            await expect(counterFacet.initializeCounter(200))
                .to.be.revertedWithCustomError(
                    counterV2,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(COUNTER_RESOLVER_KEY, MaxUint256, 1)
        })
        it('GIVEN a locked contract WHEN reinitializer is called THEN it reverts', async function () {
            await expect(counterV2Facet.reinitializeCounter(200))
                .to.be.revertedWithCustomError(
                    counterV2,
                    'InvalidReinitializerVersion'
                )
                .withArgs(COUNTER_RESOLVER_KEY, MaxUint256, 2)
        })
    })
    // Test 5: onlyAfterVersion modifier
    describe('onlyAfterVersion modifier', function () {
        beforeEach(async function () {
            await counter.initializeCounter(100)
            await cut.facetUpdates(
                [
                    await cutFacet.getAddress(),
                    await loupeFacet.getAddress(),
                    await counterV2Facet.getAddress(),
                ],
                ZeroAddress,
                '0x'
            )
        })
        it('GIVEN a contract with version 2 WHEN onlyAfterVersion is called with minVersion 2 THEN it passes', async function () {
            await counterV2.reinitializeCounter(2)
            await expect(counterV2.decrement(2)).to.not.be.reverted
        })
        it('GIVEN a contract with version 2 WHEN onlyAfterVersion is called with minVersion 1 THEN it reverts', async function () {
            await expect(counterV2.decrement(2))
                .to.be.revertedWithCustomError(counterV2, 'InsufficientVersion')
                .withArgs(COUNTER_RESOLVER_KEY, 1, 2)
        })
    })
    // Test 6: onlyBeforeVersion modifier
    describe('onlyBeforeVersion modifier', function () {
        beforeEach(async function () {
            await counter.initializeCounter(100)
            await cut.facetUpdates(
                [
                    await cutFacet.getAddress(),
                    await loupeFacet.getAddress(),
                    await counterV2Facet.getAddress(),
                ],
                ZeroAddress,
                '0x'
            )
        })
        it('GIVEN a contract with version 2 WHEN onlyBeforeVersion is called with minVersion 2 THEN it passes', async function () {
            await counterV2.reinitializeCounter(2)
            await expect(counterV2.increment(2)).to.not.be.reverted
        })
        it('GIVEN a contract with version 2 WHEN onlyAfterVersion is called with minVersion 3 THEN it reverts', async function () {
            await counterV2.setVersion(3)
            await expect(counterV2.increment(2))
                .to.be.revertedWithCustomError(counterV2, 'InsufficientVersion')
                .withArgs(COUNTER_RESOLVER_KEY, 3, 2)
        })
    })
})
