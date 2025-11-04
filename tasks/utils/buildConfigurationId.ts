import { task } from 'hardhat/config'
import buildConfigurationId from '../../scripts/utils/buildConfigurationId'

// Task to build configurationId from seed and resolverKeys
/* npx hardhat build-configuration-id \
     --seed 0x0000000000000000000000000000000000000000000000000000000000000020 \
     --resolverkeys 0xc4968fe952eba32a52cb112176a56b4e86a0fbaff835dc8336fa0e804a0af398,0x81c694c8d5a595cfca0b2b486a8e2aff0a72d8063c636a02c1ca1cc12e55d471,0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b,0xed76d446b6029b8a177fda4fc38162d9dc0dc29ab636541fd6e75ae60fe17151
Position for 0xc4968fe952eba32a52cb112176a56b4e86a0fbaff835dc8336fa0e804a0af398: 24
Mask for 0xc4968fe952eba32a52cb112176a56b4e86a0fbaff835dc8336fa0e804a0af398: 0x000000000000002a000000000000000000000000000000000000000000000000
Position for 0x81c694c8d5a595cfca0b2b486a8e2aff0a72d8063c636a02c1ca1cc12e55d471: 17
Mask for 0x81c694c8d5a595cfca0b2b486a8e2aff0a72d8063c636a02c1ca1cc12e55d471: 0x00000000000000000000000000002a0000000000000000000000000000000000
Position for 0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b: 27
Mask for 0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b: 0x000000001e000000000000000000000000000000000000000000000000000000
Position for 0xed76d446b6029b8a177fda4fc38162d9dc0dc29ab636541fd6e75ae60fe17151: 17
Mask for 0xed76d446b6029b8a177fda4fc38162d9dc0dc29ab636541fd6e75ae60fe17151: 0x0000000000000000000000000000620000000000000000000000000000000000
✅ Configuration ID: 0x000000001e00002a000000000000480000000000000000000000000000000020

 */
task(
    'build-configuration-id',
    'Build configurationId from seed and resolverKeys'
)
    .addParam('seed', 'The bytes32 string seed.')
    .addOptionalParam(
        'resolverkeys',
        'The resolver keys as bytes32 strings (comma-separated).',
        ''
    )
    .addOptionalParam('positiondivisor', 'The position divisor to use.', '32')
    .addOptionalParam(
        'loglevel',
        'The logging level to use (silent, info, verbose).',
        'info'
    )
    .setAction(async (taskArgs) => {
        const { seed, resolverkeys, positiondivisor, loglevel } = taskArgs

        // Parse resolverKeys from comma-separated string to array
        const resolverKeysArray = resolverkeys
            ? resolverkeys.split(',').map((key) => key.trim())
            : []

        // Parse positionDivisor as single number
        const positionDivisorNumber = parseInt(positiondivisor) || 32

        const configurationId = buildConfigurationId(
            seed,
            resolverKeysArray,
            positionDivisorNumber,
            loglevel
        )

        if (loglevel !== 'silent') {
            console.log(`✅ Configuration ID: ${configurationId}`)
            console.log('')
        }
    })
