import { task } from 'hardhat/config'
import { getIssuerAttributeRevisions } from '../../../scripts/identity/trustedissuersregistry/getIssuerAttributeRevisions'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getIssuerAttributeRevisions --network localhost \
 --page 1 \
 --page-size 10 \
 --diamond "0x00000000000000000000000000000000000015BE" \
 --did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --any-attr-vers-hash "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1"
 */
task(
    'getIssuerAttributeRevisions',
    'Retrieves paginated list of issuer attributes'
)
    .addParam('page', 'Zero-indexed page number (uint256)')
    .addParam('pageSize', 'Maximum items per page (uint256)')
    .addParam('did', "Issuer's decentralised identifier")
    .addParam('anyAttrVersHash', 'Any attribute version hash')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { page, pageSize, did, anyAttrVersHash, diamond } = taskArgs
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getIssuerAttributeRevisions(
            diamond,
            signer,
            did,
            anyAttrVersHash,
            BigInt(page),
            BigInt(pageSize)
        )
        console.log('items:', result.items)
        console.log('total:', result.total.toString())
        console.log('howMany:', result.howMany.toString())
        console.log('prev:', result.prev.toString())
        console.log('next:', result.next.toString())
    })
