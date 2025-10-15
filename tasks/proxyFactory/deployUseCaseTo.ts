import { task, types } from 'hardhat/config'

import { deployUseCaseTo } from '../../scripts/proxyFactory/deployUseCaseTo'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat deployUseCaseTo --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --config-version 1 \
  --rbac-roles '["0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1"]' \
  --rbac-members '[["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]]' \
  --init-business-id "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --init-data "0x" \
  --salt "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('deployUseCaseTo', 'Sets config')
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
    .addParam('salt', 'The salt to use for deployment')
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
                salt: string
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
                salt,
                factory,
            } = taskArgs

            const signer = await getSigner(hre)

            const result = await deployUseCaseTo(
                configId,
                configVersion,
                rbacRoles,
                rbacMembers,
                initBusinessId,
                initData,
                salt,
                factory,
                signer
            )

            console.log('Deployed Use Case To result:')
            console.log('    Configuration ID:', result.configurationId)
            console.log('    Version:', result.version)
            console.log('    RBACs:', JSON.stringify(result.rbacs))
            console.log('    Proxy Address:', result.proxy)
        }
    )
