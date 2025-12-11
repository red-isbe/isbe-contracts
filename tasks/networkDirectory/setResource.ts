import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setResource } from '../../scripts/networkDirectory/setResource'

/**
 npx hardhat setResource --network localhost \
  --chain-id 2024 \
  --resource-id "RPC2" \
  --resource "https://rpc.alastria.io" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('setResource', 'Sets or updates a resource for a network')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam(
        'resourceId',
        'The resource identifier (string, will be converted to bytes32)'
    )
    .addParam('resource', 'The resource value (URL or string)')
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, resourceId, resource, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await setResource(
            chainId,
            resourceId,
            resource,
            diamond,
            signatureProvider
        )
    })
