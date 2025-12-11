import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setApprovalForAll } from '../../scripts/ens/setApprovalForAll'

/**
 npx hardhat ensSetApprovalForAll --network localhost \
  --operator "0x1234567890123456789012345678901234567890" \
  --approved true \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensSetApprovalForAll',
    "Grants or revokes operator approval for all caller's ENS nodes"
)
    .addParam(
        'operator',
        'The address to grant or revoke permissions',
        undefined,
        types.string
    )
    .addParam(
        'approved',
        'True to grant, false to revoke',
        undefined,
        types.boolean
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { operator, approved, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setApprovalForAll(operator, approved, diamond, signatureProvider)
    })
