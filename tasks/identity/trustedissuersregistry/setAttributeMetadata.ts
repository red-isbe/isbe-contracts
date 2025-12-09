import { task } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { setAttributeMetadata } from '../../../scripts/identity/trustedissuersregistry/setAttributeMetadata'

/**
 * npx hardhat setAttributeMetadata --network localhost \
 *  --did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 *  --issuer-type 1 \
 *  --revision-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 *  --tao-did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 *  --diamond "0x00000000000000000000000000000000000015BE"
 */
task('setAttributeMetadata', 'Sets attribute metadata for a DID')
    .addParam('did', 'The DID identifier (bytes32)')
    .addParam('issuerType', 'The issuer type (number)')
    .addParam('revisionId', 'The revision ID (bytes32)')
    .addParam('taoDid', 'The TAO DID (bytes32)')
    .addParam('attributeIdTao', 'The attribute ID for TAO (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { did, issuerType, revisionId, taoDid, attributeIdTao, diamond } =
            taskArgs

        // Validate issuerType against allowed enum values
        const validIssuerTypes = [0, 1, 2, 3, 4] // NONE, ROOT_TAO, TAO, TI, REVOKED
        if (!validIssuerTypes.includes(Number(issuerType))) {
            throw new Error(
                `Invalid issuerType: ${issuerType}. Allowed values are: ${validIssuerTypes.join(', ')}`
            )
        }

        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        console.log('📋 Setting attribute metadata with parameters:')
        console.log(`   DID: ${did}`)
        console.log(`   Issuer Type: ${issuerType}`)
        console.log(`   Revision ID: ${revisionId}`)
        console.log(`   TAO DID: ${taoDid}`)
        console.log(`   Attribute ID TAO: ${attributeIdTao}`)
        console.log(`   Proxy address: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await setAttributeMetadata(
            did,
            issuerType,
            revisionId,
            taoDid,
            attributeIdTao,
            diamond,
            signatureProvider
        )

        console.log(`\n✅ Attribute metadata set successfully`)
        console.log(`   did: ${result.did}`)
        console.log(`   issuerType: ${result.issuerType}`)
        console.log(`   Revision ID: ${result.revisionId}`)
        console.log(`   TAO DID: ${result.taoDid}`)
        console.log(`   Attribute ID TAO: ${result.attributeIdTao}`)
        console.log(`   New revision ID: ${result.revisionId}`)
        console.log(`   Root TAO did: ${result.rootTaoDid}`)
    })
