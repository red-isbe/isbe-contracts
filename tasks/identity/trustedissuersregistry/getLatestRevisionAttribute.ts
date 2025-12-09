import { task } from 'hardhat/config'
import { getLatestRevisionAttribute } from '../../../scripts/identity/trustedissuersregistry/getLatestRevisionAttribute'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getLatestRevisionAttribute --network localhost \
 --issuer-did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --attribute-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task('getLatestRevisionAttribute', 'Retrieves latest revision of an attribute')
    .addParam('issuerDid', "Issuer's decentralised identifier (bytes32)")
    .addParam('attributeId', 'Attribute identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { issuerDid, diamond, attributeId } = taskArgs // Removed revisionId as it's not needed anymore
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getLatestRevisionAttribute(
            diamond,
            signer,
            issuerDid,
            attributeId
        )
        console.log('attribute:', JSON.stringify(result, null, 2))
    })
