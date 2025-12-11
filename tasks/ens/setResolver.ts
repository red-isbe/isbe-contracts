import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setResolver } from '../../scripts/ens/setResolver'

/**
 npx hardhat ensSetResolver --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --resolver "0x1234567890123456789012345678901234567890" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensSetResolver', 'Sets the resolver of an ENS node')
    .addParam('node', 'The node hash to update', undefined, types.string)
    .addParam(
        'resolver',
        'The new resolver contract address',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, resolver, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setResolver(node, resolver, diamond, signatureProvider)
    })
