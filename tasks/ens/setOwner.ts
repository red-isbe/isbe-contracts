import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setOwner } from '../../scripts/ens/setOwner'

/**
 npx hardhat ensSetOwner --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --owner "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensSetOwner', 'Sets the owner of an ENS node')
    .addParam(
        'node',
        'The node hash to transfer ownership',
        undefined,
        types.string
    )
    .addParam('owner', 'The new owner address', undefined, types.string)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, owner, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setOwner(node, owner, diamond, signatureProvider)
    })
