import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
    Interface,
    keccak256,
    toUtf8Bytes,
    dataSlice,
    FunctionFragment,
} from 'ethers'
import {
    DiamondLoupeFacet,
    AccessControlTestWrapper,
    IAccessControl__factory,
    AccessControlTestWrapper__factory,
} from '../typechain-types'
import { deployAll } from './initialization'
import { FORBIDDEN_ERC165_INTERFACE_ID } from './constants'

const ERC165_INTERFACE_ID = '0x01ffc9a7'
const NON_EXISTING_INTERFACE_ID = '0x00000012'
describe('ERC165', function () {
    let diamondLoupe: DiamondLoupeFacet
    let accessControlTestWrapper: AccessControlTestWrapper
    let AccessControlTestWrapperFactory: AccessControlTestWrapper__factory

    async function deploy() {
        const result = await deployAll()
        diamondLoupe = result.diamondLoupe

        AccessControlTestWrapperFactory = await ethers.getContractFactory(
            'AccessControlTestWrapper'
        )

        accessControlTestWrapper =
            await AccessControlTestWrapperFactory.deploy()
    }

    function getInterfaceId(iface: Interface): string {
        const signatures = iface.fragments
            .filter((f): f is FunctionFragment => f.type === 'function')
            .map((f) => f.format('sighash'))

        const selectors = signatures.map((sig) =>
            dataSlice(keccak256(toUtf8Bytes(sig)), 0, 4)
        )

        let result = 0n

        for (const selector of selectors) {
            // Convert hex string to bigint
            const val = BigInt(selector)
            // XOR with accumulated result
            result ^= val
        }

        return '0x' + result.toString(16).padStart(8, '0')
    }

    describe('Testing ERC165 supportsInterface', function () {
        it('GIVEN ERC165 compliant diamond WHEN checking forbidden interface THEN fails', async function () {
            await deploy()

            const supported = await diamondLoupe.supportsInterface(
                FORBIDDEN_ERC165_INTERFACE_ID
            )

            expect(supported).to.be.false
        })

        it('GIVEN ERC165 compliant contract WHEN checking forbidden interface THEN fails', async function () {
            await deploy()

            const supported = await accessControlTestWrapper.supportsInterface(
                FORBIDDEN_ERC165_INTERFACE_ID
            )

            expect(supported).to.be.false
        })

        it('GIVEN ERC165 compliant diamond WHEN checking non-existing interface THEN fails', async function () {
            await deploy()

            const supported = await diamondLoupe.supportsInterface(
                NON_EXISTING_INTERFACE_ID
            )

            expect(supported).to.be.false
        })

        it('GIVEN ERC165 compliant contract WHEN checking non-existing interface THEN fails', async function () {
            await deploy()

            const supported = await accessControlTestWrapper.supportsInterface(
                NON_EXISTING_INTERFACE_ID
            )

            expect(supported).to.be.false
        })

        it('GIVEN ERC165 compliant diamond WHEN checking erc165 interface THEN success', async function () {
            await deploy()

            const supported =
                await diamondLoupe.supportsInterface(ERC165_INTERFACE_ID)

            expect(supported).to.be.true
        })

        it('GIVEN ERC165 compliant contract WHEN checking erc165 interface THEN success', async function () {
            await deploy()

            const supported =
                await accessControlTestWrapper.supportsInterface(
                    ERC165_INTERFACE_ID
                )

            expect(supported).to.be.true
        })

        it('GIVEN ERC165 compliant diamond WHEN checking existing interface THEN success', async function () {
            await deploy()

            const iface = new Interface(IAccessControl__factory.abi)

            const supported = await diamondLoupe.supportsInterface(
                getInterfaceId(iface)
            )

            expect(supported).to.be.true
        })

        it('GIVEN ERC165 compliant contract WHEN checking existing interface THEN success', async function () {
            await deploy()

            const iface = new Interface(IAccessControl__factory.abi)

            const supported = await accessControlTestWrapper.supportsInterface(
                getInterfaceId(iface)
            )

            expect(supported).to.be.true
        })
    })
})
