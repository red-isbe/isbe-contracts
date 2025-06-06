import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
    ERC20TestWrapper,
    EIP2535AccessControl__factory,
    EIP2535AccessControl,
    ERC20TestWrapper__factory,
    DiamondCutAccessControlFacet__factory,
    DiamondCutAccessControlFacet,
    DiamondLoupeFacet__factory,
    DiamondLoupeFacet,
    AccessControlFacet__factory,
    AccessControlFacet,
    ISBEPauseFacet__factory,
    ISBEPauseFacet,
    AccessControl,
    ISBEPause,
} from '../typechain-types'
import {
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    DEFAULT_ADMIN_ROLE,
    PAUSER_ROLE,
} from './constants'

describe('ERC20', function () {
    const decimals = 2
    const name = 'ISBE stable token'
    const symbol = 'isbe'

    let EIP2535AccessControlFactory: EIP2535AccessControl__factory
    let DiamondCutAccessControlFacetFactory: DiamondCutAccessControlFacet__factory
    let DiamondLoupeFacetFactory: DiamondLoupeFacet__factory
    let AccessControlFacetFactory: AccessControlFacet__factory
    let ISBEPauseFacetFactory: ISBEPauseFacet__factory
    let ERC20TestWrapperFactory: ERC20TestWrapper__factory

    let diamondCutFacet: DiamondCutAccessControlFacet
    let diamondLoupeFacet: DiamondLoupeFacet
    let accessControlFacet: AccessControlFacet
    let pauseFacet: ISBEPauseFacet
    let erc20Facet: ERC20TestWrapper

    let diamondProxy: EIP2535AccessControl

    let facetAddresses: string[]

    let erc20: ERC20TestWrapper
    let pause: ISBEPause
    let accessControl: AccessControl

    let owner: Signer
    let ownerAddress: string
    let otherAccount: Signer
    let otherAccountAddress: string

    async function deploy(initialize: boolean = false) {
        ;[owner, otherAccount] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()

        EIP2535AccessControlFactory = await ethers.getContractFactory(
            'EIP2535AccessControl'
        )
        DiamondCutAccessControlFacetFactory = await ethers.getContractFactory(
            'DiamondCutAccessControlFacet'
        )
        DiamondLoupeFacetFactory =
            await ethers.getContractFactory('DiamondLoupeFacet')

        AccessControlFacetFactory =
            await ethers.getContractFactory('AccessControlFacet')
        ISBEPauseFacetFactory =
            await ethers.getContractFactory('ISBEPauseFacet')
        ERC20TestWrapperFactory =
            await ethers.getContractFactory('ERC20TestWrapper')

        diamondCutFacet = await DiamondCutAccessControlFacetFactory.deploy()
        diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy()
        accessControlFacet = await AccessControlFacetFactory.deploy()
        pauseFacet = await ISBEPauseFacetFactory.deploy()
        erc20Facet = await ERC20TestWrapperFactory.deploy()

        await diamondCutFacet.waitForDeployment()
        await diamondLoupeFacet.waitForDeployment()
        await accessControlFacet.waitForDeployment()
        await pauseFacet.waitForDeployment()
        await erc20Facet.waitForDeployment()

        facetAddresses = [
            await diamondCutFacet.getAddress(),
            await diamondLoupeFacet.getAddress(),
            await accessControlFacet.getAddress(),
            await pauseFacet.getAddress(),
            await erc20Facet.getAddress(),
        ]

        diamondProxy = await EIP2535AccessControlFactory.deploy(
            facetAddresses,
            {
                rbacs: [
                    {
                        role: DEFAULT_ADMIN_ROLE,
                        members: [owner],
                    },
                    {
                        role: PAUSER_ROLE,
                        members: [owner],
                    },
                ],
                init: ethers.ZeroAddress,
                initCalldata: '0x',
            }
        )
        await diamondProxy.waitForDeployment()

        erc20 = ERC20TestWrapperFactory.attach(
            await diamondProxy.getAddress()
        ) as ERC20TestWrapper

        pause = ISBEPauseFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as ISBEPause

        accessControl = AccessControlFacetFactory.attach(
            await diamondProxy.getAddress()
        ) as AccessControl

        if (initialize) {
            await erc20.initializeErc20(name, symbol, decimals)
            await erc20.initializeCap(1000)
        }
    }

    describe('Deployment', () => {
        it('GIVEN an ERC20 WHEN it is deployed THEN the business logic is not possible to be initialized', async () => {
            await deploy()

            await expect(erc20Facet.initializeErc20(name, symbol, decimals))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
                )
        })

        it('GIVEN an ERC20 WHEN it is deployed THEN name, symbol and decimals can be retrieved', async () => {
            await deploy()
            await expect(erc20.initializeErc20(name, symbol, decimals))
                .to.emit(erc20, 'Erc20Initialized')
                .withArgs(name, symbol, decimals)

            expect(await erc20.decimals()).to.equal(decimals)
            expect(await erc20.name()).to.equal(name)
            expect(await erc20.symbol()).to.equal(symbol)

            expect(await erc20.totalSupply()).to.equal(0)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.allowance(ownerAddress, ownerAddress)).to.equal(
                0
            )
        })

        it('GIVEN a initialized ERC20 WHEN it try to initialize twice THEN it fails', async () => {
            await deploy(true)
            await expect(erc20.initializeErc20(name, symbol, decimals))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
                )
        })
    })

    describe('Allowance', () => {
        it('GIVEN an initialized ERC20 WHEN approve to zero address THEN fails', async () => {
            await deploy(true)
            await expect(
                erc20.approve(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN approve on a paused THEN fails', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(
                erc20.approve(ownerAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN increase Allowance on a paused THEN fails', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(
                erc20.increaseAllowance(ownerAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN decrease Allowance on a paused THEN fails', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(
                erc20.decreaseAllowance(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN an allowance can be set', async () => {
            await deploy(true)
            await expect(erc20.approve(otherAccountAddress, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can increase allowance', async () => {
            await deploy(true)
            await expect(erc20.increaseAllowance(otherAccountAddress, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN can decrease allowance', async () => {
            await deploy(true)
            await erc20.approve(otherAccountAddress, 200)
            await expect(erc20.decreaseAllowance(otherAccountAddress, 100))
                .to.emit(erc20, 'Approval')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.equal(0)
            expect(await erc20.totalSupply()).to.equal(0)
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN cannot decrease allowance to less than 0', async () => {
            await deploy()
            expect(owner).not.to.be.undefined
            await erc20.approve(otherAccountAddress, 100)
            await expect(
                erc20.decreaseAllowance(otherAccountAddress, 101)
            ).to.be.revertedWithCustomError(
                erc20,
                'DecreasedAllowanceBellowZero'
            )
        })
    })

    describe('Cap', () => {
        it('GIVEN an ERC20 WHEN initializeCap with Zero THEN it fails', async () => {
            await deploy()
            await expect(erc20.initializeCap(0)).to.be.revertedWithCustomError(
                erc20,
                'CapIsZero'
            )
        })

        it('GIVEN an ERC20 WHEN cap is initialized THEN it can be retrieved', async () => {
            await deploy()
            await expect(erc20.initializeCap(1000))
                .to.emit(erc20, 'CapSet')
                .withArgs(ownerAddress, 1000)
            await expect(erc20.initializeCap(1))
                .to.be.revertedWithCustomError(
                    erc20,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b'
                )

            expect(await erc20.cap()).to.equal(1000)
        })

        it('GIVEN an initialized ERC20 WHEN mint over cap THEN it fails', async () => {
            await deploy(true)
            expect(await erc20.cap()).to.equal(1000)
            await expect(
                erc20.mint(ownerAddress, 1001)
            ).revertedWithCustomError(erc20, 'CapExceeded')
        })

        it('GIVEN an initialized ERC20 WHEN setting cap below total supply THEN it fails', async () => {
            await deploy(true)
            const totalSupply = 10

            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc20.mint(ownerAddress, totalSupply)

            const newCap = totalSupply - 1

            await expect(erc20.setCap(newCap))
                .revertedWithCustomError(erc20, 'NewCapIsLessThanTotalSupply')
                .withArgs(newCap, totalSupply)
        })

        it('GIVEN an initialized ERC20 WHEN setting cap on a paused token THEN it fails', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(erc20.setCap(1000000)).revertedWithCustomError(
                erc20,
                'IsPaused'
            )
        })

        it('GIVEN an initialized ERC20 WHEN non capper setting cap THEN it fails', async () => {
            await deploy(true)

            await expect(erc20.setCap(1)).to.be.revertedWithCustomError(
                erc20,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an initialized ERC20 WHEN setting cap over total supply THEN it succeeds', async () => {
            await deploy(true)
            const totalSupply = 10

            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc20.mint(ownerAddress, totalSupply)

            const newCap = totalSupply + 1

            await expect(erc20.setCap(newCap))
                .to.emit(erc20, 'CapSet')
                .withArgs(ownerAddress, newCap)
        })
    })

    describe('Mint', () => {
        it('GIVEN an initialized ERC20 WHEN mint to zero address THEN fails', async () => {
            await deploy(true)

            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(
                erc20.mint(ethers.ZeroAddress, 100)
            ).to.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an initialized ERC20 WHEN mint a paused token THEN fails', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(
                erc20.mint(ownerAddress, 100)
            ).to.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an initialized ERC20 WHEN non MINTER mints THEN it fails', async () => {
            await deploy(true)

            await expect(erc20.mint(ownerAddress, 0)).revertedWithCustomError(
                erc20,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an ERC20 WHEN it is initialized THEN mint can be made', async () => {
            await deploy(true)

            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(erc20.mint(ownerAddress, 100))
                .to.emit(erc20, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 100)
        })
    })

    describe('Burn', () => {
        const prepare = async () => {
            await deploy(true)

            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await erc20.mint(ownerAddress, 100)
        }

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            await deploy(true)
            await expect(erc20.burn(100)).to.be.revertedWithCustomError(
                erc20,
                'BurnAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to burn a paused token THEN it fails', async () => {
            await deploy(true)
            await pause.initializePause(true)

            await expect(erc20.burn(0)).to.be.revertedWithCustomError(
                erc20,
                'IsPaused'
            )
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            await prepare()
            await expect(erc20.burn(100))
                .to.emit(erc20, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 100)

            expect(await erc20.totalSupply()).to.be.equal(0)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
        })
    })

    describe('BurnFrom', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc20.mint(otherAccountAddress, 50)
            await erc20.connect(otherAccount).approve(ownerAddress, 100)
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            await deploy(true)
            await expect(
                erc20.burnFrom(ethers.ZeroAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to burn without enough balance THEN it fails', async () => {
            await prepare()
            await expect(
                erc20.burnFrom(otherAccountAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'BurnAmountExceedsBalance')
        })

        it('GIVEN an ERC20 initialized WHEN try to burn a paused token THEN it fails', async () => {
            await prepare()

            await pause.initializePause(true)

            await expect(
                erc20.burnFrom(otherAccountAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a burn can be made', async () => {
            await prepare()
            await expect(erc20.burnFrom(otherAccountAddress, 25))
                .to.emit(erc20, 'Transfer')
                .withArgs(otherAccountAddress, ethers.ZeroAddress, 25)
                .to.emit(erc20, 'Approval')
                .withArgs(otherAccountAddress, ownerAddress, 75)

            expect(await erc20.totalSupply()).to.be.equal(25)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(25)
            expect(
                await erc20.allowance(otherAccountAddress, ownerAddress)
            ).to.be.equal(75)
        })
    })

    describe('Transfer', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc20.mint(ownerAddress, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            await deploy(true)
            await expect(
                erc20.transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough balance THEN it fails', async () => {
            await deploy(true)
            await expect(
                erc20.transfer(ownerAddress, 100)
            ).to.be.revertedWithCustomError(
                erc20,
                'TransferAmountExceedsBalance'
            )
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer from a paused token THEN it fails', async () => {
            await deploy(true)
            await pause.initializePause(true)

            await expect(
                erc20.transfer(ownerAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            await prepare()
            await expect(erc20.transfer(otherAccountAddress, 100))
                .to.emit(erc20, 'Transfer')
                .withArgs(ownerAddress, otherAccountAddress, 100)

            expect(await erc20.totalSupply()).to.be.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(100)
            expect(
                await erc20.allowance(ownerAddress, otherAccountAddress)
            ).to.be.equal(0)
        })
    })

    describe('TransferFrom', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc20.mint(ownerAddress, 100)
            await erc20.mint(otherAccountAddress, 100)
            await erc20.connect(otherAccount).approve(ownerAddress, 100)
        }

        it('GIVEN an ERC20 initialized WHEN try to use address(0) THEN it fails', async () => {
            await prepare()
            await expect(
                erc20.transferFrom(ethers.ZeroAddress, otherAccountAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
            await expect(
                erc20.transferFrom(ownerAddress, ethers.ZeroAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer without enough allowance THEN it fails', async () => {
            await prepare()
            await expect(
                erc20.transferFrom(otherAccountAddress, ownerAddress, 101)
            ).to.be.revertedWithCustomError(erc20, 'InsufficientAllowance')
        })

        it('GIVEN an ERC20 initialized WHEN try to transfer from a paused token THEN it fails', async () => {
            await prepare()
            await pause.initializePause(true)

            await expect(
                erc20.transferFrom(otherAccountAddress, ownerAddress, 0)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a transfer can be made', async () => {
            await prepare()
            await expect(
                erc20.transferFrom(otherAccountAddress, ownerAddress, 100)
            )
                .to.emit(erc20, 'Transfer')
                .withArgs(otherAccountAddress, ownerAddress, 100)
                .to.emit(erc20, 'Approval')
                .withArgs(otherAccountAddress, ownerAddress, 0)

            expect(await erc20.totalSupply()).to.be.equal(200)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(200)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
            expect(
                await erc20.allowance(otherAccountAddress, ownerAddress)
            ).to.be.equal(0)
        })

        it(
            'GIVEN an ERC20 ' +
                'WHEN transferFrom with max(uint256) to allowance ' +
                'THEN a transfer can be made',
            async () => {
                await prepare()
                await erc20
                    .connect(otherAccount)
                    .approve(ownerAddress, ethers.MaxUint256)
                await expect(
                    erc20.transferFrom(otherAccountAddress, ownerAddress, 100)
                )
                    .to.emit(erc20, 'Transfer')
                    .withArgs(otherAccountAddress, ownerAddress, 100)

                expect(await erc20.totalSupply()).to.be.equal(200)
                expect(await erc20.balanceOf(ownerAddress)).to.be.equal(200)
                expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(
                    0
                )
                expect(
                    await erc20.allowance(otherAccountAddress, ownerAddress)
                ).to.be.equal(ethers.MaxUint256)
            }
        )
    })

    describe('Snapshot', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc20.mint(ownerAddress, 100)
            return { erc20, owner, otherAccount }
        }

        it('GIVEN an ERC20 WHEN not exists snapshot THEN balanceOfAt and totalSupplyAt fails', async () => {
            await prepare()
            await expect(
                erc20.balanceOfAt(ownerAddress, 0)
            ).to.revertedWithCustomError(erc20, 'SnapshotWithIdZero')
            await expect(erc20.totalSupplyAt(0)).to.revertedWithCustomError(
                erc20,
                'SnapshotWithIdZero'
            )
            await expect(
                erc20.balanceOfAt(ownerAddress, 1)
            ).to.revertedWithCustomError(erc20, 'NonExistentSnapshotId')
            await expect(erc20.totalSupplyAt(1)).to.revertedWithCustomError(
                erc20,
                'NonExistentSnapshotId'
            )
        })

        it('GIVEN an ERC20 WHEN taking a snapshot of a paused token THEN fails', async () => {
            await prepare()

            await pause.initializePause(true)

            await expect(erc20.snapshot()).to.be.revertedWithCustomError(
                erc20,
                'IsPaused'
            )
        })

        it('GIVEN an ERC20 WHEN non snapshoter takes a snapshot THEN fails', async () => {
            // eslint-disable-next-line prefer-const
            await prepare()

            erc20 = erc20.connect(otherAccount)

            await expect(erc20.snapshot()).to.be.revertedWithCustomError(
                erc20,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a snapshot can be made', async () => {
            await prepare()
            await accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)

            await expect(erc20.snapshot())
                .to.emit(erc20, 'Snapshot')
                .withArgs(1)
            expect(await erc20.balanceOfAt(ownerAddress, 1)).to.be.equal(100)
            expect(await erc20.balanceOfAt(otherAccountAddress, 1)).to.be.equal(
                0
            )
            expect(await erc20.totalSupplyAt(1)).to.be.equal(100)
            await erc20.transfer(otherAccountAddress, 25)
            await erc20.mint(otherAccountAddress, 25)
            expect(await erc20.balanceOfAt(ownerAddress, 1)).to.be.equal(100)
            expect(await erc20.balanceOfAt(otherAccountAddress, 1)).to.be.equal(
                0
            )
            expect(await erc20.totalSupplyAt(1)).to.be.equal(100)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(75)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(50)
            expect(await erc20.totalSupply()).to.be.equal(125)
        })
    })

    describe('Controller', () => {
        const MINTED = 100

        const prepare = async () => {
            await deploy(true)

            await accessControl.initializeAccessControl(ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

            await erc20.mint(otherAccountAddress, MINTED)
        }

        it('GIVEN an ERC20 initialized WHEN try to force burn a paused token THEN it fails', async () => {
            await prepare()
            await pause.initializePause(true)

            await expect(
                erc20.forceBurn(otherAccountAddress, MINTED - 1)
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force burn THEN it fails', async () => {
            // eslint-disable-next-line prefer-const
            await prepare()

            erc20 = erc20.connect(otherAccount)

            await expect(
                erc20.forceBurn(otherAccountAddress, MINTED - 1)
            ).to.be.revertedWithCustomError(erc20, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN forceBurn from zero address THEN it fails', async () => {
            await prepare()
            await expect(
                erc20.forceBurn(ethers.ZeroAddress, MINTED)
            ).revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force burn can be made', async () => {
            await prepare()
            await expect(erc20.forceBurn(otherAccountAddress, MINTED))
                .to.emit(erc20, 'ForceBurn')
                .withArgs(ownerAddress, otherAccountAddress, MINTED)

            expect(await erc20.totalSupply()).to.be.equal(0)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
        })

        it('GIVEN an ERC20 initialized WHEN try to force transfer a paused token THEN it fails', async () => {
            await prepare()
            await pause.initializePause(true)

            await expect(
                erc20.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(erc20, 'IsPaused')
        })

        it('GIVEN an ERC20 initialized WHEN non controller tries to force transfer THEN it fails', async () => {
            // eslint-disable-next-line prefer-const
            await prepare()

            erc20 = erc20.connect(otherAccount)

            await expect(
                erc20.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED - 1
                )
            ).to.be.revertedWithCustomError(erc20, 'AccountHasNoRole')
        })

        it('GIVEN an ERC20 WHEN forceTransfer from zero address THEN fails', async () => {
            await prepare()
            await expect(
                erc20.forceTransfer(ethers.ZeroAddress, ownerAddress, MINTED)
            ).revertedWithCustomError(erc20, 'AddressZero')
        })

        it('GIVEN an ERC20 WHEN it is prepared THEN a force transfer can be made', async () => {
            await prepare()
            await expect(
                erc20.forceTransfer(otherAccountAddress, ownerAddress, MINTED)
            )
                .to.emit(erc20, 'ForceTransfer')
                .withArgs(
                    ownerAddress,
                    otherAccountAddress,
                    ownerAddress,
                    MINTED
                )

            expect(await erc20.totalSupply()).to.be.equal(MINTED)
            expect(await erc20.balanceOf(otherAccountAddress)).to.be.equal(0)
            expect(await erc20.balanceOf(ownerAddress)).to.be.equal(MINTED)
        })
    })
})
