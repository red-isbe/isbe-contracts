import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, ZeroAddress } from 'ethers'
import {
    ERC721Capped,
    ERC721TestWrapper,
    AccessControl,
    ERC721,
    ISBEPause,
    ERC721Snapshot,
    ERC721Burnable,
    ERC721Controller,
    ERC721Enumerable,
    ERC721Royalty,
    ERC721Consecutive,
} from '../typechain-types'
import { CONFIGURATION_ID_ERC721, deployGovernance } from './initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import {
    CAP_ROLE,
    MINTER_ROLE,
    PAUSER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
    ROYALTY_ROLE,
} from './constants'

describe('ERC721', function () {
    const name = 'ISBE NFT'
    const symbol = 'ISBENFT'

    let erc721: ERC721
    let erc721TestWrapper: ERC721TestWrapper
    let erc721Capped: ERC721Capped
    let erc721Snapshot: ERC721Snapshot
    let erc721Burn: ERC721Burnable
    let erc721Controller: ERC721Controller
    let erc721Enumerable: ERC721Enumerable
    let erc721Royalty: ERC721Royalty
    let erc721Consecutive: ERC721Consecutive
    let erc20Address: string
    let owner: Signer
    let ownerAddress: string
    let other: Signer
    let otherAddress: string
    let third: Signer
    let thirdAddress: string
    let accessControl: AccessControl
    let pause: ISBEPause

    async function deploy(initialize = false) {
        ;[owner, other, third] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAddress = await other.getAddress()
        thirdAddress = await third.getAddress()

        const result = await deployGovernance(
            owner,
            undefined,
            CONFIGURATION_ID_ERC721
        )
        erc721 = result.erc721
        erc721TestWrapper = result.erc721TestWrapper
        erc721Capped = result.erc721Capped
        erc721Snapshot = result.erc721Snapshot
        erc721Burn = result.erc721Burn
        erc721Controller = result.erc721Controller
        erc721Enumerable = result.erc721Enumerable
        erc721Royalty = result.erc721Royalty
        erc721Consecutive = result.erc721Consecutive
        erc20Address = await result.erc721Facet.getAddress()
        accessControl = result.accessControl
        pause = result.pause

        if (initialize) {
            await erc721.initializeErc721(name, symbol)
            await erc721Capped.initializeCap(3)
        }

        return {
            erc721,
            erc721TestWrapper,
            erc721Capped,
            erc721Snapshot,
            erc721Burn,
            erc721Controller,
            erc721Enumerable,
            erc721Royalty,
            erc721Consecutive,
            erc20Address,
            owner,
            ownerAddress,
            other,
            otherAddress,
            third,
            thirdAddress,
            accessControl,
            pause,
        }
    }

    const fixtureInitialized = async () => {
        return await deploy(true)
    }

    const fixtureUninitialized = async () => {
        return await deploy(false)
    }

    describe('Deployment', () => {
        it('GIVEN an ERC721 WHEN deployed THEN cannot initialize twice', async () => {
            const { erc721, erc721TestWrapper } =
                await loadFixture(fixtureInitialized)
            await expect(
                erc721.initializeErc721(name, symbol)
            ).to.be.revertedWithCustomError(
                erc721TestWrapper,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN an ERC721 WHEN deployed THEN name and symbol are correct', async () => {
            const { erc721 } = await loadFixture(fixtureUninitialized)
            await erc721.initializeErc721(name, symbol)
            expect(await erc721.name()).to.equal(name)
            expect(await erc721.symbol()).to.equal(symbol)
        })
    })

    describe('Mint', () => {
        it('GIVEN an ERC721 WHEN mint with tokenId 0 THEN reverts', async () => {
            const { erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await expect(
                erc721Capped.mint(ownerAddress, 0)
            ).to.be.revertedWithCustomError(accessControl, 'EmptyUint')
        })

        it('GIVEN an ERC721 WHEN mint to zero address THEN fails', async () => {
            const { erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await expect(
                erc721Capped.mint(ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721TestWrapper, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN mint a new token THEN succeeds', async () => {
            const { erc721Capped, erc721, ownerAddress, accessControl } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await expect(erc721Capped.mint(ownerAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 1)
            expect((await erc721.ownerOf(1)).toString()).to.equal(
                ownerAddress.toString()
            )
            expect(Number(await erc721.balanceOf(ownerAddress))).to.equal(1)
        })

        it('GIVEN an ERC721 WHEN mint an already minted token THEN fails', async () => {
            const { erc721Capped, accessControl, ownerAddress, erc721 } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await expect(
                erc721Capped.mint(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'TokenAlreadyMinted')
        })
    })

    describe('Burn', () => {
        it('GIVEN an ERC721 WHEN burn a token THEN totalSupply decreases and ownerOf is ZeroAddress', async () => {
            const {
                erc721Capped,
                erc721,
                erc721Burn,
                ownerAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(erc721Burn.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
            expect((await erc721.ownerOf(1)).toString()).to.be.equal(
                ZeroAddress.toString()
            )
        })

        it('GIVEN an ERC721 WHEN owner approves another, burns token, THEN approved address is reset to zero', async () => {
            const {
                erc721Capped,
                erc721,
                erc721Burn,
                ownerAddress,
                otherAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect((await erc721.getApproved(1)).toString()).to.equal(
                otherAddress.toString()
            )

            await expect(erc721Burn.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)

            expect((await erc721.getApproved(1)).toString()).to.equal(
                ethers.ZeroAddress.toString()
            )
        })

        it('GIVEN an ERC721 WHEN paused THEN burn reverts', async () => {
            const { erc721Burn, pause, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await pause.pause()
            await expect(erc721Burn.burn(1)).to.be.revertedWithCustomError(
                erc721Burn,
                'IsPaused'
            )
        })

        it('GIVEN an ERC721 WHEN burn is called by not owner nor approved nor operator THEN reverts with CallerNotOwnerNorApproved', async () => {
            const {
                erc721Capped,
                erc721Burn,
                ownerAddress,
                other,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            // Mint token to owner
            await erc721Capped.mint(ownerAddress, 2)
            // Try to burn from another account (not owner, not approved, not operator)
            await expect(
                erc721Burn.connect(other).burn(2)
            ).to.be.revertedWithCustomError(
                erc721Burn,
                'CallerNotOwnerNorApproved'
            )
        })
    })

    describe('BurnFrom', () => {
        it('GIVEN an ERC721 WHEN burnFrom as owner THEN succeeds', async () => {
            const {
                erc721Capped,
                erc721,
                erc721Burn,
                ownerAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721.approve(erc721Burn, 1)
            await expect(erc721Burn.burnFrom(ownerAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(ZeroAddress)
        })

        it('GIVEN an ERC721 WHEN burnFrom as not approved nor owner THEN reverts', async () => {
            const {
                erc721Capped,
                erc721Burn,
                ownerAddress,
                other,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await expect(
                erc721Burn.connect(other).burnFrom(ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Burn,
                'CallerNotOwnerNorApproved'
            )
        })

        it('GIVEN an ERC721 WHEN paused THEN burnFrom reverts', async () => {
            const {
                erc721Capped,
                erc721Burn,
                accessControl,
                ownerAddress,
                pause,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await pause.pause()
            await expect(
                erc721Burn.burnFrom(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc721Burn, 'IsPaused')
        })
    })

    describe('Transfer', () => {
        it('GIVEN an ERC721 WHEN transfer from correct owner THEN succeeds', async () => {
            const {
                erc721Capped,
                erc721,
                erc721TestWrapper,
                ownerAddress,
                otherAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721TestWrapper.transfer(ownerAddress, otherAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN transfer from incorrect owner THEN fails', async () => {
            const {
                erc721Capped,
                erc721TestWrapper,
                erc721,
                ownerAddress,
                otherAddress,
                thirdAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721TestWrapper.transfer(otherAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN transfer to zero address THEN fails', async () => {
            const {
                erc721Capped,
                erc721TestWrapper,
                ownerAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721TestWrapper.transfer(ownerAddress, ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721TestWrapper, 'AddressZero')
        })
    })

    describe('Approvals', () => {
        it('GIVEN callSetApprovalForAll WHEN owner is zero address THEN reverts with AddressZero', async () => {
            const { erc721TestWrapper } = await loadFixture(fixtureInitialized)
            await expect(
                erc721TestWrapper.callSetApprovalForAll(
                    ethers.ZeroAddress,
                    otherAddress,
                    true
                )
            ).to.be.revertedWithCustomError(erc721TestWrapper, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN approve as owner THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                ownerAddress,
                otherAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN approve as approved THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                ownerAddress,
                other,
                otherAddress,
                thirdAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await erc721.approve(otherAddress, 1)
            await expect(erc721.connect(other).approve(thirdAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, thirdAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(thirdAddress)
        })

        it('GIVEN an ERC721 WHEN approve as operator THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                ownerAddress,
                other,
                otherAddress,
                thirdAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await erc721.setApprovalForAll(otherAddress, true)
            await expect(erc721.connect(other).approve(thirdAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, thirdAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(thirdAddress)
        })

        it('GIVEN an ERC721 WHEN setApprovalForAll THEN isApprovedForAll is true', async () => {
            const { erc721, ownerAddress, otherAddress } =
                await loadFixture(fixtureInitialized)

            await expect(erc721.setApprovalForAll(otherAddress, true))
                .to.emit(erc721, 'ApprovalForAll')
                .withArgs(ownerAddress, otherAddress, true)
            expect(await erc721.isApprovedForAll(ownerAddress, otherAddress)).to
                .be.true
        })

        it('GIVEN an ERC721 WHEN setApprovalForAll with zero operator THEN fails', async () => {
            const { erc721TestWrapper, erc721 } =
                await loadFixture(fixtureInitialized)
            await expect(
                erc721.setApprovalForAll(ethers.ZeroAddress, true)
            ).to.be.revertedWithCustomError(erc721TestWrapper, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN approve as not owner nor operator THEN fails', async () => {
            const {
                erc721,
                erc721Capped,
                ownerAddress,
                other,
                thirdAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721.connect(other).approve(thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN paused THEN approve reverts', async () => {
            const {
                erc721,
                erc721Capped,
                ownerAddress,
                otherAddress,
                accessControl,
                pause,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await pause.pause()

            await expect(
                erc721.approve(otherAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN paused THEN setApprovalForAll reverts', async () => {
            const { erc721, ownerAddress, otherAddress, accessControl, pause } =
                await loadFixture(fixtureInitialized)

            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await pause.pause()

            await expect(
                erc721.setApprovalForAll(otherAddress, true)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })
    })

    describe('transferFrom', () => {
        it('GIVEN an ERC721 WHEN transferFrom as owner THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(erc721.transferFrom(ownerAddress, otherAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAddress, 1)
        })

        it('GIVEN an ERC721 WHEN transferFrom as approved THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                other,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await erc721.approve(await other.getAddress(), 1)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(ownerAddress, thirdAddress, 1)
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 WHEN transferFrom as operator THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                other,
                thirdAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await erc721.setApprovalForAll(otherAddress, true)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(ownerAddress, thirdAddress, 1)
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 WHEN transferFrom as not approved THEN fails', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                other,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721
                    .connect(other)
                    .transferFrom(ownerAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN transferFrom from not owner THEN fails', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721.transferFrom(otherAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN owner approves another, transfers token, THEN approved address is reset to zero', async () => {
            const {
                erc721,
                erc721Capped,
                erc721TestWrapper,
                accessControl,
                ownerAddress,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            // Approve 'other'
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)

            // Transfer token
            await expect(
                erc721TestWrapper.transfer(ownerAddress, thirdAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)

            // Approved reset
            expect(await erc721.getApproved(1)).to.equal(ethers.ZeroAddress)
        })

        it('GIVEN an ERC721 WHEN paused THEN transferFrom reverts', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
                pause,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await pause.pause()
            await expect(
                erc721.transferFrom(ownerAddress, otherAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })
    })

    describe('safeTransferFrom', () => {
        it('GIVEN an ERC721 WHEN safeTransferFrom to EOA THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    otherAddress,
                    1
                )
            ).to.emit(erc721, 'Transfer')
            expect(await erc721.ownerOf(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract implementing onERC721Received THEN succeeds', async () => {
            const { erc721, erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            const Receiver =
                await ethers.getContractFactory('ERC721ReceiverMock')
            const receiverMock = await Receiver.deploy()
            await receiverMock.setSelector('0x150b7a02')
            const receiverAddress = await receiverMock.getAddress()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    receiverAddress,
                    1
                )
            ).to.emit(erc721, 'Transfer')
            expect(await erc721.ownerOf(1)).to.equal(receiverAddress)
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract returning wrong selector THEN reverts with TransferToNonERC721ReceiverImplementer', async () => {
            const { erc721, erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            const Receiver =
                await ethers.getContractFactory('ERC721ReceiverMock')
            const receiverMock = await Receiver.deploy()
            await receiverMock.setSelector('0xdeadbeef')
            const receiverAddress = await receiverMock.getAddress()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    receiverAddress,
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom a contrato que NO implementa onERC721Received (ej: ERC20) THEN reverts with TransferToNonERC721ReceiverImplementer', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                erc20Address,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    erc20Address,
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom(address,address,uint256,bytes) is called THEN token is transferred and Transfer event is emitted', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            const data = ethers.encodeBytes32String('extra-data')
            await expect(
                erc721['safeTransferFrom(address,address,uint256,bytes)'](
                    ownerAddress,
                    otherAddress,
                    1,
                    data
                )
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom from incorrect owner THEN reverts with CallerNotOwnerNorApproved', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    otherAddress,
                    thirdAddress,
                    1
                )
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as not owner nor approved nor operator THEN reverts with CallerNotOwnerNorApproved', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                other,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            const safeTransferFrom =
                erc721.connect(other)[
                    'safeTransferFrom(address,address,uint256)'
                ]
            await expect(
                safeTransferFrom(ownerAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as operator (isApprovedForAll) THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                other,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721.setApprovalForAll(otherAddress, true)
            const safeTransferFrom =
                erc721.connect(other)[
                    'safeTransferFrom(address,address,uint256)'
                ]
            await expect(safeTransferFrom(ownerAddress, thirdAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as approved THEN succeeds', async () => {
            const {
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                other,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721.approve(otherAddress, 1)
            const safeTransferFrom =
                erc721.connect(other)[
                    'safeTransferFrom(address,address,uint256)'
                ]
            await expect(safeTransferFrom(ownerAddress, thirdAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)
        })

        it('GIVEN an ERC721 WHEN paused THEN safeTransferFrom(address,address,uint256) reverts', async () => {
            const { erc721, erc721Capped, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await pause.pause()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    thirdAddress,
                    1
                )
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN paused THEN safeTransferFrom(address,address,uint256,bytes) reverts', async () => {
            const { erc721, erc721Capped, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await pause.pause()
            const data = ethers.encodeBytes32String('extra-data')
            await expect(
                erc721['safeTransferFrom(address,address,uint256,bytes)'](
                    ownerAddress,
                    thirdAddress,
                    1,
                    data
                )
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })
    })

    describe('Metadata', () => {
        it('GIVEN an ERC721 WHEN tokenURI is called THEN returns empty string', async () => {
            const { erc721, erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            expect(await erc721.tokenURI(1)).to.equal('')
        })

        it('GIVEN an ERC721 WHEN baseURI is called THEN returns empty string', async () => {
            const { erc721TestWrapper } = await loadFixture(fixtureInitialized)
            expect(await erc721TestWrapper.baseURI()).to.equal('')
        })
    })

    describe('Cap', () => {
        it('GIVEN an initialized ERC721 WHEN mint is called by someone without MINTER_ROLE THEN it reverts', async () => {
            const { erc721Capped, other, otherAddress, accessControl } =
                await loadFixture(fixtureInitialized)

            await expect(
                erc721Capped.connect(other).mint(otherAddress, 1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })
        it('GIVEN an ERC721 WHEN initializeCap with Zero THEN it fails', async () => {
            const { erc721Capped } = await loadFixture(fixtureUninitialized)
            await expect(
                erc721Capped.initializeCap(0)
            ).to.be.revertedWithCustomError(erc721Capped, 'EmptyUint')
        })

        it('GIVEN an ERC721 WHEN cap is initialized THEN it can be retrieved', async () => {
            const { erc721Capped, ownerAddress } =
                await loadFixture(fixtureUninitialized)
            await expect(erc721Capped.initializeCap(1000))
                .to.emit(erc721Capped, 'CapSet')
                .withArgs(ownerAddress, 1000)
            await expect(
                erc721Capped.initializeCap(1)
            ).to.be.revertedWithCustomError(
                erc721Capped,
                'ContractIsAlreadyInitialized'
            )
            expect(Number(await erc721Capped.cap())).to.equal(1000)
        })

        it('GIVEN an initialized ERC721 WHEN mint over cap THEN it fails', async () => {
            const { erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            expect(Number(await erc721Capped.cap())).to.equal(3)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            // Mint up to cap
            for (let i = 1; i <= 3; i++) {
                await erc721Capped.mint(ownerAddress, i)
            }
            // Minting above cap should fail
            await expect(
                erc721Capped.mint(ownerAddress, 4)
            ).to.be.revertedWithCustomError(erc721Capped, 'CapExceeded')
        })

        it('GIVEN an initialized ERC721 WHEN setting cap below total supply THEN it fails', async () => {
            const { erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            // Mint 2 tokens
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            const totalSupply = 2
            const newCap = totalSupply - 1

            await expect(erc721Capped.setCap(newCap))
                .to.be.revertedWithCustomError(
                    erc721Capped,
                    'NewCapIsLessThanTotalSupply'
                )
                .withArgs(newCap, totalSupply)
        })

        it('GIVEN an initialized ERC721 WHEN setting cap on a paused token THEN it fails', async () => {
            const { erc721Capped, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()

            await expect(
                erc721Capped.setCap(1000000)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN an initialized ERC721 WHEN mint on a paused token THEN it fails', async () => {
            const { erc721Capped, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()

            await expect(
                erc721Capped.mint(ownerAddress, 1)
            ).to.be.revertedWithCustomError(pause, 'IsPaused')
        })

        it('GIVEN an initialized ERC721 WHEN non capper setting cap THEN it fails', async () => {
            const { erc721Capped, accessControl } =
                await loadFixture(fixtureInitialized)
            // No CAP_ROLE granted
            await expect(erc721Capped.setCap(1)).to.be.revertedWithCustomError(
                accessControl,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an initialized ERC721 WHEN setting cap over total supply THEN it succeeds', async () => {
            const { erc721Capped, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            const totalSupply = 2
            const newCap = totalSupply + 1

            await expect(erc721Capped.setCap(newCap))
                .to.emit(erc721Capped, 'CapSet')
                .withArgs(ownerAddress, newCap)
        })
    })

    describe('Snapshot', () => {
        it('GIVEN an ERC721 WHEN not exists snapshot THEN balanceOfAt and totalSupplyAt fails', async () => {
            const {
                erc721Snapshot,
                erc721Capped,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721Snapshot.balanceOfAt(ownerAddress, 0)
            ).to.be.revertedWithCustomError(erc721Snapshot, 'EmptyUint')
            await expect(
                erc721Snapshot.totalSupply(0)
            ).to.be.revertedWithCustomError(erc721Snapshot, 'EmptyUint')
            await expect(
                erc721Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'NonExistentSnapshotId'
            )
            await expect(
                erc721Snapshot.totalSupply(1)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'NonExistentSnapshotId'
            )
            await expect(
                erc721Snapshot.ownerOfAt(1, 0)
            ).to.be.revertedWithCustomError(erc721Snapshot, 'EmptyUint')
            await expect(
                erc721Snapshot.ownerOfAt(1, 1)
            ).to.be.revertedWithCustomError(
                erc721Snapshot,
                'NonExistentSnapshotId'
            )
        })

        it('GIVEN an ERC721 WHEN paused THEN snapshot fails', async () => {
            const { erc721Snapshot, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)

            await accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await pause.pause()

            await expect(
                erc721Snapshot.snapshot()
            ).to.be.revertedWithCustomError(erc721Snapshot, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN non snapshoter takes a snapshot THEN fails', async () => {
            const { erc721Snapshot } = await loadFixture(fixtureInitialized)

            await expect(
                erc721Snapshot.snapshot()
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC721 WHEN it is prepared THEN a snapshot can be made', async () => {
            const {
                erc721Snapshot,
                erc721,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(SNAPSHOT_ROLE, ownerAddress)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await erc721Capped.mint(ownerAddress, 1)

            await expect(erc721Snapshot.snapshot())
                .to.emit(erc721Snapshot, 'Snapshot')
                .withArgs(1)
            expect(
                await erc721Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.equal(1)
            expect(
                await erc721Snapshot.balanceOfAt(otherAddress, 1)
            ).to.be.equal(0)
            expect(await erc721Snapshot.totalSupply(1)).to.be.equal(1)
            if (erc721Snapshot.ownerOfAt) {
                expect(await erc721Snapshot.ownerOfAt(1, 1)).to.equal(
                    ownerAddress
                )
            }
            await erc721.transferFrom(ownerAddress, otherAddress, 1)
            await erc721Capped.mint(otherAddress, 2)
            expect(
                await erc721Snapshot.balanceOfAt(ownerAddress, 1)
            ).to.be.equal(1)
            expect(
                await erc721Snapshot.balanceOfAt(otherAddress, 1)
            ).to.be.equal(0)
            expect(await erc721Snapshot.totalSupply(1)).to.be.equal(1)
            expect(await erc721.balanceOf(ownerAddress)).to.be.equal(0)
            expect(await erc721.balanceOf(otherAddress)).to.be.equal(2)
            if (erc721Snapshot.ownerOfAt) {
                expect(await erc721Snapshot.ownerOfAt(1, 1)).to.equal(
                    ownerAddress
                )
            }
        })
    })

    describe('Controller', () => {
        it('GIVEN an ERC721 initialized WHEN try to force burn a paused token THEN it fails', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                otherAddress,
                pause,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await erc721Capped.mint(otherAddress, 1)
            await pause.pause()

            await expect(
                erc721Controller.forceBurn(otherAddress, 1)
            ).to.be.revertedWithCustomError(erc721Controller, 'IsPaused')
        })

        it('GIVEN an ERC721 initialized WHEN non controller tries to force burn THEN it fails', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                other,
                otherAddress,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(otherAddress, 1)

            const controller = erc721Controller.connect(other)

            await expect(
                controller.forceBurn(otherAddress, 1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC721 WHEN forceBurn with incorrect owner THEN it fails', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

            await erc721Capped.mint(otherAddress, 1)

            await expect(
                erc721Controller.forceBurn(thirdAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Controller,
                'ForceBurnNotTokenOwner'
            )
        })

        it('GIVEN an ERC721 WHEN it is prepared THEN a force burn can be made', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                otherAddress,
                erc721,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

            await erc721Capped.mint(otherAddress, 1)

            await expect(erc721Controller.forceBurn(otherAddress, 1))
                .to.emit(erc721Controller, 'ForceBurn')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(ZeroAddress)
        })

        it('GIVEN an ERC721 initialized WHEN try to force transfer a paused token THEN it fails', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                otherAddress,
                pause,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await erc721Capped.mint(otherAddress, 1)
            await pause.pause()

            await expect(
                erc721Controller.forceTransfer(otherAddress, ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc721Controller, 'IsPaused')
        })

        it('GIVEN an ERC721 initialized WHEN non controller tries to force transfer THEN it fails', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                other,
                otherAddress,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(otherAddress, 1)

            const controller = erc721Controller.connect(other)

            await expect(
                controller.forceTransfer(otherAddress, ownerAddress, 1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN an ERC721 WHEN it is prepared THEN a force transfer can be made', async () => {
            const {
                erc721Capped,
                erc721Controller,
                accessControl,
                ownerAddress,
                otherAddress,
                erc721,
            } = await loadFixture(fixtureInitialized)

            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CONTROLLER_ROLE, ownerAddress)

            await erc721Capped.mint(otherAddress, 1)

            await expect(
                erc721Controller.forceTransfer(otherAddress, ownerAddress, 1)
            )
                .to.emit(erc721Controller, 'ForceTransfer')
                .withArgs(ownerAddress, otherAddress, ownerAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(ownerAddress)
        })
    })

    describe('Enumerable', () => {
        it('GIVEN an ERC721 WHEN minted THEN totalSupplyEnumerable returns correct value', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(otherAddress, 3)
            expect(await erc721Enumerable.totalSupplyEnumerable()).to.equal(3)
        })

        it('GIVEN an ERC721 WHEN minted THEN tokenOfOwnerByIndex returns correct token IDs', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(otherAddress, 3)

            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 0)
            ).to.equal(1)
            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 1)
            ).to.equal(2)
            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(otherAddress, 0)
            ).to.equal(3)
        })

        it('GIVEN an ERC721 WHEN minted THEN tokenByIndex returns correct token IDs', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(otherAddress, 3)

            expect(await erc721Enumerable.tokenByIndex(0)).to.equal(1)
            expect(await erc721Enumerable.tokenByIndex(1)).to.equal(2)
            expect(await erc721Enumerable.tokenByIndex(2)).to.equal(3)
        })

        it('GIVEN an ERC721 WHEN tokenOfOwnerByIndex out of bounds THEN reverts with OwnerIndexOutOfBounds', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)

            await expect(
                erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 2)
            ).to.be.revertedWithCustomError(
                erc721Enumerable,
                'OwnerIndexOutOfBounds'
            )
        })

        it('GIVEN an ERC721 WHEN tokenByIndex out of bounds THEN reverts with GlobalIndexOutOfBounds', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)

            await expect(
                erc721Enumerable.tokenByIndex(3)
            ).to.be.revertedWithCustomError(
                erc721Enumerable,
                'GlobalIndexOutOfBounds'
            )
        })

        it('GIVEN an ERC721 WHEN token is transferred THEN it is removed from previous owner and added to new owner', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                erc721,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(otherAddress, 3)

            await erc721.transferFrom(ownerAddress, otherAddress, 2)
            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 0)
            ).to.equal(1)
            await expect(
                erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Enumerable,
                'OwnerIndexOutOfBounds'
            )

            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(otherAddress, 0)
            ).to.equal(3)
            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(otherAddress, 1)
            ).to.equal(2)
        })

        it('GIVEN an ERC721 WHEN transfer a token that is not the last in ownedTokens THEN triggers tokenIndex != lastTokenIndex logic', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                erc721,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(otherAddress, 3)
            await erc721Capped.setCap(6)
            await erc721Capped.mint(ownerAddress, 4)

            await erc721.transferFrom(ownerAddress, otherAddress, 2)

            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 0)
            ).to.equal(1)
            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 1)
            ).to.equal(4)
            await expect(
                erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 2)
            ).to.be.revertedWithCustomError(
                erc721Enumerable,
                'OwnerIndexOutOfBounds'
            )

            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(otherAddress, 0)
            ).to.equal(3)
            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(otherAddress, 1)
            ).to.equal(2)
        })

        it('GIVEN an ERC721 WHEN burn a token that is not the last in allTokens THEN triggers tokenIndex != lastTokenIndex logic', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                erc721Burn,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)

            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.setCap(6)
            await erc721Capped.mint(ownerAddress, 4)

            await erc721Burn.burn(2)

            expect(await erc721Enumerable.tokenByIndex(0)).to.equal(1)
            expect(await erc721Enumerable.tokenByIndex(1)).to.equal(4)
        })

        it('GIVEN an ERC721 WHEN transfer a token to a new owner THEN triggers else if (to != from) logic', async () => {
            const {
                erc721Enumerable,
                erc721Capped,
                erc721,
                accessControl,
                ownerAddress,
                otherAddress,
                thirdAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await erc721Capped.mint(ownerAddress, 1)
            await erc721Capped.mint(ownerAddress, 2)
            await erc721Capped.mint(otherAddress, 3)

            await erc721.transferFrom(ownerAddress, thirdAddress, 1)

            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(thirdAddress, 0)
            ).to.equal(1)
            await expect(
                erc721Enumerable.tokenOfOwnerByIndex(thirdAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Enumerable,
                'OwnerIndexOutOfBounds'
            )

            expect(
                await erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 0)
            ).to.equal(2)
            await expect(
                erc721Enumerable.tokenOfOwnerByIndex(ownerAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721Enumerable,
                'OwnerIndexOutOfBounds'
            )
        })
    })

    describe('Royalty', () => {
        it('GIVEN a valid fee denominator WHEN setDefaultRoyalty is called THEN sets and queries default royalty correctly', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)
            await erc721Royalty.setFeeDenominator(10000)
            await erc721Royalty.setDefaultRoyalty(ownerAddress, 500)
            const [receiver, amount] = await erc721Royalty.royaltyInfo(1, 10000)
            expect(receiver).to.equal(ownerAddress)
            expect(amount).to.equal(500)
        })

        it('GIVEN a default royalty set WHEN deleteDefaultRoyalty is called THEN royalty info returns zero values', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            await erc721Royalty.setDefaultRoyalty(ownerAddress, 500)
            await erc721Royalty.deleteDefaultRoyalty()
            const [receiver, amount] = await erc721Royalty.royaltyInfo(1, 10000)
            expect(receiver).to.equal(ZeroAddress)
            expect(amount).to.equal(0)
        })

        it('GIVEN a token royalty set WHEN royaltyInfo is queried THEN returns correct token royalty', async () => {
            const { erc721Royalty, accessControl, otherAddress, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            await erc721Royalty.setTokenRoyalty(1, otherAddress, 1000)
            const [receiver, amount] = await erc721Royalty.royaltyInfo(1, 10000)
            expect(receiver).to.equal(otherAddress)
            expect(amount).to.equal(1000)
        })

        it('GIVEN a token royalty set and reset WHEN royaltyInfo is queried THEN returns default royalty', async () => {
            const { erc721Royalty, accessControl, ownerAddress, otherAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            await erc721Royalty.setDefaultRoyalty(ownerAddress, 500)
            await erc721Royalty.setTokenRoyalty(1, otherAddress, 1000)
            await erc721Royalty.resetTokenRoyalty(1)
            const [receiver, amount] = await erc721Royalty.royaltyInfo(1, 10000)
            expect(receiver).to.equal(ownerAddress)
            expect(amount).to.equal(500)
        })

        it('GIVEN setFeeDenominator is called WHEN queried THEN returns correct denominator', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(20000)
            expect(await erc721Royalty.feeDenominator()).to.equal(20000)
        })

        it('GIVEN feeNumerator exceeds denominator WHEN setDefaultRoyalty is called THEN reverts with FeeExceedsDenominator', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            await expect(
                erc721Royalty.setDefaultRoyalty(ownerAddress, 20000)
            ).to.be.revertedWithCustomError(
                erc721Royalty,
                'FeeExceedsDenominator'
            )
        })

        it('GIVEN feeNumerator exceeds denominator WHEN setTokenRoyalty is called THEN reverts with FeeExceedsDenominator', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(1000)
            await expect(
                erc721Royalty.setTokenRoyalty(1, ownerAddress, 1001)
            ).to.be.revertedWithCustomError(
                erc721Royalty,
                'FeeExceedsDenominator'
            )
        })

        it('GIVEN no ROYALTY_ROLE WHEN managing royalties THEN all management functions revert with access control error', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            await accessControl.revokeRole(ROYALTY_ROLE, ownerAddress)

            await expect(
                erc721Royalty.setDefaultRoyalty(ownerAddress, 500)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
            await expect(
                erc721Royalty.setTokenRoyalty(1, ownerAddress, 500)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
            await expect(
                erc721Royalty.deleteDefaultRoyalty()
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
            await expect(
                erc721Royalty.resetTokenRoyalty(1)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
            await expect(
                erc721Royalty.setFeeDenominator(10000)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN no royalty set WHEN royaltyInfo is queried THEN returns zero values', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            const [receiver, amount] = await erc721Royalty.royaltyInfo(1, 10000)
            expect(receiver).to.equal(ZeroAddress)
            expect(amount).to.equal(0)
        })

        it('GIVEN zero address or zero denominator WHEN setDefaultRoyalty or setFeeDenominator is called THEN reverts with validation error', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await erc721Royalty.setFeeDenominator(10000)
            await expect(
                erc721Royalty.setDefaultRoyalty(ZeroAddress, 500)
            ).to.be.revertedWithCustomError(erc721Royalty, 'AddressZero')
            await expect(
                erc721Royalty.setFeeDenominator(0)
            ).to.be.revertedWithCustomError(erc721Royalty, 'EmptyUint')
        })

        it('GIVEN receiver is zero address WHEN setTokenRoyalty is called THEN reverts with AddressIsZero', async () => {
            const { erc721Royalty, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)

            await expect(
                erc721Royalty.setTokenRoyalty(1, ZeroAddress, 500)
            ).to.be.revertedWithCustomError(erc721Royalty, 'AddressZero')
        })

        it('GIVEN feeDenominator is set to zero WHEN feeDenominator() is called THEN returns default value 10000', async () => {
            const { erc721Royalty } = await loadFixture(fixtureInitialized)

            expect(await erc721Royalty.feeDenominator()).to.equal(10000)
        })

        it('GIVEN an ERC721 WHEN paused THEN setDefaultRoyalty reverts', async () => {
            const { erc721Royalty, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()
            await expect(
                erc721Royalty.setDefaultRoyalty(ownerAddress, 500)
            ).to.be.revertedWithCustomError(erc721Royalty, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN paused THEN deleteDefaultRoyalty reverts', async () => {
            const { erc721Royalty, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()
            await expect(
                erc721Royalty.deleteDefaultRoyalty()
            ).to.be.revertedWithCustomError(erc721Royalty, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN paused THEN setTokenRoyalty reverts', async () => {
            const {
                erc721Royalty,
                accessControl,
                ownerAddress,
                otherAddress,
                pause,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)
            await pause.pause()

            await expect(
                erc721Royalty.setTokenRoyalty(1, otherAddress, 1000)
            ).to.be.revertedWithCustomError(erc721Royalty, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN paused THEN resetTokenRoyalty reverts', async () => {
            const { erc721Royalty, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()

            await expect(
                erc721Royalty.resetTokenRoyalty(1)
            ).to.be.revertedWithCustomError(erc721Royalty, 'IsPaused')
        })

        it('GIVEN an ERC721 WHEN paused THEN setFeeDenominator reverts', async () => {
            const { erc721Royalty, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(ROYALTY_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()
            await expect(
                erc721Royalty.setFeeDenominator(20000)
            ).to.be.revertedWithCustomError(erc721Royalty, 'IsPaused')
        })
    })

    describe('Consecutive', () => {
        it('GIVEN ERC721Consecutive WHEN mintConsecutive with quantity 0 THEN reverts', async () => {
            const {
                erc721Consecutive,
                erc721TestWrapper,
                ownerAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(
                erc721Consecutive.mintConsecutive(ownerAddress, 0)
            ).to.be.revertedWithCustomError(erc721TestWrapper, 'EmptyUint')
        })

        it('GIVEN ERC721Consecutive WHEN mintConsecutive to zero address THEN reverts', async () => {
            const {
                erc721Consecutive,
                erc721TestWrapper,
                ownerAddress,
                accessControl,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await expect(
                erc721Consecutive.mintConsecutive(ethers.ZeroAddress, 2)
            ).to.be.revertedWithCustomError(erc721TestWrapper, 'AddressZero')
        })

        it('GIVEN ERC721Consecutive WHEN mintConsecutive as not minter THEN reverts', async () => {
            const { erc721Consecutive, accessControl, ownerAddress } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.revokeRole(MINTER_ROLE, ownerAddress)

            await expect(
                erc721Consecutive.mintConsecutive(ownerAddress, 2)
            ).to.be.revertedWithCustomError(accessControl, 'AccountHasNoRole')
        })

        it('GIVEN ERC721Consecutive WHEN mintConsecutive THEN emits ConsecutiveTransfer and tokens are owned', async () => {
            const {
                erc721Consecutive,
                erc721Capped,
                erc721,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)
            await erc721Capped.setCap(10)

            const quantity = 5
            await expect(
                erc721Consecutive.mintConsecutive(ownerAddress, quantity)
            )
                .to.emit(erc721Consecutive, 'ConsecutiveTransfer')
                .withArgs(1, quantity, ethers.ZeroAddress, ownerAddress)

            for (let i = 1; i <= quantity; i++) {
                expect(await erc721.ownerOf(i)).to.equal(ownerAddress)
            }
        })

        it('GIVEN ERC721Consecutive WHEN mintConsecutive multiple times THEN tokenIds increment correctly', async () => {
            const {
                erc721Consecutive,
                erc721Capped,
                erc721,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(CAP_ROLE, ownerAddress)
            await erc721Capped.setCap(10)

            await erc721Consecutive.mintConsecutive(ownerAddress, 3)
            await erc721Consecutive.mintConsecutive(ownerAddress, 2)

            expect(await erc721.ownerOf(1)).to.equal(ownerAddress)
            expect(await erc721.ownerOf(3)).to.equal(ownerAddress)
            expect(await erc721.ownerOf(4)).to.equal(ownerAddress)
            expect(await erc721.ownerOf(5)).to.equal(ownerAddress)
        })

        it('GIVEN ERC721Consecutive WHEN mintConsecutive THEN can transfer minted tokens', async () => {
            const {
                erc721Consecutive,
                erc721TestWrapper,
                erc721,
                accessControl,
                ownerAddress,
                otherAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await erc721Consecutive.mintConsecutive(ownerAddress, 2)
            await erc721TestWrapper.transfer(ownerAddress, otherAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(otherAddress)

            await erc721TestWrapper.transfer(ownerAddress, otherAddress, 2)
            expect(await erc721.ownerOf(2)).to.equal(otherAddress)
        })

        it('GIVEN ERC721Consecutive WHEN mintConsecutive THEN can burn minted tokens', async () => {
            const {
                erc721Consecutive,
                erc721Burn,
                erc721,
                accessControl,
                ownerAddress,
            } = await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)

            await erc721Consecutive.mintConsecutive(ownerAddress, 2)
            await erc721Burn.burn(1)
            expect(await erc721.ownerOf(1)).to.equal(ZeroAddress)

            await erc721Burn.burn(2)
            expect(await erc721.ownerOf(2)).to.equal(ZeroAddress)
        })

        it('GIVEN ERC721Consecutive WHEN paused THEN mintConsecutive reverts', async () => {
            const { erc721Consecutive, accessControl, ownerAddress, pause } =
                await loadFixture(fixtureInitialized)
            await accessControl.grantRole(MINTER_ROLE, ownerAddress)
            await accessControl.grantRole(PAUSER_ROLE, ownerAddress)

            await pause.pause()
            await expect(
                erc721Consecutive.mintConsecutive(ownerAddress, 2)
            ).to.be.revertedWithCustomError(erc721Consecutive, 'IsPaused')
        })
    })
})
