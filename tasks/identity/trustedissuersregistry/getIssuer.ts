import { task } from 'hardhat/config'
import { getIssuer } from '../../../scripts/identity/trustedissuersregistry/getIssuer'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getIssuer --network localhost \
 --did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task('getIssuer', 'Retrieves issuer information by decentralised identifier')
    .addParam('did', "The issuer's decentralised identifier (bytes32)")
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { did, diamond } = taskArgs
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getIssuer(diamond, signer, did)
        console.log('noAttributesAccepted:', result.noAttributesAccepted)
        console.log('totalAttributes:', result.totalAttributes.toString())
    })
