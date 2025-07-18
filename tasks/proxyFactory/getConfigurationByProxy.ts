import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getConfigurationByProxy } from '../../scripts/proxyFactory/getConfigurationByProxy'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getConfigurationByProxy --network localhost \
  --proxy-address "0xF8698093eF2A86718040fabcaCaf8bf556911301" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('getConfigurationByProxy', 'Returns full config')
    .addParam('proxyAddress', 'The address of the proxy')
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                proxyAddress: string
                factory: string
            },
            hre
        ) => {
            const { proxyAddress, factory } = taskArgs

            const signer = await getSigner(hre)

            const result = await getConfigurationByProxy(
                proxyAddress,
                factory,
                signer
            )

            console.log('Proxy Configuration:' + JSON.stringify(result))
        }
    )
