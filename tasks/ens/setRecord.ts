import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setRecord } from '../../scripts/ens/setRecord'

/**
 npx hardhat ensSetRecord --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --owner "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --resolver "0x1234567890123456789012345678901234567890" \
  --ttl 3600 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensSetRecord',
    'Sets the complete record data for a node in a single atomic operation'
)
    .addParam('node', 'The node hash to update', undefined, types.string)
    .addParam('owner', 'The new owner address', undefined, types.string)
    .addParam(
        'resolver',
        'The new resolver contract address',
        undefined,
        types.string
    )
    .addParam('ttl', 'The new TTL value in seconds', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, owner, resolver, ttl, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setRecord(node, owner, resolver, ttl, diamond, signatureProvider)
    })
