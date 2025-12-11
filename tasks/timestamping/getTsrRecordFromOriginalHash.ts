import { task, types } from 'hardhat/config'
import { getTsrRecordFromOriginalHash } from '../../scripts/timestamping/getTsrRecordFromOriginalHash'

/**
 npx hardhat getTsrRecordFromOriginalHash --network localhost \
  --original-hash "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'getTsrRecordFromOriginalHash',
    'Gets the complete TSR record for a given original hash'
)
    .addParam(
        'originalHash',
        'The original hash to query (primary key)',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { originalHash, diamond } = taskArgs

        await getTsrRecordFromOriginalHash(
            originalHash,
            diamond,
            hre.ethers.provider
        )
    })
