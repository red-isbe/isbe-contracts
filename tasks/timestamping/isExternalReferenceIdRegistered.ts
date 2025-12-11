import { task, types } from 'hardhat/config'
import { isExternalReferenceIdRegistered } from '../../scripts/timestamping/isExternalReferenceIdRegistered'

/**
 npx hardhat isExternalReferenceIdRegistered --network localhost \
  --external-reference-id "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'isExternalReferenceIdRegistered',
    'Checks if an external reference ID is registered in the TimeStampingRegistry'
)
    .addParam(
        'externalReferenceId',
        'The external reference ID to check',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { externalReferenceId, diamond } = taskArgs

        await isExternalReferenceIdRegistered(
            externalReferenceId,
            diamond,
            hre.ethers.provider
        )
    })
