import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { deleteNetwork } from '../../../scripts/client/networkDirectory/deleteNetwork'

/**
 npx hardhat deleteNetwork --network localhost \
  --chain-id 2024 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('deleteNetwork', 'Deletes a network from the NetworkDirectory')
    .addParam(
        'chainId',
        'The chain ID of the network to delete (uint256)',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await deleteNetwork(chainId, diamond, signatureProvider)
    })
