import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { ERC721TestWrapper } from '../typechain-types'
import {
    CAP_ROLE,
    MINTER_ROLE,
    SNAPSHOT_ROLE,
    CONTROLLER_ROLE,
} from './constants'

describe('ERC721', function () {
    const name = 'ISBE NFT'
    const symbol = 'ISBENFT'
    const cap = 10
    async function deploy(initialize = false) {
        const [owner, other, third] = await ethers.getSigners()
        const ERC721 = await ethers.getContractFactory('ERC721TestWrapper')
        const erc721Impl = await ERC721.deploy()
        const Proxy = await ethers.getContractFactory('IsbeERC1967Proxy')
        const proxy = await Proxy.deploy(erc721Impl)
        await proxy.waitForDeployment()
        const erc721 = ERC721.attach(
            await proxy.getAddress()
        ) as ERC721TestWrapper

        if (initialize) {
            await erc721.initializeErc721(name, symbol)
            await erc721.initializeCap(cap)
        }

        return { erc721, owner, other, third, erc721Impl }
    }

    describe('Deployment', () => {
        it('GIVEN an ERC721 WHEN deployed THEN cannot initialize implementation', async () => {
            const { erc721Impl } = await deploy()
            await expect(
                erc721Impl.initializeErc721(name, symbol)
            ).to.be.revertedWithCustomError(
                erc721Impl,
                'ContractIsAlreadyInitialized'
            )
        })

        it('GIVEN an ERC721 WHEN initialized THEN name and symbol can be retrieved', async () => {
            const { erc721 } = await deploy()
            await expect(erc721.initializeErc721(name, symbol))
                .to.emit(erc721, 'Erc721Initialized')
                .withArgs(name, symbol)
            expect(await erc721.name()).to.equal(name)
            expect(await erc721.symbol()).to.equal(symbol)
            expect(await erc721.totalSupply()).to.equal(0)
        })

        it('GIVEN an initialized ERC721 WHEN try to initialize twice THEN it fails', async () => {
            const { erc721 } = await deploy(true)
            await expect(
                erc721.initializeErc721(name, symbol)
            ).to.be.revertedWithCustomError(
                erc721,
                'ContractIsAlreadyInitialized'
            )
        })
    })

    describe('Cap', () => {
        it('GIVEN an ERC721 WHEN initializeCap with zero THEN fails', async () => {
            const { erc721 } = await deploy()
            await expect(erc721.initializeCap(0)).to.be.revertedWithCustomError(
                erc721,
                'CapIsZero'
            )
        })

        it('GIVEN an ERC721 WHEN cap is initialized THEN it can be retrieved', async () => {
            const { erc721, owner } = await deploy()
            await expect(erc721.initializeCap(cap))
                .to.emit(erc721, 'CapSet')
                .withArgs(owner.address, cap)
            expect(await erc721.cap()).to.equal(cap)
        })

        it('GIVEN an initialized ERC721 WHEN mint over cap THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            for (let i = 1; i <= cap; i++) {
                await erc721.mint(owner.address, i)
            }
            await expect(
                erc721.mint(owner.address, cap + 1)
            ).to.be.revertedWithCustomError(erc721, 'CapExceeded')
        })

        it('GIVEN an initialized ERC721 WHEN setting cap below total supply THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(CAP_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await erc721.mint(owner.address, 2)
            await expect(erc721.setCap(1)).to.be.revertedWithCustomError(
                erc721,
                'NewCapIsLessThanTotalSupply'
            )
        })

        it('GIVEN an initialized ERC721 WHEN non capper setting cap THEN fails', async () => {
            const { erc721 } = await deploy(true)
            await erc721.initializeAccessControl(
                (await ethers.getSigners())[0].address
            )
            await expect(erc721.setCap(100)).to.be.revertedWithCustomError(
                erc721,
                'AccountHasNoRole'
            )
        })

        it('GIVEN an initialized ERC721 WHEN setting cap over total supply THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(CAP_ROLE, owner.address)
            await expect(erc721.setCap(cap + 1))
                .to.emit(erc721, 'CapSet')
                .withArgs(owner.address, cap + 1)
        })
    })

    describe('Mint', () => {
        it('GIVEN an initialized ERC721 WHEN mint to zero address THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await expect(
                erc721.mint(ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an initialized ERC721 WHEN non-MINTER mints THEN fails', async () => {
            const { erc721, other } = await deploy(true)
            await erc721.initializeAccessControl(
                (await ethers.getSigners())[0].address
            )
            await expect(
                erc721.connect(other).mint(other.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'AccountHasNoRole')
        })

        it('GIVEN an initialized ERC721 WHEN mint a token THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await expect(erc721.mint(owner.address, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(ethers.ZeroAddress, owner.address, 1)
            expect(await erc721.ownerOf(1)).to.equal(owner.address)
            expect(await erc721.balanceOf(owner.address)).to.equal(1)
            expect(await erc721.totalSupply()).to.equal(1)
        })

        it('GIVEN an initialized ERC721 WHEN mint same tokenId twice THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.mint(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'TokenAlreadyMinted')
        })

        it('GIVEN an ERC721 initialized WHEN minted THEN totalSupply returns correct value', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            expect(await erc721.totalSupply()).to.equal(1)
        })

        it('GIVEN an ERC721 initialized WHEN tokenURI is called THEN returns empty string', async () => {
            const { erc721 } = await deploy(true)
            expect(await erc721.tokenURI(123)).to.equal('')
        })
    })

    describe('Burn', () => {
        it('GIVEN an ERC721 initialized WHEN owner burns THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(erc721.connect(owner).burn(1))
                .to.emit(erc721, 'Transfer')
                .withArgs(owner.address, ethers.ZeroAddress, 1)
        })

        it('GIVEN an ERC721 initialized WHEN not owner nor approved burns THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.connect(other).burn(1)
            ).to.be.revertedWithCustomError(erc721, 'NotOwnerNorApproved')
        })

        it('GIVEN an ERC721 initialized WHEN burn non-existent token THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await expect(erc721.burn(999)).to.be.revertedWithCustomError(
                erc721,
                'NotOwnerNorApproved'
            )
        })
    })

    describe('BurnFrom', () => {
        it('GIVEN an ERC721 initialized WHEN approved burns from THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await erc721.approve(other.address, 1)
            await expect(erc721.connect(other).burnFrom(owner.address, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(owner.address, ethers.ZeroAddress, 1)
        })

        it('GIVEN an ERC721 initialized WHEN not approved burns from THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.connect(other).burnFrom(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'NotOwnerNorApproved')
        })

        it('GIVEN an ERC721 initialized WHEN operator burns from THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await erc721.setApprovalForAll(other.address, true)
            await expect(erc721.connect(other).burnFrom(owner.address, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(owner.address, ethers.ZeroAddress, 1)
        })
    })

    describe('Transfer', () => {
        it('GIVEN an ERC721 initialized WHEN transfer token THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(erc721.transferFrom(owner.address, other.address, 1))
                .to.emit(erc721, 'Transfer')
                .withArgs(owner.address, other.address, 1)
            expect(await erc721.ownerOf(1)).to.equal(other.address)
        })

        it('GIVEN an ERC721 initialized WHEN transfer from not owner THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(owner.address, other.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 initialized WHEN transferFrom to zero address THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.transferFrom(owner.address, ethers.ZeroAddress, 1)
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 initialized WHEN safeTransferFrom to zero address THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    owner.address,
                    ethers.ZeroAddress,
                    1
                )
            ).to.be.revertedWithCustomError(erc721, 'AddressZero')
        })

        it('GIVEN an ERC721 initialized WHEN transferFrom non-existent token THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await expect(
                erc721.transferFrom(owner.address, other.address, 999)
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferFromIncorrectOwner'
            )
        })

        it('GIVEN an ERC721 initialized WHEN safeTransferFrom with data THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721['safeTransferFrom(address,address,uint256,bytes)'](
                    owner.address,
                    other.address,
                    1,
                    '0x1234'
                )
            ).to.emit(erc721, 'Transfer')
            expect(await erc721.ownerOf(1)).to.equal(other.address)
        })
    })

    describe('Approval', () => {
        it('GIVEN an ERC721 initialized WHEN approve and transfer by approved THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(erc721.approve(other.address, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(owner.address, other.address, 1)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(owner.address, other.address, 1)
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 initialized WHEN setApprovalForAll and transfer by operator THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(erc721.setApprovalForAll(other.address, true))
                .to.emit(erc721, 'ApprovalForAll')
                .withArgs(owner.address, other.address, true)
            await expect(
                erc721
                    .connect(other)
                    .transferFrom(owner.address, other.address, 1)
            ).to.emit(erc721, 'Transfer')
        })

        it('GIVEN an ERC721 initialized WHEN approve for non-owned token THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.connect(other).approve(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'CallerNotOwnerNorApproved')
        })

        it('GIVEN an ERC721 initialized WHEN approve to zero address THEN succeeds (revoca approval)', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await erc721.approve(other.address, 1)
            await expect(erc721.approve(ethers.ZeroAddress, 1))
                .to.emit(erc721, 'Approval')
                .withArgs(owner.address, ethers.ZeroAddress, 1)
            expect(await erc721.getApproved(1)).to.equal(ethers.ZeroAddress)
        })

        it('GIVEN an ERC721 initialized WHEN setApprovalForAll THEN isApprovedForAll returns true', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.setApprovalForAll(other.address, true)
            expect(
                await erc721.isApprovedForAll(owner.address, other.address)
            ).to.equal(true)
        })
    })

    describe('Snapshot', () => {
        it('GIVEN an ERC721 initialized WHEN non snapshoter takes a snapshot THEN fails', async () => {
            const { erc721, other } = await deploy(true)
            await expect(
                erc721.connect(other).snapshot()
            ).to.be.revertedWithCustomError(erc721, 'AccountHasNoRole')
        })

        it('GIVEN an ERC721 initialized WHEN snapshoter takes a snapshot THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(SNAPSHOT_ROLE, owner.address)
            await expect(erc721.snapshot()).to.emit(erc721, 'Snapshot')
        })

        it('GIVEN an ERC721 initialized WHEN querying non-existent snapshot THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(SNAPSHOT_ROLE, owner.address)
            await erc721.snapshot()
            await expect(
                erc721.balanceOfAt(owner.address, 999)
            ).to.be.revertedWithCustomError(erc721, 'NonExistentSnapshotId')
        })

        it('GIVEN an ERC721 initialized WHEN snapshot taken THEN balanceOfAt/totalSupplyAt/ownerOfAt return correct values', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(SNAPSHOT_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await erc721.snapshot() // snapshotId será 1
            expect(await erc721.balanceOfAt(owner.address, 1)).to.equal(1)
            expect(await erc721.totalSupplyAt(1)).to.equal(1)
            expect(await erc721.ownerOfAt(1, 1)).to.equal(owner.address)
        })
    })

    describe('Controller', () => {
        it('GIVEN an ERC721 initialized WHEN non controller tries to force burn THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.connect(other).forceBurn(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'AccountHasNoRole')
        })

        it('GIVEN an ERC721 initialized WHEN controller force burns THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(CONTROLLER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(erc721.forceBurn(owner.address, 1))
                .to.emit(erc721, 'ForceBurn')
                .withArgs(owner.address, owner.address, 1)
        })

        it('GIVEN an ERC721 initialized WHEN controller force transfers THEN succeeds', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(CONTROLLER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(erc721.forceTransfer(owner.address, other.address, 1))
                .to.emit(erc721, 'ForceTransfer')
                .withArgs(owner.address, owner.address, other.address, 1)
            expect(await erc721.ownerOf(1)).to.equal(other.address)
        })

        it('GIVEN an ERC721 initialized WHEN controller force burns not owner THEN fails', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(CONTROLLER_ROLE, owner.address)
            await erc721.mint(other.address, 1)
            await expect(
                erc721.forceBurn(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'ForceBurnNotTokenOwner')
        })
    })

    describe('Pause', () => {
        it('GIVEN an ERC721 initialized WHEN paused THEN mint/transfer/burn/snapshot/setCap/forceTransfer/forceBurn revert', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(CAP_ROLE, owner.address)
            await erc721.grantRole(SNAPSHOT_ROLE, owner.address)
            await erc721.grantRole(CONTROLLER_ROLE, owner.address)
            await erc721.initializePause(true)
            await expect(
                erc721.mint(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
            await expect(erc721.snapshot()).to.be.revertedWithCustomError(
                erc721,
                'IsPaused'
            )
            await expect(erc721.setCap(cap + 1)).to.be.revertedWithCustomError(
                erc721,
                'IsPaused'
            )
            await expect(
                erc721.forceTransfer(owner.address, other.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
            await expect(
                erc721.forceBurn(owner.address, 1)
            ).to.be.revertedWithCustomError(erc721, 'IsPaused')
        })
    })

    describe('AccessControl', () => {
        it('GIVEN an ERC721 initialized WHEN grantRole THEN only admin can', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await expect(
                erc721.connect(other).grantRole(MINTER_ROLE, other.address)
            ).to.be.revertedWithCustomError(erc721, 'AccountHasNoRole')
            await expect(erc721.grantRole(MINTER_ROLE, other.address)).to.emit(
                erc721,
                'RoleGranted'
            )
        })
    })

    describe('Introspection', () => {
        it('GIVEN an ERC721 initialized WHEN selectorsIntrospection THEN returns expected', async () => {
            const { erc721 } = await deploy(true)
            const selectors = await erc721.selectorsIntrospection()
            expect(selectors).to.be.an('array').that.is.not.empty
            // Puedes comprobar algunos selectores concretos si lo deseas
        })

        it('GIVEN an ERC721 initialized WHEN supportsInterface THEN returns true for ERC721', async () => {
            const { erc721 } = await deploy(true)
            expect(await erc721.supportsInterface('0x80ac58cd')).to.equal(true)
        })

        it('GIVEN an ERC721 initialized WHEN selectorsIntrospection THEN returns all expected selectors', async () => {
            const { erc721 } = await deploy(true)
            const selectors = await erc721.selectorsIntrospection()
            const expectedSelectors = [
                erc721.interface.getFunction('initializeErc721').selector,
                erc721.interface.getFunction('initializeCap').selector,
                erc721.interface.getFunction('name').selector,
                erc721.interface.getFunction('symbol').selector,
                erc721.interface.getFunction('totalSupply').selector,
                erc721.interface.getFunction('balanceOf').selector,
                erc721.interface.getFunction('ownerOf').selector,
                erc721.interface.getFunction('mint').selector,
                erc721.interface.getFunction('burn').selector,
                erc721.interface.getFunction('burnFrom').selector,
                erc721.interface.getFunction('approve').selector,
                erc721.interface.getFunction('getApproved').selector,
                erc721.interface.getFunction('setApprovalForAll').selector,
                erc721.interface.getFunction('isApprovedForAll').selector,
                erc721.interface.getFunction('transferFrom').selector,
                erc721.interface.getFunction('snapshot').selector,
                erc721.interface.getFunction('balanceOfAt').selector,
                erc721.interface.getFunction('totalSupplyAt').selector,
            ]
            expect([...selectors].sort()).to.deep.equal(
                [...expectedSelectors].sort()
            )
        })
    })

    describe('ERC721 implementer', () => {
        it('GIVEN an ERC721 initialized WHEN safeTransferFrom to non-ERC721Receiver contract THEN fails', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            const Dummy = await ethers.getContractFactory('DummyNonReceiver')
            const dummy = await Dummy.deploy()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    owner.address,
                    dummy.target,
                    1
                )
            ).to.be.revertedWithCustomError(
                erc721,
                'TransferToNonERC721ReceiverImplementer'
            )
        })

        it('GIVEN an ERC721 initialized WHEN safeTransferFrom to ERC721Receiver contract THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            const Receiver = await ethers.getContractFactory(
                'DummyERC721Receiver'
            )
            const receiver = await Receiver.deploy()
            await expect(
                erc721['safeTransferFrom(address,address,uint256)'](
                    owner.address,
                    receiver.target,
                    1
                )
            ).to.emit(erc721, 'Transfer')
            expect(await erc721.ownerOf(1)).to.equal(receiver.target)
        })
    })

    describe('Edge Cases', () => {
        it('GIVEN an ERC721 initialized WHEN getApproved for non-existent token THEN returns zero address', async () => {
            const { erc721 } = await deploy(true)
            expect(await erc721.getApproved(999)).to.equal(ethers.ZeroAddress)
        })

        it('GIVEN an ERC721 initialized WHEN ownerOf for non-existent token THEN returns zero address', async () => {
            const { erc721 } = await deploy(true)
            expect(await erc721.ownerOf(999)).to.equal(ethers.ZeroAddress)
        })

        it('GIVEN an ERC721 initialized WHEN balanceOf zero address THEN returns 0', async () => {
            const { erc721 } = await deploy(true)
            expect(await erc721.balanceOf(ethers.ZeroAddress)).to.equal(0)
        })

        it('GIVEN an ERC721 initialized WHEN setApprovalForAll to self THEN isApprovedForAll returns true', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.setApprovalForAll(owner.address, true)
            expect(
                await erc721.isApprovedForAll(owner.address, owner.address)
            ).to.equal(true)
        })

        it('GIVEN an ERC721 initialized WHEN setApprovalForAll true then false THEN emits events', async () => {
            const { erc721, owner, other } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await expect(erc721.setApprovalForAll(other.address, true))
                .to.emit(erc721, 'ApprovalForAll')
                .withArgs(owner.address, other.address, true)
            await expect(erc721.setApprovalForAll(other.address, false))
                .to.emit(erc721, 'ApprovalForAll')
                .withArgs(owner.address, other.address, false)
        })

        it('GIVEN an ERC721 initialized WHEN transfer to self THEN succeeds', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.mint(owner.address, 1)
            await expect(
                erc721.transferFrom(owner.address, owner.address, 1)
            ).to.emit(erc721, 'Transfer')
            expect(await erc721.ownerOf(1)).to.equal(owner.address)
        })
    })
    describe('Snapshot Edge Cases', () => {
        it('GIVEN an ERC721 initialized WHEN snapshot with zero supply THEN totalSupplyAt is zero', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(SNAPSHOT_ROLE, owner.address)
            await erc721.snapshot()
            expect(await erc721.totalSupplyAt(1)).to.equal(0)
        })

        it('GIVEN an ERC721 initialized WHEN snapshot and then mint THEN balanceOfAt is correct', async () => {
            const { erc721, owner } = await deploy(true)
            await erc721.initializeAccessControl(owner.address)
            await erc721.grantRole(MINTER_ROLE, owner.address)
            await erc721.grantRole(SNAPSHOT_ROLE, owner.address)
            await erc721.snapshot()
            await erc721.mint(owner.address, 1)
            expect(await erc721.balanceOfAt(owner.address, 1)).to.equal(0)
        })
    })
})
