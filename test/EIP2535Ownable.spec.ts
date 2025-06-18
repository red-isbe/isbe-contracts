import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ERC20TestWrapper__factory,
    ERC20TestWrapper,
    EIP2535Ownable__factory,
    DiamondCutOwnableFacet__factory,
    DiamondLoupeFacet__factory,
    EIP2535Ownable,
    DiamondCutOwnableFacet,
    DiamondLoupeFacet,
    IDiamond,
    IEIP2535Introspection,
    Ownable2StepFacet__factory,
    Ownable2StepFacet,
    DiamondCutAccessControlFacet,
    AccessControlFacet,
    ISBEPauseFacet,
    AccessControlFacet__factory,
    ISBEPauseFacet__factory,
} from '../typechain-types'
import { Signer } from 'ethers'
import {
    DIAMOND_CUT_RESOLVER_KEY,
    ERC20_RESOLVER_KEY,
    PAUSER_ROLE,
} from './constants'

const NAME = 'My Token'
const SYMBOL = 'MTK'
const DECIMALS = 18

describe('EIP2535OwnableProxy', function () {
    let admin: Signer
    let nonAdmin: Signer
    let EIP2535OwnableFactory: EIP2535Ownable__factory
    let DiamondCutOwnableFacetFactory: DiamondCutOwnableFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory
    let AccessControlFacetFactory: AccessControlFacet__factory
    let ISBEPauseFacetFactory: ISBEPauseFacet__factory
    let erc20Impl: ERC20TestWrapper
    let pauseFacet: ISBEPauseFacet
    let erc20: ERC20TestWrapper
    let accessControlFacet: AccessControlFacet
    let diamondProxy: EIP2535Ownable
    let diamondCutFacet: DiamondCutOwnableFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let facetCutsList: IDiamond.FacetCutStruct[]
    let accessControl: AccessControlFacet

    async function deployInitial() {
        ;[admin, nonAdmin] = await ethers.getSigners()
        // Despliegue Ownable logic
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')
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
        accessControlFacet = await AccessControlFacetFactory.deploy()
        diamondCutFacet = await DiamondCutOwnableFacetFactory.deploy()
        diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        pauseFacet = await ISBEPauseFacetFactory.deploy()
        await erc20Impl.waitForDeployment()
        await accessControlFacet.waitForDeployment()
        await diamondCutFacet.waitForDeployment()
        await diamondLoupeFacet.waitForDeployment()
        await pauseFacet.waitForDeployment()
        expect(await erc20Impl.businessIdIntrospection()).to.equal(
            ERC20_RESOLVER_KEY
        )
        expect(await diamondCutFacet.businessIdIntrospection()).to.equal(
            DIAMOND_CUT_RESOLVER_KEY
        )
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
                        [NAME, SYMBOL, DECIMALS]
                    ),
            }
        )
        await diamondProxy.waitForDeployment()
        erc20 = ERC20TestWrapperFactory.attach(
            await diamondProxy.getAddress()
        ) as ERC20TestWrapper
        await erc20.initializeCap(10000)
        const adminAddress = await admin.getAddress()
        accessControl = AccessControlFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as AccessControlFacet
        await accessControl.initializeAccessControl(adminAddress)
        await accessControl.grantRole(PAUSER_ROLE, adminAddress)
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
        const pause: ISBEPauseFacet = ISBEPauseFacetFactory.attach(
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
        expect(await erc20.name()).to.equal(NAME)
        expect(await erc20.symbol()).to.equal(SYMBOL)
        expect(await erc20.decimals()).to.equal(DECIMALS)
    })

    it('GIVEN an ERC20 deployed linked to a EIP2535 proxy WHEN update THEN it can be updated', async () => {
        const diamondCut = DiamondCutOwnableFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as DiamondCutOwnableFacet
        await diamondCut.facetUpdates(
            [
                await diamondCutFacet.getAddress(),
                await diamondLoupeFacet.getAddress(),
                await erc20Impl.getAddress(),
            ],
            ethers.ZeroAddress,
            '0x'
        )
        expect(await erc20.name()).to.equal(NAME)
        expect(await erc20.symbol()).to.equal(SYMBOL)
        expect(await erc20.decimals()).to.equal(DECIMALS)
    })

    it('GIVEN an ERC20 deployed linked to a EIP2535 proxy WHEN add new Ownable2Step THEN it can be used', async () => {
        const Ownable2StepFacetFactory: Ownable2StepFacet__factory =
            await ethers.getContractFactory('Ownable2StepFacet')
        const ownable2StepFacetImpl: Ownable2StepFacet =
            await Ownable2StepFacetFactory.deploy()
        await ownable2StepFacetImpl.waitForDeployment()
        const diamondCut = DiamondCutOwnableFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as DiamondCutOwnableFacet

        await diamondCut.diamondCut(
            [
                {
                    facetAddress: await ownable2StepFacetImpl.getAddress(),
                    action: 0,
                    functionSelectors: [
                        ...(await ownable2StepFacetImpl.selectorsIntrospection()),
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
            await ownable2StepFacetImpl.getAddress()
        )
        expect(facets[5].functionSelectors).to.deep.equal(
            await ownable2StepFacetImpl.selectorsIntrospection()
        )
        const ownable2StepFacet: Ownable2StepFacet =
            Ownable2StepFacetFactory.attach(await diamondProxy.getAddress())
        expect(await ownable2StepFacet.owner()).to.be.equal(
            await admin.getAddress()
        )
        expect(await erc20.name()).to.equal(NAME)
        expect(await erc20.symbol()).to.equal(SYMBOL)
        expect(await erc20.decimals()).to.equal(DECIMALS)
    })
})
