import { task, types } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { deployUseCase } from '../../scripts/proxyFactory/deployUseCase'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat deployUseCase --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --config-version 1 \
  --rbac-roles '["0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1"]' \
  --rbac-members '[["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]]' \
  --init-business-id "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --init-data "0x" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('deployUseCase', 'Sets config')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The configuration version')
    .addParam('rbacRoles', 'The initialial RBAC roles', undefined, types.json)
    .addParam(
        'rbacMembers',
        'The initialial RBAC members',
        undefined,
        types.json
    )
    .addParam(
        'initBusinessId',
        'The initialization business ids',
        undefined,
        types.json
    )
    .addParam('initData', 'The initialization data', undefined, types.json)
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                configVersion: number
                rbacRoles: string[]
                rbacMembers: string[][]
                initBusinessId: string[]
                initData: string[]
                factory: string
            },
            hre
        ) => {
            const {
                configId,
                configVersion,
                rbacRoles,
                rbacMembers,
                initBusinessId,
                initData,
                factory,
            } = taskArgs

            const signer = await getSigner(hre)

            const result = await deployUseCase(
                configId,
                configVersion,
                rbacRoles,
                rbacMembers,
                initBusinessId,
                initData,
                factory,
                signer
            )

            console.log('Deployed Use Case result:')
            console.log('    Configuration ID:', result.configurationId)
            console.log('    Version:', result.version)
            console.log('    RBACs:', JSON.stringify(result.rbacs))
            console.log('    Proxy Address:', result.proxy)
        }
    )
