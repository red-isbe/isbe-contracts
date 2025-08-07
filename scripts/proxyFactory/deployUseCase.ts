import { BigNumberish, Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytes, isValidBytesAndLength } from '../utils/validation'
import { Rbac } from './interfaces'

export async function deployUseCase(
    configId: string,
    configVersion: number,
    roles: string[],
    members: string[][],
    initBusinessIds: string[],
    initData: string[],
    factory: string,
    signer: Signer
): Promise<{
    configurationId: string
    version: BigNumberish
    rbacs: Rbac[]
    proxy: string
}> {
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

    const proxyFactory = await getIsbeFactory(factory, signer)

    const tx = await proxyFactory.deployUseCase(
        configId,
        configVersion,
        initRbacs,
        false,
        initBusinessIds,
        initData
    )

    const deployedEvent = await getEvent('UseCaseDeployed', tx, proxyFactory)

    const { configurationId, version, rbacs, proxy } = deployedEvent.args

    return {
        configurationId,
        version: version.toString(),
        rbacs,
        proxy,
    }
}
