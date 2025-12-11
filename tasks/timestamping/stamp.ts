import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { stamp } from '../../scripts/timestamping/stamp'

/**
 npx hardhat stamp --network localhost \
  --original-hash "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee" \
  --tsa-hash "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891" \
  --external-reference-id "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654322" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('stamp', 'Stamps a hash set in the TimeStampingRegistry')
    .addParam(
        'originalHash',
        'The original hash to be stamped (primary key)',
        undefined,
        types.string
    )
    .addParam(
        'tsaHash',
        'The TimeStamping Authority response hash',
        undefined,
        types.string
    )
    .addParam(
        'externalReferenceId',
        'The external reference ID associated with the hashes',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { originalHash, tsaHash, externalReferenceId, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await stamp(
            originalHash,
            tsaHash,
            externalReferenceId,
            diamond,
            signatureProvider
        )
    })
