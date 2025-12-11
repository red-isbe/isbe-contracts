import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setSubnodeRecord } from '../../scripts/ens/setSubnodeRecord'

/**
 npx hardhat ensSetSubnodeRecord --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --label "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  --owner "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --resolver "0x1234567890123456789012345678901234567890" \
  --ttl 3600 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensSetSubnodeRecord',
    'Creates or updates a subnode with complete record information'
)
    .addParam('node', 'The parent node hash', undefined, types.string)
    .addParam(
        'label',
        'The label hash for the subdomain',
        undefined,
        types.string
    )
    .addParam(
        'owner',
        'The owner address for the subnode',
        undefined,
        types.string
    )
    .addParam(
        'resolver',
        'The resolver contract address',
        undefined,
        types.string
    )
    .addParam('ttl', 'The TTL value in seconds', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, label, owner, resolver, ttl, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setSubnodeRecord(
            node,
            label,
            owner,
            resolver,
            ttl,
            diamond,
            signatureProvider
        )
    })
