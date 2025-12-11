/**
 * Task: getNetworkEllipticType
 * Queries the network's configured elliptic type from the DiDRegistryInitialized event
 *
 * Usage:
 *   npx hardhat didDocument:getNetworkEllipticType --diamond <address>
 */
import { task } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getNetworkEllipticType } from '../../scripts/didDocument/getNetworkEllipticType'

task(
    'didDocument:getNetworkEllipticType',
    'Get the network elliptic type the DID Registry was initialized with'
)
    .addParam('diamond', 'Diamond contract address')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { diamond } = taskArgs
        return getNetworkEllipticType(diamond, hre.ethers.provider)
    })
