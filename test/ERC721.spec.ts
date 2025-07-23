import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, Contract, ZeroAddress } from 'ethers'
import { ERC721TestWrapper, ERC721ReceiverMock } from '../typechain-types'
import { deployERC721 } from './initialization'
import { ERC721_RESOLVER_KEY } from './constants'

describe('ERC721', function () {
    const name = 'ISBE NFT'
    const symbol = 'ISBENFT'

    let receiver: ERC721ReceiverMock
    let erc721: ERC721TestWrapper
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

        const result = await deployERC721()
        erc721 = result.erc721

        if (initialize) {
            await erc721.initializeErc721(name, symbol)
        }

        expect(await erc721.businessIdIntrospection()).to.equal(
            ERC721_RESOLVER_KEY
        )

        const ERC721Receiver =
            await ethers.getContractFactory('ERC721ReceiverMock')
        receiver = (await ERC721Receiver.deploy()) as ERC721ReceiverMock
        await receiver.waitForDeployment()
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
                erc721.mint(ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN mint a new token THEN succeeds', async () => {
            await expect(erc721.mint(ownerAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ethers.ZeroAddress, ownerAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(ownerAddress)
            expect(await erc721.balanceOf(ownerAddress)).to.equal(1)
            expect(await erc721.totalSupply()).to.equal(1)
        })

        it('GIVEN an ERC721 WHEN mint an already minted token THEN fails', async () => {
            await erc721.mint(ownerAddress, 1)
            await expect(
                erc721.mint(ownerAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'TokenAlreadyMinted')
        })
    })

    describe('Burn', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
        })

        it('GIVEN an ERC721 WHEN burn a token THEN totalSupply decreases and ownerOf is ZeroAddress', async () => {
            await expect(erc721.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
            expect(await erc721.totalSupply()).to.equal(0)
            expect(await erc721.ownerOf(1)).to.be.equal(ZeroAddress)
        })

        it('GIVEN an ERC721 WHEN owner approves another, burns token, THEN approved address is reset to zero', async () => {
            // Owner aprueba a "other" para el token 1
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)

            // Owner quema el token 1
            await expect(erc721.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)

            // Después del burn, el approved debe ser la zero address
            expect(await erc721.getApproved(1)).to.equal(ethers.ZeroAddress)
        })
    })

    describe('Transfer', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
        })

        it('GIVEN an ERC721 WHEN transfer from correct owner THEN succeeds', async () => {
            await expect(erc721.transfer(ownerAddress, otherAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.ownerOf(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN transfer from incorrect owner THEN fails', async () => {
            await expect(
                erc721.transfer(otherAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferFromIncorrectOwner'
            )
        })

        it('GIVEN an ERC721 WHEN transfer to zero address THEN fails', async () => {
            await expect(
                erc721.transfer(ownerAddress, ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 WHEN transfer from zero address THEN fails', async () => {
            await expect(
                erc721.transfer(ethers.ZeroAddress, otherAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })
    })

    describe('Approvals', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
        })

        it('GIVEN callSetApprovalForAll WHEN owner is zero address THEN reverts with AddressZero', async () => {
            await expect(
                erc721.callSetApprovalForAll(
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
            await erc721.mint(ownerAddress, 1)
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
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferFromIncorrectOwner'
            )
        })

        it('GIVEN an ERC721 WHEN owner approves another, transfers token, THEN approved address is reset to zero', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)

            // Owner approves 'other' for token 1
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)

            // Owner transfers token 1 to 'third'
            await expect(erc721.transfer(ownerAddress, thirdAddress, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, thirdAddress, 1)

            // After transfer, approved address should be reset to zero
            expect(await erc721.getApproved(1)).to.equal(ethers.ZeroAddress)
        })
    })

    describe('safeTransferFrom', () => {
        let receiver: ERC721ReceiverMock
        let badReceiver: Contract

        beforeEach(async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
            const ERC721Receiver =
                await ethers.getContractFactory('ERC721ReceiverMock')
            receiver = (await ERC721Receiver.deploy()) as ERC721ReceiverMock
            await receiver.waitForDeployment()
            const ERC721BadReceiver = await ethers.getContractFactory(
                'ERC721BadReceiverMock'
            )
            badReceiver = (await ERC721BadReceiver.deploy()) as Contract
            await badReceiver.waitForDeployment()
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to EOA THEN succeeds', async () => {
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    otherAddress,
                    1
                )
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom(address,address,uint256,bytes) is called THEN token is transferred and Transfer event is emitted', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
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

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract implementing IERC721Receiver THEN succeeds', async () => {
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    await receiver.getAddress(),
                    1
                )
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract not implementing IERC721Receiver THEN fails', async () => {
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    await badReceiver.getAddress(),
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom from incorrect owner THEN reverts with TransferFromIncorrectOwner', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)

            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    otherAddress,
                    thirdAddress,
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferFromIncorrectOwner'
            )
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as not owner nor approved nor operator THEN reverts with CallerNotOwnerNorApproved', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
            await expect(
                erc721.connect(other)[
                    // eslint-disable-next-line no-unexpected-multiline
                    'safeTransferFrom(address,address,uint256)'
                ](ownerAddress, thirdAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom as operator (isApprovedForAll) THEN succeeds', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)

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
            await erc721.mint(ownerAddress, 1)
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

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract not implementing IERC721Receiver THEN fails', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
            const ERC721BadReceiver = await ethers.getContractFactory(
                'ERC721BadReceiverMock'
            )
            const badReceiver = await ERC721BadReceiver.deploy()
            await badReceiver.waitForDeployment()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    await badReceiver.getAddress(),
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract returning wrong selector in onERC721Received THEN fails', async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
            const ERC721WrongReceiver = await ethers.getContractFactory(
                'ERC721WrongReceiverMock'
            )
            const wrongReceiver = await ERC721WrongReceiver.deploy()
            await wrongReceiver.waitForDeployment()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    await wrongReceiver.getAddress(),
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })
    })

    describe('Metadata and Interface Support', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN an ERC721 WHEN tokenURI is called THEN returns empty string', async () => {
            await erc721.mint(ownerAddress, 1)
            expect(await erc721.tokenURI(1)).to.equal('')
        })

        it('GIVEN an ERC721 WHEN baseURI is called THEN returns empty string', async () => {
            expect(await erc721.baseURI()).to.equal('')
        })

        it('GIVEN a direct ERC721.sol deployment WHEN supportsInterface is called THEN does not revert', async () => {
            const ERC721 = await ethers.getContractFactory('ERC721')
            const contract = await ERC721.deploy()
            await contract.waitForDeployment()
            await expect(contract.supportsInterface('0x01ffc9a7')).to.not.be
                .reverted
        })
    })
})
