import { task } from 'hardhat/config'
import { getIssuerAttributes } from '../../../scripts/identity/trustedissuersregistry/getIssuerAttributes'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getIssuerAttributes --network localhost \
 --page 1 \
 --page-size 10 \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task('getIssuerAttributes', 'Retrieves paginated list of issuer attributes')
    .addParam('page', 'Zero-indexed page number (uint256)')
    .addParam('pageSize', 'Maximum items per page (uint256)')
    .addParam('did', "Issuer's decentralised identifier")
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { page, pageSize, did, diamond } = taskArgs
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getIssuerAttributes(
            diamond,
            signer,
            did,
            BigInt(page),
            BigInt(pageSize)
        )
        console.log('items:', result.items)
        console.log('total:', result.total.toString())
        console.log('howMany:', result.howMany.toString())
        console.log('prev:', result.prev.toString())
        console.log('next:', result.next.toString())
    })
