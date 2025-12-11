import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setTTL } from '../../scripts/ens/setTTL'

/**
 npx hardhat ensSetTTL --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --ttl 3600 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensSetTTL', 'Sets the TTL (time-to-live) of an ENS node')
    .addParam('node', 'The node hash to update', undefined, types.string)
    .addParam('ttl', 'The new TTL value in seconds', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, ttl, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setTTL(node, ttl, diamond, signatureProvider)
    })
