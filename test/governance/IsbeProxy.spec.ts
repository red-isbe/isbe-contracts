import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    AccessControl,
    ConfigurationManagementFacet,
    IEIP2535Introspection,
    IsbeCutFacet,
    IsbeLoupeFacet,
    ISBEPause,
} from '../../typechain-types'
import { Signer } from 'ethers'
import { deployGovernance } from '../fixtures/governance'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    ACCESS_CONTROL_RESOLVER_KEY,
    ACCESS_CONTROL_DID_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    CONFIGURATION_ID_PROXY_TESTS,
    CONFIGURATION_MANAGER_ROLE,
    ERC20_BURNABLE_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    ERC203643_CONTROLLER_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    FORBIDDEN_ERC165_INTERFACE_ID,
    HASH_TIMESTAMP_RESOLVER_KEY,
    ISBE_CUT_RESOLVER_KEY,
    ISBE_LOUPE_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    OWNABLE_RESOLVER_KEY,
    PAUSE_RESOLVER_KEY,
    PAUSER_ROLE,
} from '../../utils/constants'

describe('IsbeProxy', function () {
    let admin: Signer
    let isbeCutFacet: IsbeCutFacet
    let isbeLoupeFacet: IsbeLoupeFacet
    let accessControl: AccessControl
    let governanceAddress: string
    let configurationManagementFacet: ConfigurationManagementFacet
    let pause: ISBEPause

    async function deployFixture() {
        const [adminSigner] = await ethers.getSigners()
        admin = adminSigner

        const result = await deployGovernance(
            admin,
            [],
            CONFIGURATION_ID_PROXY_TESTS
        )

        governanceAddress = await result.governanceContract.getAddress()

        return {
            admin,
            governanceAddress,
            isbeCutFacet: await ethers.getContractAt(
                'IsbeCutFacet',
                result.useCaseProxy
            ),
            isbeLoupeFacet: await ethers.getContractAt(
                'IsbeLoupeFacet',
                result.useCaseProxy
            ),
            accessControl: await ethers.getContractAt(
                'AccessControl',
                result.useCaseProxy
            ),
            configurationManagementFacet: await ethers.getContractAt(
                'ConfigurationManagementFacet',
                await result.governanceContract.getAddress()
            ),
            pause: await ethers.getContractAt('ISBEPause', result.useCaseProxy),
        }
    }

    beforeEach(async () => {
        const contracts = await loadFixture(deployFixture)
        admin = contracts.admin
        governanceAddress = contracts.governanceAddress
        isbeCutFacet = contracts.isbeCutFacet
        isbeLoupeFacet = contracts.isbeLoupeFacet
        accessControl = contracts.accessControl
        configurationManagementFacet = contracts.configurationManagementFacet
        pause = contracts.pause
    })

    async function extracted() {
        const businessLogics = [
            HASH_TIMESTAMP_RESOLVER_KEY,
            ASSET_EVENT_TRACKER_RESOLVER_KEY,
            ACCESS_CONTROL_RESOLVER_KEY,
            ACCESS_CONTROL_DID_RESOLVER_KEY,
            PAUSE_RESOLVER_KEY,
            ISBE_CUT_RESOLVER_KEY,
            ISBE_LOUPE_RESOLVER_KEY,
            OWNABLE_RESOLVER_KEY,
            ERC20_SNAPSHOT_RESOLVER_KEY,
            ERC20_BURNABLE_RESOLVER_KEY,
            ERC203643_CAPPED_RESOLVER_KEY,
            ERC203643_CONTROLLER_RESOLVER_KEY,
            ERC20_RESOLVER_KEY,
            MOCK_TIMESTAMP_RESOLVER_KEY,
        ]

        const facets = await isbeLoupeFacet.facets()
        const facetAddresses = await isbeLoupeFacet.facetAddresses()
        for (const facetIndex in facets) {
            const facet = facets[facetIndex]
            expect(facet.facetAddress).to.be.equal(facetAddresses[facetIndex])
            const introspection: IEIP2535Introspection =
                await ethers.getContractAt(
                    'IEIP2535Introspection',
                    facet.facetAddress
                )
            const businessId = await introspection.businessIdIntrospection()
            const selectors = await introspection.selectorsIntrospection()
            const intefaces = await introspection.interfacesIntrospection()
            expect(businessLogics).to.contain(businessId)
            expect(facet.functionSelectors).to.be.deep.equal(selectors)
            expect(
                await isbeLoupeFacet.facetFunctionSelectors(facet.facetAddress)
            ).to.be.deep.equal(selectors)
            for (const selector of selectors) {
                expect(await isbeLoupeFacet.facetAddress(selector)).to.be.equal(
                    facet.facetAddress
                )
            }
            for (const interfaceId of intefaces) {
                expect(await isbeLoupeFacet.supportsInterface(interfaceId)).to
                    .be.true
            }
        }
        expect(
            await isbeLoupeFacet.supportsInterface(
                FORBIDDEN_ERC165_INTERFACE_ID
            )
        ).to.be.false
    }

    describe('IsbeProxy', () => {
        it('GIVEN deployed use Case proxy WHEN non admin account sets new configuration THEN it fails', async () => {
            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    governanceAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN deployed use Case proxy WHEN admin account sets new configuration to address 0 THEN it fails', async () => {
            await accessControl.grantRole(
                CONFIGURATION_MANAGER_ROLE,
                await admin.getAddress()
            )

            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    ethers.ZeroAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(accessControl, 'AddressZero')
        })

        it('GIVEN deployed use Case proxy WHEN admin account sets new configuration passing wrong initialization THEN it fails', async () => {
            await accessControl.grantRole(
                CONFIGURATION_MANAGER_ROLE,
                await admin.getAddress()
            )

            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    governanceAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [ethers.ZeroAddress],
                    []
                )
            )
                .to.be.revertedWithCustomError(accessControl, 'NotSameLength')
                .withArgs(1, 0)
        })

        it('GIVEN deployed use Case proxy WHEN admin account sets new configuration to 0 THEN it fails', async () => {
            await accessControl.grantRole(
                CONFIGURATION_MANAGER_ROLE,
                await admin.getAddress()
            )

            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    governanceAddress,
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                    1,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(accessControl, 'EmptyBytes32')
        })

        it('GIVEN deployed use Case proxy WHEN admin account sets new configuration to non existing version THEN it fails', async () => {
            await accessControl.grantRole(
                CONFIGURATION_MANAGER_ROLE,
                await admin.getAddress()
            )

            const wrongVersion = 10000000000

            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    governanceAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    wrongVersion,
                    [],
                    []
                )
            )
                .to.be.revertedWithCustomError(
                    configurationManagementFacet,
                    'InvalidConfiguration'
                )
                .withArgs(CONFIGURATION_ID_PROXY_TESTS, wrongVersion)
        })

        it('GIVEN paused deployed use Case proxy WHEN admin account sets new configuration THEN it fails', async () => {
            await accessControl.grantRole(
                CONFIGURATION_MANAGER_ROLE,
                await admin.getAddress()
            )
            await accessControl.grantRole(PAUSER_ROLE, await admin.getAddress())

            await pause.pause()

            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    governanceAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [],
                    []
                )
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN deployed use Case proxy WHEN admin account sets new configuration THEN it succeeds', async () => {
            await accessControl.grantRole(
                CONFIGURATION_MANAGER_ROLE,
                await admin.getAddress()
            )

            await expect(
                isbeCutFacet.setIsbeProxyConfiguration(
                    governanceAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [],
                    []
                )
            )
                .to.emit(isbeCutFacet, 'IsbeProxyConfigurationSet')
                .withArgs(
                    governanceAddress,
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [],
                    []
                )

            await extracted()
        })
    })
})
