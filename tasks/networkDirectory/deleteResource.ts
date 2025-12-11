import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { deleteResource } from '../../scripts/networkDirectory/deleteResource'

/**
 npx hardhat deleteResource --network localhost \
  --chain-id 2024 \
  --resource-id "RPC" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('deleteResource', 'Deletes a resource from a network')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam(
        'resourceId',
        'The resource identifier to delete (string or bytes32)'
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, resourceId, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await deleteResource(chainId, resourceId, diamond, signatureProvider)
    })
