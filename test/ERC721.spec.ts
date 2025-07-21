import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { ERC721TestWrapper } from '../typechain-types'
import { ERC721_RESOLVER_KEY } from './constants'
import { deployERC721 } from './initialization'

describe('ERC721', function () {
    const name = 'ISBE NFT'
    const symbol = 'ISBENFT'

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
        // Opcional: comprobar businessIdIntrospection
        expect(await erc721.businessIdIntrospection()).to.equal(
            ERC721_RESOLVER_KEY
        )
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

        it('GIVEN an ERC721 WHEN burn a token THEN totalSupply decreases and ownerOf fails', async () => {
            await expect(erc721.burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ownerAddress, ethers.ZeroAddress, 1)
            expect(await erc721.totalSupply()).to.equal(0)
            await expect(erc721.ownerOf(1)).to.be.reverted
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
    })

    describe('Approvals', () => {
        beforeEach(async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
        })

        it('GIVEN an ERC721 WHEN approve as owner THEN succeeds', async () => {
            await expect(erc721.approve(otherAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(ownerAddress, otherAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(otherAddress)
        })

        it('GIVEN an ERC721 WHEN setApprovalForAll THEN isApprovedForAll is true', async () => {
            await expect(erc721.setApprovalForAll(otherAddress, true))
                .to.emit(erc721, 'ApprovalForAll')
                .withArgs(ownerAddress, otherAddress, true)
            expect(await erc721.isApprovedForAll(ownerAddress, otherAddress)).to
                .be.true
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
    })

    describe('safeTransferFrom', () => {
        let receiver: Contract

        beforeEach(async () => {
            await deploy(true)
            await erc721.mint(ownerAddress, 1)
            const ERC721Receiver =
                await ethers.getContractFactory('ERC721ReceiverMock')
            receiver = await ERC721Receiver.deploy()
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

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract implementing IERC721Receiver THEN succeeds', async () => {
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    receiver.address,
                    1
                )
            ).to.emit(erc721, 'Transfer')
            expect(await erc721.ownerOf(1)).to.equal(receiver.address)
        })

        it('GIVEN an ERC721 WHEN safeTransferFrom to contract not implementing IERC721Receiver THEN fails', async () => {
            const BadReceiver = await ethers.getContractFactory(
                'ERC721BadReceiverMock'
            )
            const badReceiver = await BadReceiver.deploy()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    ownerAddress,
                    badReceiver.address,
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })
    })

    describe('Metadata', () => {
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
    })

    describe('Introspection', () => {
        beforeEach(async () => {
            await deploy(true)
        })

        it('GIVEN an ERC721 WHEN interfacesIntrospection is called THEN returns interfaces', async () => {
            const interfaces = await erc721.interfacesIntrospection()
            expect(interfaces.length).to.be.greaterThan(0)
        })

        it('GIVEN an ERC721 WHEN businessIdIntrospection is called THEN returns businessId', async () => {
            expect(await erc721.businessIdIntrospection()).to.not.equal(
                ethers.ZeroAddress
            )
        })

        it('GIVEN an ERC721 WHEN selectorsIntrospection is called THEN returns selectors', async () => {
            const selectors = await erc721.selectorsIntrospection()
            expect(selectors.length).to.be.greaterThan(0)
        })
    })
})
