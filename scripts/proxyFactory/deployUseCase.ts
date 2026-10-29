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
import { BigNumberish, Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytes, isValidBytesAndLength } from '../utils/validation'
import { Rbac } from './interfaces'
import { ProxyFactoryFacet__factory } from '../../typechain-types'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { DEFAULT_TX_GAS_LIMIT } from '../../utils/constants'

type UseCaseDeployment = {
    configurationId: string
    version: BigNumberish
    rbacs: Rbac[]
    proxy: string
}

/**
 * Deploys a use case signing with the given signature provider.
 * secp256k1 providers (local key or KMS) use the ethers Signer flow;
 * secp256r1 providers (local key or KMS) send a raw transaction through
 * the provider, since ethers' standard flow assumes secp256k1 signatures.
 */
export async function deployUseCaseWithSignatureProvider(
    configId: string,
    configVersion: number,
    roles: string[],
    members: string[][],
    initBusinessIds: string[],
    initData: string[],
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<UseCaseDeployment> {
    if (signatureProvider.getCurveType() !== 'secp256r1') {
        return deployUseCase(
            configId,
            configVersion,
            roles,
            members,
            initBusinessIds,
            initData,
            factory,
            await signatureProvider.getSigner()
        )
    }

    const initRbacs = buildInitRbacs(
        configId,
        roles,
        members,
        initBusinessIds,
        initData
    )
    const proxyFactory = ProxyFactoryFacet__factory.createInterface()

    const tx = await signatureProvider.sendTransaction({
        to: factory,
        data: proxyFactory.encodeFunctionData('deployUseCase', [
            configId,
            configVersion,
            initRbacs,
            false,
            initBusinessIds,
            initData,
        ]),
        gasLimit: DEFAULT_TX_GAS_LIMIT,
    })
    const receipt = await signatureProvider.waitForTransaction(tx.hash)
    if (!receipt || receipt.status !== 1) {
        throw new Error(`Failed to deploy use case: tx ${tx.hash} reverted`)
    }

    for (const log of receipt.logs) {
        const parsed = proxyFactory.parseLog(log)
        if (parsed?.name === 'UseCaseDeployed') {
            const { configurationId, version, rbacs, proxy } = parsed.args
            return {
                configurationId,
                version: version.toString(),
                rbacs,
                proxy,
            }
        }
    }
    throw new Error(
        `Failed to deploy use case: no UseCaseDeployed event in tx ${tx.hash}`
    )
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use deployUseCaseWithSignatureProvider
 */
export async function deployUseCase(
    configId: string,
    configVersion: number,
    roles: string[],
    members: string[][],
    initBusinessIds: string[],
    initData: string[],
    factory: string,
    signer: Signer
): Promise<UseCaseDeployment> {
    console.warn(
        '⚠️  Using legacy deployUseCase - consider switching to signature provider version'
    )
    const initRbacs = buildInitRbacs(
        configId,
        roles,
        members,
        initBusinessIds,
        initData
    )

    const proxyFactory = await getIsbeFactory(factory, signer)

    try {
        const tx = await proxyFactory.deployUseCase(
            configId,
            configVersion,
            initRbacs,
            false,
            initBusinessIds,
            initData
        )

        const deployedEvent = await getEvent(
            'UseCaseDeployed',
            tx,
            proxyFactory
        )

        const { configurationId, version, rbacs, proxy } = deployedEvent.args

        return {
            configurationId,
            version: version.toString(),
            rbacs,
            proxy,
        }
    } catch (error) {
        console.error('Failed to deploy use case:', error)
        throw new Error(`Failed to deploy use case: ${error}`)
    }
}

function buildInitRbacs(
    configId: string,
    roles: string[],
    members: string[][],
    initBusinessIds: string[],
    initData: string[]
): Rbac[] {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid config Id format : ' + configId)

    if (initBusinessIds.length !== initData.length)
        throw Error('initBusinessIds and initData length not the same')

    for (let i = 0; i < initBusinessIds.length; i++) {
        if (!isValidBytesAndLength(initBusinessIds[i], 32))
            throw new Error(
                'Invalid init business Id format : ' + initBusinessIds[i]
            )

        if (initData.length > 2 && !isValidBytes(initData[i]))
            throw new Error('Invalid init data format : ' + initData[i])
    }

    if (roles.length !== members.length)
        throw Error('roles and members length not the same')

    const initRbacs: Rbac[] = []

    for (let i = 0; i < roles.length; i++) {
        const role = roles[i]
        if (!isValidBytesAndLength(role, 32))
            throw new Error(`Invalid RBAC role format at index ${i} : ` + role)

        for (let j = 0; j < members[i].length; j++) {
            const member = members[i][j]
            if (!isValidBytesAndLength(member, 20))
                throw new Error(
                    `Invalid RBAC member format at index ${i}, member ${j} : ` +
                        member
                )
        }

        initRbacs.push({
            role,
            members: members[i],
        })
    }

    return initRbacs
}
