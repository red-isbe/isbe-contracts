import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactory,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
    CounterFacetTestWrapper__factory,
    CounterV2FacetTestWrapper__factory,
} from '../../typechain-types'
import { Signer } from 'ethers'
import {
    BUSINESS_LOGIC_FACTORY_RESOLVER_KEY,
    COUNTER_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    ISBE_ROLE,
} from '../constants'

describe('BusinessLogicFactory', function () {
    let admin: Signer
    let nonAdmin: Signer
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
    let CounterFacetFactory: CounterFacetTestWrapper__factory
    let CounterV2FacetFactory: CounterV2FacetTestWrapper__factory
    let diamondProxy: EIP2535AccessControl
    let businessLogicFactoryFacet: BusinessLogicFactoryFacet
    let businessLogicFactory: BusinessLogicFactory

    async function deployInitial() {
        ;[admin, nonAdmin] = await ethers.getSigners()
        // Despliegue AccessControl logic
        BusinessLogicFactoryFactory = await ethers.getContractFactory(
            'BusinessLogicFactoryFacet'
        )
        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        CounterFacetFactory = await ethers.getContractFactory(
            'CounterFacetTestWrapper'
        )
        CounterV2FacetFactory = await ethers.getContractFactory(
            'CounterV2FacetTestWrapper'
        )
        businessLogicFactoryFacet = await BusinessLogicFactoryFactory.deploy()
        await businessLogicFactoryFacet.waitForDeployment()
        expect(
            await businessLogicFactoryFacet.businessIdIntrospection()
        ).to.be.equal(BUSINESS_LOGIC_FACTORY_RESOLVER_KEY)
    }

    before(async () => {
        await deployInitial()
    })

    describe('deploy', () => {
        beforeEach(async () => {
            const facetAddresses = [
                await businessLogicFactoryFacet.getAddress(),
            ]
            diamondProxy = await EIP2535AccessControlFactory.deploy(
                facetAddresses,
                {
                    rbacs: [
                        {
                            role: DEFAULT_ADMIN_ROLE,
                            members: [await admin.getAddress()],
                        },
                        {
                            role: ISBE_ROLE,
                            members: [await admin.getAddress()],
                        },
                    ],
                    init: ethers.ZeroAddress,
                    initCalldata: '0x',
                }
            )
            await diamondProxy.waitForDeployment()
            businessLogicFactory = BusinessLogicFactoryFactory.attach(
                await diamondProxy.getAddress()
            ) as BusinessLogicFactory
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN try to deploy with non ISBE ROLE THEN it fails', async () => {
            await expect(
                businessLogicFactory
                    .connect(nonAdmin)
                    .deploy(ethers.ZeroHash, '0x')
            )
                .to.be.revertedWithCustomError(
                    businessLogicFactory,
                    'AccountHasNoRole'
                )
                .withArgs(await nonAdmin.getAddress(), ISBE_ROLE)
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy with empty businessId THEN it fails', async () => {
            await expect(
                businessLogicFactory.deploy(ethers.ZeroHash, '0x')
            ).to.be.revertedWithCustomError(
                businessLogicFactory,
                'EmptyBytes32'
            )
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy with empty bode THEN it fails', async () => {
            await expect(
                businessLogicFactory.deploy(
                    BUSINESS_LOGIC_FACTORY_RESOLVER_KEY,
                    '0x'
                )
            ).to.be.revertedWithCustomError(businessLogicFactory, 'EmptyBytes')
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy with incorrect bytecode THEN it fails', async () => {
            await expect(
                businessLogicFactory.deploy(
                    BUSINESS_LOGIC_FACTORY_RESOLVER_KEY,
                    '0x1234556789712543467905869A'
                )
            ).to.be.revertedWithCustomError(
                businessLogicFactory,
                'DeployFailed'
            )
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy with incorrect businessId THEN it fails', async () => {
            await expect(
                businessLogicFactory.deploy(
                    BUSINESS_LOGIC_FACTORY_RESOLVER_KEY,
                    CounterFacetFactory.bytecode
                )
            )
                .to.be.revertedWithCustomError(
                    businessLogicFactory,
                    'BadBusinessId'
                )
                .withArgs(BUSINESS_LOGIC_FACTORY_RESOLVER_KEY)
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy with correct businessId THEN it success', async () => {
            const deployTx = businessLogicFactory.deploy(
                COUNTER_RESOLVER_KEY,
                CounterFacetFactory.bytecode
            )
            const counterBusinessLogicAddress: string = (
                await (await deployTx).wait()
            ).logs.find(
                (log) =>
                    log.topics[0] ===
                    businessLogicFactory.interface.getEvent('Deployed')
                        .topicHash
            ).args[1]
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    1
                )
            ).to.be.equal(counterBusinessLogicAddress)
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    2
                )
            ).to.be.equal(ethers.ZeroAddress)
            expect(
                await businessLogicFactory.getBusinessLogics()
            ).to.be.deep.equal([COUNTER_RESOLVER_KEY])
            expect(
                await businessLogicFactory.getBusinessLogicVersions(
                    COUNTER_RESOLVER_KEY
                )
            ).to.be.deep.equal([counterBusinessLogicAddress])
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy two versions THEN it success', async () => {
            let deployTx = businessLogicFactory.deploy(
                COUNTER_RESOLVER_KEY,
                CounterFacetFactory.bytecode
            )
            await (await deployTx).wait()
            const firstErc20BusinessLogicAddress =
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    0
                )
            deployTx = businessLogicFactory.deploy(
                COUNTER_RESOLVER_KEY,
                CounterV2FacetFactory.bytecode
            )
            await (await deployTx).wait()
            const latestErc20BusinessLogicAddress =
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    0
                )
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    1
                )
            ).to.be.equal(firstErc20BusinessLogicAddress)
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    2
                )
            ).to.be.equal(latestErc20BusinessLogicAddress)
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    COUNTER_RESOLVER_KEY,
                    3
                )
            ).to.be.equal(ethers.ZeroAddress)
            expect(
                await businessLogicFactory.getBusinessLogics()
            ).to.be.deep.equal([COUNTER_RESOLVER_KEY])
            expect(
                await businessLogicFactory.getBusinessLogicVersions(
                    COUNTER_RESOLVER_KEY
                )
            ).to.be.deep.equal([
                firstErc20BusinessLogicAddress,
                latestErc20BusinessLogicAddress,
            ])
            await expect(deployTx)
                .to.emit(businessLogicFactory, 'Deployed')
                .withArgs(
                    COUNTER_RESOLVER_KEY,
                    latestErc20BusinessLogicAddress,
                    2
                )
        })
    })
})
