import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapper,
    ERC20TestWrapper__factory,
    ERC20TestWrapperUpdated__factory,
    ERC20TestWrapperUpdated,
    EIP2535Ownable__factory,
    DiamondCutOwnableFacet__factory,
    DiamondLoupeFacet__factory,
    EIP2535Ownable,
    DiamondCutOwnableFacet,
    DiamondLoupeFacet,
    IDiamond,
    IEIP2535Introspection,
    Ownable2Step__factory,
    Ownable2Step,
    ISBEPause,
    DiamondCutAccessControlFacet,
    ISBEPause__factory,
    AccessControl__factory,
    AccessControl,
    AccessControlFacet,
    ISBEPauseFacet,
    AccessControlFacet__factory,
    ISBEPauseFacet__factory,
} from '../typechain-types'
import { Signer } from 'ethers'
import { PAUSER_ROLE } from './constants'

describe('EIP2535OwnableProxy', function () {
    let admin: Signer
    let nonAdmin: Signer
    let EIP2535OwnableFactory: EIP2535Ownable__factory
    let DiamondCutOwnableFacetFactory: DiamondCutOwnableFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let ERC20TestWrapperUpdatedFactory: ERC20TestWrapperUpdated__factory
    let AccessControlFacetFactory: AccessControlFacet__factory
    let ISBEPauseFacetFactory: ISBEPauseFacet__factory
    let erc20Impl: ERC20TestWrapper
    let erc20ImplUpdated: ERC20TestWrapperUpdated
    let pauseFacet: ISBEPauseFacet
    let erc20: ERC20TestWrapper
    let erc20Updated: ERC20TestWrapperUpdated
    let accessControlFacet: AccessControlFacet
    let diamondProxy: EIP2535Ownable
    let diamondCutFacet: DiamondCutOwnableFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let facetCutsList: IDiamond.FacetCutStruct[]

    async function deployInitial() {
        ;[admin, nonAdmin] = await ethers.getSigners()
        // Despliegue Ownable logic
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')
        ERC20TestWrapperUpdatedFactory = await ethers.getContractFactory(
            'ERC20TestWrapperUpdated'
        )
        AccessControlFacetFactory =
            await ethers.getContractFactory('AccessControlFacet')
        DiamondCutOwnableFacetFactory = await ethers.getContractFactory(
            'DiamondCutOwnableFacet'
        )
        DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')
        EIP2535OwnableFactory =
            await ethers.getContractFactory('EIP2535Ownable')
        ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')
        erc20Impl = await ERC20TestWrapperFactory.deploy()
        erc20ImplUpdated = await ERC20TestWrapperUpdatedFactory.deploy()
        accessControlFacet = await AccessControlFacetFactory.deploy()
        diamondCutFacet = await DiamondCutOwnableFacetFactory.deploy()
        diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        pauseFacet = await ISBEPauseFacetFactory.deploy()
        await erc20Impl.waitForDeployment()
        await erc20ImplUpdated.waitForDeployment()
        await accessControlFacet.waitForDeployment()
        await diamondCutFacet.waitForDeployment()
        await diamondLoupeFacet.waitForDeployment()
        await pauseFacet.waitForDeployment()
    }

    before(async () => {
        await deployInitial()
    })

    const buildFacetCutForDeployment = async (
        facets: IEIP2535Introspection[]
    ) => {
        facetCutsList = []
        const action = 0
        for (const facet of facets) {
            const facetAddress = await facet.getAddress()
            const functionSelectors = await facet.selectorsIntrospection()
            facetCutsList.push({
                facetAddress,
                action,
                functionSelectors: [...functionSelectors],
            })
        }
        return facetCutsList
    }

    beforeEach(async () => {
        diamondProxy = await EIP2535OwnableFactory.deploy(
            await buildFacetCutForDeployment([
                diamondCutFacet as IEIP2535Introspection,
                diamondLoupeFacet as IEIP2535Introspection,
                accessControlFacet as IEIP2535Introspection,
                erc20Impl as IEIP2535Introspection,
                pauseFacet as IEIP2535Introspection,
            ]),
            {
                owned: await admin.getAddress(),
                init: await erc20Impl.getAddress(),
                initCalldata:
                    ERC20TestWrapperFactory.interface.encodeFunctionData(
                        erc20Impl.initializeErc20.fragment,
                        ['My Token', 'MTK', 18]
                    ),
            }
        )
        await diamondProxy.waitForDeployment()
        erc20 = ERC20TestWrapperFactory.attach(
            await diamondProxy.getAddress()
        ) as ERC20TestWrapper
        await erc20.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        await erc20.initializeAccessControl(adminAddress)
        await erc20.grantRole(PAUSER_ROLE, adminAddress)
        erc20Updated = ERC20TestWrapperUpdatedFactory.attach(
            await diamondProxy.getAddress()
        ) as ERC20TestWrapperUpdated
    })

    it('GIVEN an ERC20 deployed WHEN deploy a EIP2535 proxy THEN cant use DiamondCut without ownership', async () => {
        const diamondCut: DiamondCutOwnableFacet =
            DiamondCutOwnableFacetFactory.attach(
                await diamondProxy.getAddress()
            )
        await expect(
            diamondCut
                .connect(nonAdmin)
                .diamondCut([], ethers.ZeroAddress, '0x')
        )
            .to.be.revertedWithCustomError(diamondCut, 'AccountIsNotOwner')
            .withArgs(await nonAdmin.getAddress())
        await expect(
            diamondCut
                .connect(nonAdmin)
                .facetUpdates([], ethers.ZeroAddress, '0x')
        )
            .to.be.revertedWithCustomError(diamondCut, 'AccountIsNotOwner')
            .withArgs(await nonAdmin.getAddress())
    })

    it('GIVEN deployed EIP2535 proxy WHEN pause THEN cant use DiamondCut', async () => {
        const pause: ISBEPause = ISBEPauseFactory.attach(
            await diamondProxy.getAddress()
        )
        await pause.pause()
        const diamondCut: DiamondCutAccessControlFacet =
            DiamondCutOwnableFacetFactory.attach(
                await diamondProxy.getAddress()
            )
        await expect(diamondCut.diamondCut([], ethers.ZeroAddress, '0x'))
            .to.be.revertedWithCustomError(diamondCut, 'IsPaused')
            .withArgs()
        await expect(diamondCut.facetUpdates([], ethers.ZeroAddress, '0x'))
            .to.be.revertedWithCustomError(diamondCut, 'IsPaused')
            .withArgs()
    })

    it('GIVEN an ERC20 deployed WHEN deploy a EIP2535 proxy THEN it can be initialized', async () => {
        const diamondLoupe: DiamondLoupeFacet = DiamondLoupeFacetFactory.attach(
            await diamondProxy.getAddress()
        )
        const facets = await diamondLoupe.facets()
        for (const index in facetCutsList) {
            expect(facets[index].facetAddress).to.equal(
                facetCutsList[index].facetAddress
            )
            expect([...facets[index].functionSelectors]).to.deep.equal(
                facetCutsList[index].functionSelectors
            )
            expect([
                ...(await diamondLoupe.facetFunctionSelectors(
                    facetCutsList[index].facetAddress
                )),
            ]).to.deep.equal(facetCutsList[index].functionSelectors)
            expect(
                await diamondLoupe.facetAddress(
                    facetCutsList[index].functionSelectors[0]
                )
            ).to.be.equal(facetCutsList[index].facetAddress)
        }
        expect([...(await diamondLoupe.facetAddresses())]).to.deep.equal(
            facetCutsList.map((facet) => facet.facetAddress)
        )
        expect(await diamondLoupe.supportsInterface('0x1626ba7e')).to.be.false
    })

    it('GIVEN an ERC20 deployed WHEN deploy a EIP2535 proxy THEN it can be initialized', async () => {
        expect(await erc20.name()).to.equal('My Token')
        expect(await erc20.symbol()).to.equal('MTK')
        expect(await erc20.decimals()).to.equal(18)
        await expect(erc20Updated.metadata())
            .revertedWithCustomError(diamondProxy, 'FunctionNotFound')
            .withArgs('0x392f37e9')
    })

    it('GIVEN an ERC20 deployed linked to a EIP2535 proxy WHEN update THEN it can be updated', async () => {
        const diamondCut = DiamondCutOwnableFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as DiamondCutOwnableFacet
        await diamondCut.facetUpdates(
            [
                await diamondCutFacet.getAddress(),
                await diamondLoupeFacet.getAddress(),
                await erc20ImplUpdated.getAddress(),
            ],
            ethers.ZeroAddress,
            '0x'
        )
        expect(await erc20.name()).to.equal('My Token')
        expect(await erc20.symbol()).to.equal('MTK')
        expect(await erc20.decimals()).to.equal(18)
        expect(await erc20Updated.metadata()).to.be.deep.equal([
            'My Token',
            'MTK',
            18,
        ])
    })

    it('GIVEN an ERC20 deployed linked to a EIP2535 proxy WHEN add new Ownable2Step THEN it can be used', async () => {
        const Ownable2StepFactory: Ownable2Step__factory =
            await ethers.getContractFactory('Ownable2Step')
        const Ownable2StepImpl: Ownable2Step =
            await Ownable2StepFactory.deploy()
        await Ownable2StepImpl.waitForDeployment()
        const diamondCut = DiamondCutOwnableFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as DiamondCutOwnableFacet

        await diamondCut.diamondCut(
            [
                {
                    facetAddress: await Ownable2StepImpl.getAddress(),
                    action: 0,
                    functionSelectors: [
                        ...(await Ownable2StepImpl.selectorsIntrospection()),
                    ],
                },
            ],
            ethers.ZeroAddress,
            '0x'
        )
        const diamondLoupe: DiamondLoupeFacet = DiamondLoupeFacetFactory.attach(
            await diamondProxy.getAddress()
        )
        const facets = await diamondLoupe.facets()
        expect(facets[5].facetAddress).to.equal(
            await Ownable2StepImpl.getAddress()
        )
        expect(facets[5].functionSelectors).to.deep.equal(
            await Ownable2StepImpl.selectorsIntrospection()
        )
        const Ownable2Step: Ownable2Step = Ownable2StepFactory.attach(
            await diamondProxy.getAddress()
        )
        expect(await Ownable2Step.owner()).to.be.equal(await admin.getAddress())
        expect(await erc20.name()).to.equal('My Token')
        expect(await erc20.symbol()).to.equal('MTK')
        expect(await erc20.decimals()).to.equal(18)
        await expect(erc20Updated.metadata())
            .revertedWithCustomError(diamondProxy, 'FunctionNotFound')
            .withArgs('0x392f37e9')
    })
})
