import { task } from 'hardhat/config'
import { getRevisionAttribute } from '../../../scripts/identity/trustedissuersregistry/getRevisionAttribute'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getRevisionAttribute --network localhost \
 --did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --attribute-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --revision-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task('getRevisionAttribute', 'Retrieves specific attribute revision data')
    .addParam('did', "The issuer's decentralised identifier (bytes32)")
    .addParam('attributeId', 'The attribute identifier (bytes32)')
    .addParam('revisionId', 'The revision identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { did, diamond, attributeId, revisionId } = taskArgs
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getRevisionAttribute(
            diamond,
            signer,
            did,
            attributeId,
            revisionId
        )
        console.log('attribute:', JSON.stringify(result, null, 2))
    })
