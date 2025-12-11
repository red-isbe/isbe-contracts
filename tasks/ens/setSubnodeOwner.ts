import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setSubnodeOwner } from '../../scripts/ens/setSubnodeOwner'

/**
 npx hardhat ensSetSubnodeOwner --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --label "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  --owner "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensSetSubnodeOwner',
    'Creates a subnode or transfers ownership of an existing subnode'
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
        'The new owner address for the subnode',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, label, owner, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setSubnodeOwner(node, label, owner, diamond, signatureProvider)
    })
