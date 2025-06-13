import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapper__factory,
    ERC20TestWrapperUpdated__factory,
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    BusinessLogicFactory,
    BusinessLogicFactoryFacet__factory,
    BusinessLogicFactoryFacet,
} from '../typechain-types'
import { Signer } from 'ethers'
import {
    BUSINESS_LOGIC_FACTORY_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    ERC20_RESOLVER_KEY,
    ISBE_ROLE,
} from './constants'

describe('BusinessLogicFactory', function () {
    let admin: Signer
    let nonAdmin: Signer
    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let BusinessLogicFactoryFactory: BusinessLogicFactoryFacet__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let ERC20TestWrapperUpdatedFactory: ERC20TestWrapperUpdated__factory
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
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')
        ERC20TestWrapperUpdatedFactory = await ethers.getContractFactory(
            'ERC20TestWrapperUpdated'
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

    describe('EIP2535AccessControl', () => {
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
                    ERC20TestWrapperFactory.bytecode
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
                ERC20_RESOLVER_KEY,
                ERC20TestWrapperFactory.bytecode
            )
            await (await deployTx).wait()
            const erc20BusinessLogicAddress =
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    0
                )
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    1
                )
            ).to.be.equal(erc20BusinessLogicAddress)
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    2
                )
            ).to.be.equal(ethers.ZeroAddress)
            expect(
                await businessLogicFactory.getBusinessLogics()
            ).to.be.deep.equal([ERC20_RESOLVER_KEY])
            expect(
                await businessLogicFactory.getBusinessLogicVersions(
                    ERC20_RESOLVER_KEY
                )
            ).to.be.deep.equal([
                erc20BusinessLogicAddress,
                erc20BusinessLogicAddress,
            ])
            await expect(deployTx)
                .to.emit(businessLogicFactory, 'Deployed')
                .withArgs(ERC20_RESOLVER_KEY, erc20BusinessLogicAddress, 1)
        })

        it('GIVEN an EIP2535 proxy with BusinessLogicFactory WHEN deploy two versions THEN it success', async () => {
            let deployTx = businessLogicFactory.deploy(
                ERC20_RESOLVER_KEY,
                ERC20TestWrapperFactory.bytecode
            )
            await (await deployTx).wait()
            const firstErc20BusinessLogicAddress =
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    0
                )
            deployTx = businessLogicFactory.deploy(
                ERC20_RESOLVER_KEY,
                ERC20TestWrapperUpdatedFactory.bytecode
            )
            await (await deployTx).wait()
            const latestErc20BusinessLogicAddress =
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    0
                )
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    1
                )
            ).to.be.equal(firstErc20BusinessLogicAddress)
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    2
                )
            ).to.be.equal(latestErc20BusinessLogicAddress)
            expect(
                await businessLogicFactory.getBusinessLogicAddress(
                    ERC20_RESOLVER_KEY,
                    3
                )
            ).to.be.equal(ethers.ZeroAddress)
            expect(
                await businessLogicFactory.getBusinessLogics()
            ).to.be.deep.equal([ERC20_RESOLVER_KEY])
            expect(
                await businessLogicFactory.getBusinessLogicVersions(
                    ERC20_RESOLVER_KEY
                )
            ).to.be.deep.equal([
                latestErc20BusinessLogicAddress,
                firstErc20BusinessLogicAddress,
                latestErc20BusinessLogicAddress,
            ])
            await expect(deployTx)
                .to.emit(businessLogicFactory, 'Deployed')
                .withArgs(
                    ERC20_RESOLVER_KEY,
                    latestErc20BusinessLogicAddress,
                    2
                )
        })
    })
})
