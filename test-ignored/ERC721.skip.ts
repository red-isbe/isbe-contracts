/* eslint-disable */
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import {
    AccessControl,
    ISBEPause,
    ERC721,
    ERC721Burnable,
    ERC721Snapshot,
    ERC721Capped,
    ERC721Controller,
    Ownable2Step,
    Ownable,
    AssetEventTrackerTestWrapper,
    HashTimestampTestWrapper,
    IERC721Snapshot,
} from '../typechain-types'
import {
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    ERC721_RESOLVER_KEY,
    DEFAULT_ADMIN_ROLE,
    PAUSER_ROLE,
} from './constants'
import { deployAll } from './initialization'

describe('ERC721', function () {
    const name = 'ISBE NFT'
    const symbol = 'ISBENFT'
    const cap = 3

    let erc721Facet: ERC721
    let erc721: ERC721
    let erc721Snapshot: ERC721Snapshot
    let erc721Burnable: ERC721Burnable
    let erc721Capped: ERC721Capped
    let erc721Controller: ERC721Controller
    let pause: ISBEPause
    let accessControl: AccessControl
    let ownable2Step: Ownable2Step
    let ownable: Ownable
    let assetEventTracker: AssetEventTrackerTestWrapper
    let hashTimestamp: HashTimestampTestWrapper

    let owner: Signer
    let ownerAddress: string
    let otherAccount: Signer
    let otherAccountAddress: string

    async function deploy(initialize: boolean = false) {
        ;[owner, otherAccount] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAccountAddress = await otherAccount.getAddress()

        const result = await deployAll()
        erc721 = result.erc721
        erc721Snapshot = result.erc721Snapshot
        erc721Burnable = result.erc721Burnable
        erc721Capped = result.erc721Capped
        erc721Controller = result.erc721Controller
        pause = result.pause721
        accessControl = result.accessControl721
        erc721Facet = result.erc721Facet
        ownable2Step = result.ownable2Step721
        ownable = result.ownable721
        assetEventTracker = result.assetEventTracker721
        hashTimestamp = result.hashTimestamp721

        if (initialize) {
            await erc721.initializeErc721(name, symbol)
            await erc721Capped.initializeCap(cap)
        }
        expect(await result.erc721Facet.businessIdIntrospection()).to.equal(
            ERC721_RESOLVER_KEY
        )
    }

    describe('Deployment', () => {
        it('should not allow double initialization', async () => {
            await deploy()
            await expect(
                erc721Facet.initializeErc721(name, symbol)
            ).to.be.revertedWithCustomError(
                erc721,
                'ContractIsAlreadyInitialized'
            )
        })

        it('should initialize and return correct name/symbol', async () => {
            await deploy()
            await expect(erc721.initializeErc721(name, symbol))
                .to.emit(erc721, 'Erc721Initialized')
                .withArgs(name, symbol)
            expect(await erc721.name()).to.equal(name)
            expect(await erc721.symbol()).to.equal(symbol)
        })
    })

    describe('Cap', () => {
        it('should revert if cap is zero', async () => {
            await deploy()
            await expect(
                erc721Capped.initializeCap(0)
            ).to.be.revertedWithCustomError(erc721Capped, 'CapIsZero')
        })

        it('should set and get cap', async () => {
            await deploy()
            await expect(erc721Capped.initializeCap(cap))
                .to.emit(erc721Capped, 'CapSet')
                .withArgs(ownerAddress, cap)
            await expect(erc721Capped.initializeCap(1))
                .to.be.revertedWithCustomError(
                    erc721,
                    'ContractIsAlreadyInitialized'
                )
                .withArgs(
                    '0x562609faca97c2599c7b5267f4c9852db8d80261577ecea4c9660ff46f48ac8c'
                )
            expect(await erc721Capped.cap()).to.equal(cap)
        })

        it('should not allow mint above cap', async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            expect(await erc721Capped.cap()).to.equal(3)

            // Mint up to the cap
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(ownerAddress, 3)

            // Attempt to mint one more than the cap
            await expect(
                erc721Capped.mint(ownerAddress, 4)
            ).to.be.revertedWithCustomError(erc721Capped, 'CapExceeded')
        })

        it('should not allow cap below totalSupply', async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)
            // Mint some tokens to increase the total supply
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)

            // Attempt to set the cap below the total supply
            await expect(erc721Capped.setCap(1))
                .to.be.revertedWithCustomError(
                    erc721Capped,
                    'NewCapIsLessThanTotalSupply'
                )
                .withArgs(1, 2)
        })

        it('should not allow set cap on a paused token', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(erc721Capped.setCap(2)).to.be.revertedWithCustomError(
                pause,
                'IsPaused'
            )
        })

        it('should not allow non-capper to set cap', async () => {
            await deploy(true)
            await expect(erc721Capped.setCap(1)).to.be.revertedWithCustomError(
                accessControl,
                'AccountHasNoRole'
            )
        })

        it('should allow increasing cap', async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await expect(erc721Capped.setCap(3))
                .to.emit(erc721Capped, 'CapSet')
                .withArgs(ownerAddress, 3)
        })
    })

    describe('Mint', () => {
        it('should revert mint to zero address', async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await expect(
                erc721Capped.mint(ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('should revert if paused', async () => {
            await deploy(true)

            await pause.initializePause(true)

            await expect(
                erc721Capped.mint(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })

        it('should revert mint if not minter', async () => {
            await deploy(true)
            await expect(
                erc721Capped.mint(ownerAddress, 1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('should mint and emit Transfer', async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await expect(erc721Capped.mint(ownerAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 1)
        })
    })

    describe('Burn', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
        }

        it('should revert burn if not owner nor approved', async () => {
            await prepare()
            await expect(
                erc721Burnable.connect(otherAccount).burn(1)
            ).to.be.revertedWithCustomError(
                erc721Burnable,
                'NotOwnerNorApproved'
            )
        })

        it('should revert burn if paused', async () => {
            await prepare()
            await pause.initializePause(true)
            await expect(erc721Burnable.burn(1)).to.be.revertedWithCustomError(
                pause,
                'IsPaused'
            )
        })

        it('should allow owner to burn', async () => {
            await prepare()
            await expect(erc721Burnable.burn(1))
                .to.emit(erc721Burnable, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
        })
    })

    describe('BurnFrom', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
        }

        it('should revert burnFrom if paused', async () => {
            await prepare()
            await erc721.approve(otherAccountAddress, 1)
            await pause.initializePause(true)
            await expect(
                erc721Burnable.connect(otherAccount).burnFrom(ownerAddress, 1)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('should revert burnFrom if not owner nor approved', async () => {
            await prepare()
            await expect(
                erc721Burnable.connect(otherAccount).burnFrom(ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Burnable,
                'NotOwnerNorApproved'
            )
        })

        it('should allow approved to burnFrom', async () => {
            await prepare()
            await erc721.approve(otherAccountAddress, 1)
            await expect(
                erc721Burnable.connect(otherAccount).burnFrom(ownerAddress, 1)
            )
                .to.emit(erc721Burnable, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
        })
    })

    describe('Transfer', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
        }

        it('should revert transfer to zero address', async () => {
            await prepare()
            await expect(
                erc721.transferFrom(ownerAddress, ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('should revert transfer if not minted', async () => {
            await prepare()
            await expect(
                erc721.transferFrom(ownerAddress, otherAccountAddress, 2)
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferFromIncorrectOwner'
            )
        })

        it('should revert transfer if not owner nor approved', async () => {
            await prepare()
            await expect(
                erc721
                    .connect(otherAccount)
                    .transferFrom(ownerAddress, otherAccountAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('should revert transfer if paused', async () => {
            await prepare()
            await pause.initializePause(true)
            await expect(
                erc721.transferFrom(ownerAddress, otherAccountAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })

        it('should transfer with approval', async () => {
            await prepare()
            await erc721.approve(otherAccountAddress, 1)
            await expect(
                erc721
                    .connect(otherAccount)
                    .transferFrom(ownerAddress, otherAccountAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAccountAddress, 1)
            expect(await erc721.balanceOf(otherAccountAddress)).to.be.equal(1)
            expect(await erc721.ownerOf(1)).to.be.equal(otherAccountAddress)
        })

        it('should set and check approval for all', async () => {
            await prepare()
            await erc721.setApprovalForAll(otherAccountAddress, true)
            expect(
                await erc721.isApprovedForAll(ownerAddress, otherAccountAddress)
            ).to.equal(true)
        })
    })

    describe('Snapshot', () => {
        const prepare = async () => {
            await deploy(true)
            await accessControl.initializeAccessControl([
                { role: DEFAULT_ADMIN_ROLE, members: [ownerAddress] },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
        }

        it('should revert on invalid snapshotId', async () => {
            await prepare()
            await expect(
                erc721Snapshot.balanceOfAt(ownerAddress, 0)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'SnapshotWithIdZero'
            )
            await expect(
                erc721Snapshot.totalSupplyAt(0)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'SnapshotWithIdZero'
            )
            await expect(
                erc721Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'NonExistentSnapshotId'
            )
            await expect(
                erc721Snapshot.totalSupplyAt(1)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'NonExistentSnapshotId'
            )
            await expect(
                erc721Snapshot.ownerOfAt(1, 0)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'SnapshotWithIdZero'
            )
            await expect(
                erc721Snapshot.ownerOfAt(1, 1)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'NonExistentSnapshotId'
            )
        })

        it('should not allow snapshot when paused', async () => {
            await prepare()
            await accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)
            await pause.initializePause(true)

            await expect(
                erc721Snapshot.snapshot()
            ).to.be.revertedWithCustomError(erc721Snapshot, 'IsPaused')
        })

        it('should only allow snapshot by SNAPSHOT_ROLE', async () => {
            await prepare()
            await expect(
                erc721Snapshot.snapshot()
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('should allow a snapshot to be made when the ERC721 is prepared', async () => {
            await prepare()
            await accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)

            await expect(erc721Snapshot.snapshot())
                .to.emit(erc721Snapshot, 'Snapshot')
                .withArgs(1)
            expect(
                await erc721Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.equal(1)
            expect(
                await erc721Snapshot.balanceOfAt(otherAccountAddress, 1)
            ).to.be.equal(0)
            expect(await erc721Snapshot.totalSupplyAt(1)).to.be.equal(1)
            if (erc721Snapshot.ownerOfAt) {
                expect(await erc721Snapshot.ownerOfAt(1, 1)).to.equal(
                    ownerAddress
                )
            }
            await erc721.transferFrom(ownerAddress, otherAccountAddress, 1)
            await erc721Capped.mint(otherAccountAddress, 2)
            expect(
                await erc721Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.equal(1)
            expect(
                await erc721Snapshot.balanceOfAt(otherAccountAddress, 1)
            ).to.be.equal(0)
            expect(await erc721Snapshot.totalSupplyAt(1)).to.be.equal(1)
            expect(await erc721.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc721.balanceOf(otherAccountAddress)).to.be.equal(2)
            expect(await erc721.totalSupply()).to.be.equal(2)
            if (erc721Snapshot.ownerOfAt) {
                expect(await erc721Snapshot.ownerOfAt(1, 1)).to.equal(
                    ownerAddress
                )
            }
        })
    })

    describe('Controller', () => {
        const MINTED_TOKEN_ID = 1

        const prepare = async () => {
            await deploy(true)

            await accessControl.initializeAccessControl([
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [ownerAddress],
                },
            ])
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

            await erc721Capped.mint(otherAccountAddress, MINTED_TOKEN_ID)
        }

        it('should revert forceBurn if paused', async () => {
            await prepare()
            await pause.initializePause(true)

            await expect(
                erc721Controller.forceBurn(otherAccountAddress, MINTED_TOKEN_ID)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })

        it('should revert forceBurn if not controller', async () => {
            await prepare()

            erc721Controller = erc721Controller.connect(otherAccount)

            await expect(
                erc721Controller.forceBurn(otherAccountAddress, MINTED_TOKEN_ID)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('should revert forceBurn if not token owner', async () => {
            await prepare()
            await expect(
                erc721Controller.forceBurn(ownerAddress, MINTED_TOKEN_ID)
            ).to.be.revertedWithCustomError(
                erc721Controller,
                'ForceBurnNotTokenOwner'
            )
        })

        it('should allow forceBurn', async () => {
            await prepare()
            await expect(
                erc721Controller.forceBurn(otherAccountAddress, MINTED_TOKEN_ID)
            )
                .to.emit(erc721Controller, 'ForceBurn')
                .withArgs(ownerAddress, otherAccountAddress, MINTED_TOKEN_ID)

            expect(await erc721.balanceOf(otherAccountAddress)).to.be.equal(0)
            expect(await erc721.ownerOf(MINTED_TOKEN_ID)).to.be.equal(
                ZeroAddress
            )
        })

        it('should revert forceTransfer if paused', async () => {
            await prepare()
            await pause.initializePause(true)

            await expect(
                erc721Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED_TOKEN_ID
                )
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })

        it('should revert forceTransfer if not controller', async () => {
            await prepare()

            erc721Controller = erc721Controller.connect(otherAccount)

            await expect(
                erc721Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED_TOKEN_ID
                )
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('should revert forceTransfer to zero address', async () => {
            await prepare()
            await expect(
                erc721Controller.forceTransfer(
                    otherAccountAddress,
                    ethers.ZeroAddress,
                    MINTED_TOKEN_ID
                )
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('should allow forceTransfer', async () => {
            await prepare()
            await expect(
                erc721Controller.forceTransfer(
                    otherAccountAddress,
                    ownerAddress,
                    MINTED_TOKEN_ID
                )
            )
                .to.emit(erc721Controller, 'ForceTransfer')
                .withArgs(
                    ownerAddress,
                    otherAccountAddress,
                    ownerAddress,
                    MINTED_TOKEN_ID
                )

            expect(await erc721.balanceOf(otherAccountAddress)).to.be.equal(0)
            expect(await erc721.balanceOf(ownerAddress)).to.be.equal(1)
            expect(await erc721.ownerOf(MINTED_TOKEN_ID)).to.be.equal(
                ownerAddress
            )
        })
    })
})
