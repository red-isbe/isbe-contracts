import { task } from 'hardhat/config'
import { getLatestRevisionAttributeId } from '../../../scripts/identity/trustedissuersregistry/getLatestRevisionAttributeId'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getLatestRevisionAttributeId --network localhost \
 --did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --attribute-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task(
    'getLatestRevisionAttributeId',
    'Retrieves latest revision identifier for an attribute'
)
    .addParam('did', "The issuer's decentralised identifier (bytes32)")
    .addParam('attributeId', 'The attribute identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { did, diamond, attributeId } = taskArgs
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getLatestRevisionAttributeId(
            diamond,
            signer,
            did,
            attributeId
        )
        console.log(
            'latestRevisionAttributeId:',
            result.latestRevisionAttributeId
        )
    })
