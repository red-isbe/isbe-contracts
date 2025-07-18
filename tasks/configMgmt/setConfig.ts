import { task, types } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { setConfig } from '../../scripts/configMgmt/setConfig'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat setConfig --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --business-ids '["0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a", "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157"]' \
  --versions '[1,1]' \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('setConfig', 'Sets config')
    .addParam('configId', 'The configuration ID')
    .addParam('businessIds', 'The array of business ids', undefined, types.json)
    .addParam('versions', 'The array of version number', undefined, types.json)
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                businessIds: string[]
                versions: number[]
                factory: string
            },
            hre
        ) => {
            const { configId, businessIds, versions, factory } = taskArgs

            const signer = await getSigner(hre)

            const result = await setConfig(
                configId,
                businessIds,
                versions,
                factory,
                signer
            )

            console.log('Set Configuration result:' + result)
        }
    )
