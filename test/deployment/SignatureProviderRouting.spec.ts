/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { expect } from 'chai'
import hre, { ethers } from 'hardhat'
import { Signer, TransactionRequest } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployGovernance } from '../fixtures/governance'
import { CONFIGURATION_ID_PROXY_TESTS } from '../../utils/constants'
import { deployAllFacets } from '../../scripts/deployment/deployAllFacets'
import { deployUseCaseWithSignatureProvider } from '../../scripts/proxyFactory/deployUseCase'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { Secp256k1SignatureProvider } from '../../tasks/deployment/providers/Secp256k1SignatureProvider'
import { KmsSignatureProvider } from '../../tasks/deployment/providers/KmsSignatureProvider'
import { Secp256r1SignatureProvider } from '../../tasks/deployment/providers/Secp256r1SignatureProvider'
import { KmsSecp256r1SignatureProvider } from '../../tasks/deployment/providers/KmsSecp256r1SignatureProvider'

/**
 * The Hardhat network only accepts secp256k1 signatures and there is no AWS KMS
 * in tests, so KMS signers and secp256r1 raw transactions are replaced by the
 * default Hardhat signer. What is under test is which provider operation each
 * flow uses: the ethers Signer for secp256k1, raw-transaction operations
 * (deployContract / sendTransaction) for secp256r1.
 */
type Calls = {
    getSigner: number
    deployContract: number
    sendTransaction: number
}

function track(provider: ISignatureProvider, signer: Signer, rawTx: boolean) {
    const calls: Calls = { getSigner: 0, deployContract: 0, sendTransaction: 0 }

    provider.getSigner = async () => {
        calls.getSigner++
        if (rawTx) {
            throw new Error('secp256r1 must not use the ethers Signer flow')
        }
        return signer
    }
    provider.deployContract = async (_name: string, bytecode: string) => {
        calls.deployContract++
        const tx = await signer.sendTransaction({ data: bytecode })
        return (await tx.wait())!.contractAddress!
    }
    provider.sendTransaction = async (tx: TransactionRequest) => {
        calls.sendTransaction++
        return signer.sendTransaction(tx)
    }

    return calls
}

const CASES = [
    {
        name: 'secp256k1 local key',
        create: () => new Secp256k1SignatureProvider(hre),
        rawTx: false,
    },
    {
        name: 'secp256k1 AWS KMS',
        create: () => new KmsSignatureProvider(hre),
        rawTx: false,
    },
    {
        name: 'secp256r1 local key',
        create: () => new Secp256r1SignatureProvider(hre),
        rawTx: true,
    },
    {
        name: 'secp256r1 AWS KMS',
        create: () => new KmsSecp256r1SignatureProvider(hre),
        rawTx: true,
    },
]

describe('Signature provider routing', function () {
    async function deployFixture() {
        const [admin] = await ethers.getSigners()
        const { governanceContract } = await deployGovernance(
            admin,
            [],
            CONFIGURATION_ID_PROXY_TESTS
        )
        return { admin, factory: await governanceContract.getAddress() }
    }

    for (const { name, create, rawTx } of CASES) {
        describe(name, function () {
            it(`GIVEN a ${name} provider WHEN deploying facets THEN it uses the ${rawTx ? 'raw-transaction' : 'ethers Signer'} flow`, async () => {
                const [admin] = await ethers.getSigners()
                const provider = create()
                const calls = track(provider, admin, rawTx)

                const result = await deployAllFacets(
                    hre,
                    ['DiamondLoupeFacet'],
                    undefined,
                    provider
                )

                expect(result.facetAddresses).to.have.length(1)
                expect(
                    await ethers.provider.getCode(result.facetAddresses[0])
                ).to.not.equal('0x')
                expect(calls.deployContract).to.equal(rawTx ? 1 : 0)
                expect(calls.getSigner).to.equal(rawTx ? 0 : 1)
            })

            it(`GIVEN a ${name} provider WHEN deploying a use case THEN it uses the ${rawTx ? 'raw-transaction' : 'ethers Signer'} flow`, async () => {
                const { admin, factory } = await loadFixture(deployFixture)
                const provider = create()
                const calls = track(provider, admin, rawTx)

                const result = await deployUseCaseWithSignatureProvider(
                    CONFIGURATION_ID_PROXY_TESTS,
                    1,
                    [],
                    [],
                    [],
                    [],
                    factory,
                    provider
                )

                expect(result.configurationId).to.equal(
                    CONFIGURATION_ID_PROXY_TESTS
                )
                expect(result.version).to.equal('1')
                expect(
                    await ethers.provider.getCode(result.proxy)
                ).to.not.equal('0x')
                expect(calls.sendTransaction).to.equal(rawTx ? 1 : 0)
                expect(calls.getSigner).to.equal(rawTx ? 0 : 1)
            })
        })
    }

    it('GIVEN a secp256r1 provider WHEN the use case transaction reverts THEN it fails with a clear error', async () => {
        const { admin, factory } = await loadFixture(deployFixture)
        const provider = new Secp256r1SignatureProvider(hre)
        track(provider, admin, true)

        await expect(
            deployUseCaseWithSignatureProvider(
                CONFIGURATION_ID_PROXY_TESTS,
                99,
                [],
                [],
                [],
                [],
                factory,
                provider
            )
        ).to.be.rejectedWith(/Failed to deploy use case|reverted/)
    })
})
