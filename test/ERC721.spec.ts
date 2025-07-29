import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, Contract, ZeroAddress } from 'ethers'
import { ERC721TestWrapper, ERC721Facet, ERC20 } from '../typechain-types'
import { deployAll } from './initialization'

describe('ERC721', function () {
    const name = 'ISBE NFT'
    const symbol = 'ISBENFT'

    let erc721: ERC721Facet
    let erc721TestWrapper: ERC721TestWrapper
    let erc20: ERC20
    let owner: Signer
    let ownerAddress: string
    let other: Signer
    let otherAddress: string
    let third: Signer
    let thirdAddress: string

    async function deploy(initialize = false) {
        ;[owner, other, third] = await ethers.getSigners()
        ownerAddress = await owner.getAddress()
        otherAddress = await other.getAddress()
        thirdAddress = await third.getAddress()

        const result = await deployAll()
        erc721 = result.erc721
        erc721TestWrapper = result.erc721TestWrapper
        erc20 = result.erc20

        if (initialize) {
            await erc721.initializeErc721(name, symbol)
        }
    }

    describe('Deployment', () => {
        it('GIVEN an ERC721 WHEN deployed THEN cannot initialize twice', async () => {
            await deploy(true)
            await expect(
                erc721.initializeErc721(name, symbol)
            ).to.be.revertedWithCustomError(
                erc721,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN an ERC721 WHEN deployed THEN name and symbol are correct', async () => {
            await deploy()
            await erc721.initializeErc721(name, symbol)
            expect(await erc721.name()).to.equal(name)
            expect(await erc721.symbol()).to.equal(symbol)
        })
    })

    describe('Mint', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN an ERC721 WHEN mint to zero address THEN fails', async () => {
            await expect(
                erc721TestWrapper.mint(ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN mint a new token THEN succeeds', async () => {
            await expect(erc721TestWrapper.mint(ownerAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(ownerAddress)
            expect(await erc721.balanceOf(ownerAddress)).to.equal(1)
            expect(await erc721.totalSupply()).to.equal(1)
        })

        it('GIVEN an ERC721 WHEN mint an already minted token THEN fails', async () => {
            await erc721TestWrapper.mint(ownerAddress, 1)
            await expect(
                erc721TestWrapper.mint(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'TokenAlreadyMinted')
        })
    })

    describe('Burn', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
        })

        it('GIVEN an ERC721 WHEN burn a token THEN totalSupply decreases and ownerOf is ZeroAddress', async () => {
            await expect(erc721TestWrapper.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
            expect(await erc721.totalSupply()).to.equal(0)
            expect(await erc721.ownerOf(1)).to.be.equal(ZeroAddress)
        })

        it('GIVEN an ERC721 WHEN owner approves another, burns token, THEN approved address is reset to zero', async () => {
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)

            await expect(erc721TestWrapper.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)

            expect(await erc721.getApproved(1)).to.equal(ethers.ZeroAddress)
        })
    })

    describe('Transfer', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
        })

        it('GIVEN an ERC721 WHEN transfer from correct owner THEN succeeds', async () => {
            await expect(
                erc721TestWrapper.transfer(ownerAddress, otherAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN transfer from incorrect owner THEN fails', async () => {
            await expect(
                erc721TestWrapper.transfer(otherAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN transfer to zero address THEN fails', async () => {
            await expect(
                erc721TestWrapper.transfer(ownerAddress, ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN transfer from zero address THEN fails', async () => {
            await expect(
                erc721TestWrapper.transfer(ethers.ZeroAddress, otherAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })
    })

    describe('Approvals', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
        })

        it('GIVEN callSetApprovalForAll WHEN owner is zero address THEN reverts with AddressZero', async () => {
            await expect(
                erc721TestWrapper.callSetApprovalForAll(
                    ethers.ZeroAddress,
                    otherAddress,
                    true
                )
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN approve as owner THEN succeeds', async () => {
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN approve as approved THEN succeeds', async () => {
            await erc721.approve(otherAddress, 1)
            await expect(erc721.connect(other).approve(thirdAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, thirdAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(thirdAddress)
        })

        it('GIVEN an ERC721 WHEN approve as operator THEN succeeds', async () => {
            await erc721.setApprovalForAll(otherAddress, true)
            await expect(erc721.connect(other).approve(thirdAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, thirdAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(thirdAddress)
        })

        it('GIVEN an ERC721 WHEN setApprovalForAll THEN isApprovedForAll is true', async () => {
            await expect(erc721.setApprovalForAll(otherAddress, true))
                .to.emit(erc721, 'ApprovalForAll')
                .withArgs(ownerAddress, otherAddress, true)
            expect(await erc721.isApprovedForAll(ownerAddress, otherAddress)).to
                .be.true
        })

        it('GIVEN an ERC721 WHEN setApprovalForAll with zero operator THEN fails', async () => {
            await expect(
                erc721.setApprovalForAll(ethers.ZeroAddress, true)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN approve as not owner nor operator THEN fails', async () => {
            await expect(
                erc721.connect(other).approve(thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })
    })

    describe('transferFrom', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
        })

        it('GIVEN an ERC721 WHEN transferFrom as owner THEN succeeds', async () => {
            await expect(erc721.transferFrom(ownerAddress, otherAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAddress, 1)
        })

        it('GIVEN an ERC721 WHEN transferFrom as approved THEN succeeds', async () => {
            await erc721.approve(otherAddress, 1)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(ownerAddress, thirdAddress, 1)
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 WHEN transferFrom as operator THEN succeeds', async () => {
            await erc721.setApprovalForAll(otherAddress, true)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(ownerAddress, thirdAddress, 1)
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 WHEN transferFrom as not approved THEN fails', async () => {
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(ownerAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN transferFrom from not owner THEN fails', async () => {
            await expect(
                erc721.transferFrom(otherAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN owner approves another, transfers token, THEN approved address is reset to zero', async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)

            // Owner approves 'other' for token 1
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)

            // Owner transfers token 1 to 'third'
            await expect(
                erc721TestWrapper.transfer(ownerAddress, thirdAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)

            // After transfer, approved address should be reset to zero
            expect(await erc721.getApproved(1)).to.equal(ethers.ZeroAddress)
        })
    })

    describe('safeTransferFrom', () => {
        let receiverMock: Contract

        beforeEach(async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
            const Receiver =
                await ethers.getContractFactory('ERC721ReceiverMock')
            receiverMock = await Receiver.deploy()
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to EOA THEN succeeds', async () => {
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
            const erc20Address = await erc20.getAddress()
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
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
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
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)

            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    otherAddress,
                    thirdAddress,
                    1
                )
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as not owner nor approved nor operator THEN reverts with CallerNotOwnerNorApproved', async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
            await expect(
                erc721.connect(other)[
                    // eslint-disable-next-line no-unexpected-multiline
                    'safeTransferFrom(address,address,uint256)'
                ](ownerAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as operator (isApprovedForAll) THEN succeeds', async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)

            await erc721.setApprovalForAll(otherAddress, true)
            await expect(
                erc721.connect(other)[
                    // eslint-disable-next-line no-unexpected-multiline
                    'safeTransferFrom(address,address,uint256)'
                ](ownerAddress, thirdAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as approved THEN succeeds', async () => {
            await deploy(true)
            await erc721TestWrapper.mint(ownerAddress, 1)
            await erc721.approve(otherAddress, 1)
            await expect(
                erc721.connect(other)[
                    // eslint-disable-next-line no-unexpected-multiline
                    'safeTransferFrom(address,address,uint256)'
                ](ownerAddress, thirdAddress, 1)
            )
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)
        })
    })

    describe('Metadata', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN an ERC721 WHEN tokenURI is called THEN returns empty string', async () => {
            await erc721TestWrapper.mint(ownerAddress, 1)
            expect(await erc721.tokenURI(1)).to.equal('')
        })

        it('GIVEN an ERC721 WHEN baseURI is called THEN returns empty string', async () => {
            expect(await erc721TestWrapper.baseURI()).to.equal('')
        })
    })
})
