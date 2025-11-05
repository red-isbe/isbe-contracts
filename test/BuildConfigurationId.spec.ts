import { expect } from 'chai'
import { ethers } from 'hardhat'
import buildConfigurationId from '../scripts/utils/buildConfigurationId'
import {
    ERC20_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    ERC20_BURNABLE_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    ERC203643_CONTROLLER_RESOLVER_KEY,
    ERC721_RESOLVER_KEY,
    ERC721_TEST_WRAPPER_RESOLVER_KEY,
    ERC721_BURNABLE_RESOLVER_KEY,
    ERC721_CAPPED_RESOLVER_KEY,
    ERC721_CONTROLLER_RESOLVER_KEY,
    ERC721_SNAPSHOT_RESOLVER_KEY,
    ERC721_ENUMERABLE_RESOLVER_KEY,
    ERC721_ROYALTY_RESOLVER_KEY,
    ERC721_CONSECUTIVE_RESOLVER_KEY,
    ERC3643_METADATA_RESOLVER_KEY,
    ERC3643_FREEZE_RESOLVER_KEY,
    ERC3643_RECOVERY_RESOLVER_KEY,
    ERC3643_COMPLIANCE_RESOLVER_KEY,
    ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
    ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
    OWNABLE_RESOLVER_KEY,
    ASSET_EVENT_TRACKER_RESOLVER_KEY,
    HASH_TIMESTAMP_RESOLVER_KEY,
    MOCK_TIMESTAMP_RESOLVER_KEY,
    CONFIGURATION_ID_ERC20,
    CONFIGURATION_ID_ERC721,
    CONFIGURATION_ID_ERC3643,
} from '../utils/constants'

describe('buildConfigurationId', function () {
    describe('Basic Functionality Tests', function () {
        it('should handle empty resolver keys array', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const result = buildConfigurationId(seed, [])
            expect(result).to.equal(CONFIGURATION_ID_ERC20) // 32-byte hex representation with 0x prefix
        })

        it('should handle single resolver key', async function () {
            const seed = CONFIGURATION_ID_ERC20
            let resolverKey = ERC20_BURNABLE_RESOLVER_KEY
            let expected =
                '0x00000000000000000000000000002a0000000000000000000000000000000020'
            let result = buildConfigurationId(seed, [resolverKey])
            expect(result).to.equal(expected)

            resolverKey = ERC20_RESOLVER_KEY
            expected =
                '0x0000000000000000000000000000000000006a00000000000000000000000020'
            result = buildConfigurationId(seed, [resolverKey])
            expect(result).to.equal(expected)
        })

        it('should handle multiple resolver keys', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [
                ERC20_BURNABLE_RESOLVER_KEY, // 0x00000000000000000000000000002a0000000000000000000000000000000000
                ERC20_RESOLVER_KEY, // 0x0000000000000000000000000000000000006a00000000000000000000000000
            ]
            const result = buildConfigurationId(seed, resolverKeys)

            // The result should be seed AND mask1 AND mask2
            const expected =
                '0x00000000000000000000000000002a0000006a00000000000000000000000020'
            expect(result).to.equal(expected)
        })
    })

    describe('ERC20 Battery Tests', function () {
        it('should build configuration ID for ERC20 with all extensions', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [
                OWNABLE_RESOLVER_KEY,
                ERC20_SNAPSHOT_RESOLVER_KEY,
                ERC20_BURNABLE_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
                ERC203643_CONTROLLER_RESOLVER_KEY,
                ERC20_RESOLVER_KEY,
                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                HASH_TIMESTAMP_RESOLVER_KEY,
                MOCK_TIMESTAMP_RESOLVER_KEY,
            ]
            const result = buildConfigurationId(seed, resolverKeys)

            // Verify it's a valid hex string with 0x prefix
            expect(result).to.match(/^0x[0-9a-f]+$/)

            // The configuration ID built from seed + XOR of all keys
            const expected =
                '0x000000000000002a0000000000002a005a006a00000000600000000000000020'
            expect(result).to.be.equal(expected)
        })

        it('should handle ERC20 resolver keys in different orders', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys1 = [
                ERC20_RESOLVER_KEY, // 0x0000000000000000000000000000000000006a00000000000000000000000000
                ERC20_BURNABLE_RESOLVER_KEY, // 0x00000000000000000000000000002a0000000000000000000000000000000000
            ]
            const resolverKeys2 = [
                ERC20_BURNABLE_RESOLVER_KEY, // 0x00000000000000000000000000002a0000000000000000000000000000000000
                ERC20_RESOLVER_KEY, // 0x0000000000000000000000000000000000006a00000000000000000000000000
            ]

            const result1 = buildConfigurationId(seed, resolverKeys1)
            const result2 = buildConfigurationId(seed, resolverKeys2)

            // Results should be the same regardless of order (AND operation is commutative)
            expect(result1).to.equal(result2)
        })

        it('should verify ERC20 configuration ID matches expected constant', async function () {
            const seed = ethers.ZeroHash
            const resolverKeys = [
                OWNABLE_RESOLVER_KEY,
                ERC20_SNAPSHOT_RESOLVER_KEY,
                ERC20_BURNABLE_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
                ERC203643_CONTROLLER_RESOLVER_KEY,
                ERC20_RESOLVER_KEY,
                ASSET_EVENT_TRACKER_RESOLVER_KEY,
                HASH_TIMESTAMP_RESOLVER_KEY,
                MOCK_TIMESTAMP_RESOLVER_KEY,
            ]
            const result = buildConfigurationId(seed, resolverKeys)

            // This is the XOR of all ERC20 resolver keys
            expect(result).to.be.equal(
                '0x000000000000002a0000000000002a005a006a00000000600000000000000000'
            )
        })
    })

    describe('ERC721 Battery Tests', function () {
        it('should build configuration ID for basic ERC721', async function () {
            const seed = CONFIGURATION_ID_ERC721
            const resolverKeys = [ERC721_RESOLVER_KEY] // 0x000000000000000000000000a000000000000000000000000000000000000000
            const result = buildConfigurationId(seed, resolverKeys)

            // Verify it's a valid hex string with 0x prefix
            expect(result).to.match(/^0x[0-9a-f]+$/)
            expect(result).to.be.equal(
                '0x000000000000000000000000a000000000000000000000000000000000000721'
            )
        })

        it('should build configuration ID for ERC721 with all extensions', async function () {
            const seed = CONFIGURATION_ID_ERC721
            const resolverKeys = [
                ERC721_RESOLVER_KEY, // 0x000000000000000000000000a000000000000000000000000000000000000000
                ERC721_TEST_WRAPPER_RESOLVER_KEY, // 0x0000000000000000000000000000000000000000000000590000000000000000
                ERC721_BURNABLE_RESOLVER_KEY, // 0x0000000000000000000000000000f70000000000000000000000000000000000
                ERC721_CAPPED_RESOLVER_KEY, // 0x0000000000000000000000000000000000000061000000000000000000000000
                ERC721_CONTROLLER_RESOLVER_KEY, // 0x0000000000000000000000000000000000000000000000001300000000000000
                ERC721_SNAPSHOT_RESOLVER_KEY, // 0x0000b00000000000000000000000000000000000000000000000000000000000
                ERC721_ENUMERABLE_RESOLVER_KEY, // 0x00000000000000000000b0000000000000000000000000000000000000000000
                ERC721_ROYALTY_RESOLVER_KEY, // 0x000000000000000000a200000000000000000000000000000000000000000000
                ERC721_CONSECUTIVE_RESOLVER_KEY, // 0x0000000000000000000000980000000000000000000000000000000000000000
            ] // 0x0000b0000000000000a2b098a000f70000000061000000591300000000000721
            const result = buildConfigurationId(seed, resolverKeys)

            // Verify it's a valid hex string with 0x prefix
            expect(result).to.match(/^0x[0-9a-f]+$/)

            // The result should be different from just the seed
            expect(result).to.equal(
                '0x0000b0000000000000a2b098a000f70000000061000000591300000000000721'
            )
        })

        it('should handle ERC721 resolver keys in different orders', async function () {
            const seed = CONFIGURATION_ID_ERC721
            const resolverKeys1 = [
                ERC721_RESOLVER_KEY, // 0x000000000000000000000000a000000000000000000000000000000000000000
                ERC721_BURNABLE_RESOLVER_KEY, // 0x0000000000000000000000000000f70000000000000000000000000000000000
            ]
            const resolverKeys2 = [
                ERC721_BURNABLE_RESOLVER_KEY, // 0x0000000000000000000000000000f70000000000000000000000000000000000
                ERC721_RESOLVER_KEY, // 0x000000000000000000000000a000000000000000000000000000000000000000
            ] // 0x000000000000000000000000a000f70000000000000000000000000000000721

            const result1 = buildConfigurationId(seed, resolverKeys1)
            const result2 = buildConfigurationId(seed, resolverKeys2)

            // Results should be the same regardless of order
            expect(result1).to.equal(result2)
        })

        it('should verify ERC721 configuration ID matches expected constant', async function () {
            const seed = ethers.ZeroHash
            const resolverKeys = [
                ERC721_RESOLVER_KEY,
                ERC721_TEST_WRAPPER_RESOLVER_KEY,
                ERC721_BURNABLE_RESOLVER_KEY,
                ERC721_CAPPED_RESOLVER_KEY,
                ERC721_CONTROLLER_RESOLVER_KEY,
                ERC721_SNAPSHOT_RESOLVER_KEY,
                ERC721_ENUMERABLE_RESOLVER_KEY,
                ERC721_ROYALTY_RESOLVER_KEY,
                ERC721_CONSECUTIVE_RESOLVER_KEY,
            ]
            const result = buildConfigurationId(seed, resolverKeys)
            expect(result).to.be.equal(
                '0x0000b0000000000000a2b098a000f70000000061000000591300000000000000'
            )
        })
    })

    describe('ERC3643 Battery Tests', function () {
        it('should build configuration ID for ERC3643 with all extensions', async function () {
            const seed = CONFIGURATION_ID_ERC3643
            const resolverKeys = [
                ERC20_RESOLVER_KEY,
                ERC3643_METADATA_RESOLVER_KEY,
                ERC3643_FREEZE_RESOLVER_KEY,
                ERC3643_RECOVERY_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
                ERC203643_CONTROLLER_RESOLVER_KEY,
                ERC3643_COMPLIANCE_RESOLVER_KEY,
                ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
                ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
            ]
            const result = buildConfigurationId(seed, resolverKeys)

            // Verify it's a valid hex string with 0x prefix
            expect(result).to.match(/^0x[0-9a-f]+$/)

            // The result should be different from just the seed
            expect(result).to.not.equal(CONFIGURATION_ID_ERC3643)
        })

        it('should handle ERC3643 resolver keys in different orders', async function () {
            const seed = CONFIGURATION_ID_ERC3643
            const resolverKeys1 = [
                ERC20_RESOLVER_KEY,
                ERC3643_METADATA_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
            ]
            const resolverKeys2 = [
                ERC203643_CAPPED_RESOLVER_KEY,
                ERC3643_METADATA_RESOLVER_KEY,
                ERC20_RESOLVER_KEY,
            ]

            const result1 = buildConfigurationId(seed, resolverKeys1)
            const result2 = buildConfigurationId(seed, resolverKeys2)

            // Results should be the same regardless of order (AND operation is commutative)
            expect(result1).to.equal(result2)
        })

        it('should verify ERC3643 shares resolver keys with ERC20', async function () {
            const seed = ethers.ZeroHash

            // ERC20 uses these shared keys
            const erc20Keys = [
                ERC20_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
                ERC203643_CONTROLLER_RESOLVER_KEY,
            ]

            // ERC3643 uses the same shared keys plus its specific ones
            const erc3643Keys = [
                ERC20_RESOLVER_KEY,
                ERC203643_CAPPED_RESOLVER_KEY,
                ERC203643_CONTROLLER_RESOLVER_KEY,
                ERC3643_METADATA_RESOLVER_KEY,
            ]

            const erc20Result = buildConfigurationId(seed, erc20Keys)
            const erc3643Result = buildConfigurationId(seed, erc3643Keys)

            // Results should be different (ERC3643 has additional resolver key)
            expect(erc20Result).to.not.equal(erc3643Result)

            // But both should be valid
            expect(erc20Result).to.match(/^0x[0-9a-f]+$/)
            expect(erc3643Result).to.match(/^0x[0-9a-f]+$/)
        })
    })

    describe('Mixed ERC20 and ERC721 Tests', function () {
        it('should handle mixed resolver keys', async function () {
            const seed = ethers.ZeroHash
            const resolverKeys = [
                ERC20_RESOLVER_KEY, // 0x0000000000000000000000000000000000006a00000000000000000000000000
                ERC721_RESOLVER_KEY, // 0x000000000000000000000000a000000000000000000000000000000000000000
                ERC20_BURNABLE_RESOLVER_KEY, // 0x00000000000000000000000000002a0000000000000000000000000000000000
                ERC721_BURNABLE_RESOLVER_KEY, // 0x0000000000000000000000000000f70000000000000000000000000000000000
            ] // 0x000000000000000000000000a000dd0000006a00000000000000000000000000
            const result = buildConfigurationId(seed, resolverKeys)

            // Verify it's a valid hex string with 0x prefix
            expect(result).to.match(/^0x[0-9a-f]+$/)
            expect(result).to.be.equal(
                '0x000000000000000000000000a000dd0000006a00000000000000000000000000'
            )
        })

        it('should produce different results for different combinations', async function () {
            // Test individual resolver keys to demonstrate uniqueness
            // Use a seed with more varied bits to avoid AND operation collisions
            const seed =
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

            const resultERC20 = buildConfigurationId(seed, [ERC20_RESOLVER_KEY])
            const resultERC721 = buildConfigurationId(seed, [
                ERC721_RESOLVER_KEY,
            ])
            const resultERC20Burnable = buildConfigurationId(seed, [
                ERC20_BURNABLE_RESOLVER_KEY,
            ])
            const resultERC721Burnable = buildConfigurationId(seed, [
                ERC721_BURNABLE_RESOLVER_KEY,
            ])

            // With a full-ones seed, different resolver keys should produce different results
            expect(resultERC20).to.not.equal(resultERC721)
            expect(resultERC20).to.not.equal(resultERC20Burnable)
            expect(resultERC721).to.not.equal(resultERC721Burnable)
            expect(resultERC20Burnable).to.not.equal(resultERC721Burnable)

            // Test that multiple resolver keys work (even if they result in 0 due to AND operation)
            const erc20Multiple = buildConfigurationId(seed, [
                ERC20_RESOLVER_KEY,
                ERC20_BURNABLE_RESOLVER_KEY,
            ])
            const erc721Multiple = buildConfigurationId(seed, [
                ERC721_RESOLVER_KEY,
                ERC721_BURNABLE_RESOLVER_KEY,
            ])

            // Verify the function produces valid results
            expect(erc20Multiple).to.match(/^0x[0-9a-f]+$/)
            expect(erc721Multiple).to.match(/^0x[0-9a-f]+$/)
            expect(erc20Multiple).to.not.equal(erc721Multiple)
        })
    })

    describe('Boundary and Edge Case Tests', function () {
        it('should handle resolver key at position 0', async function () {
            const seed =
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            // Create a resolver key that results in position 0
            const resolverKey = ethers.ZeroHash
            const result = buildConfigurationId(seed, [resolverKey], {
                positionDivisor: 32,
            })
            expect(result).to.equal(
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            )
        })

        it('should handle a high position value (non-zero change)', async function () {
            const seed =
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            // Use a known resolver key and just assert the result changes from the seed
            const resolverKey = ERC20_RESOLVER_KEY
            const result = buildConfigurationId(seed, [resolverKey], {
                positionDivisor: 32,
                logLevel: 'verbose',
            })

            // The result should be different from the original seed
            expect(result).to.not.equal(
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            )
        })

        it('should handle maximum seed value', async function () {
            const seed =
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            const resolverKeys = [ERC20_RESOLVER_KEY, ERC721_RESOLVER_KEY]
            const result = buildConfigurationId(seed, resolverKeys)

            // Verify it's a valid hex string with 0x prefix
            expect(result).to.match(/^0x[0-9a-f]+$/)
            expect(result.length).to.be.greaterThan(0)
        })

        it('should handle zero seed value (XOR semantics)', async function () {
            const seed = ethers.ZeroHash
            const resolverKeys = [ERC20_RESOLVER_KEY, ERC721_RESOLVER_KEY]
            const result = buildConfigurationId(seed, resolverKeys)

            // With zero seed and XOR semantics, result should equal the XOR of masks (non-zero here)
            expect(result).to.not.equal(ethers.ZeroHash)
            expect(result).to.match(/^0x[0-9a-f]+$/)
        })

        it('should handle duplicate resolver keys (idempotent under XOR)', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [ERC20_RESOLVER_KEY, ERC20_RESOLVER_KEY] // Duplicate
            const result = buildConfigurationId(seed, resolverKeys)

            // Under XOR, applying the same mask twice cancels out, so result equals seed
            expect(result).to.equal(seed)
        })
    })

    describe('Error Handling Tests', function () {
        it('should throw error for invalid seed format', async function () {
            const invalidSeed = 'not-a-hex-string'
            const resolverKeys = [ERC20_RESOLVER_KEY]

            expect(() =>
                buildConfigurationId(invalidSeed, resolverKeys)
            ).to.throw('Seed must be a valid hexadecimal string')
        })

        it('should throw error for empty seed', async function () {
            const emptySeed = ''
            const resolverKeys = [ERC20_RESOLVER_KEY]

            expect(() =>
                buildConfigurationId(emptySeed, resolverKeys)
            ).to.throw('Seed must be a non-empty string')
        })

        it('should throw error for invalid resolver key format', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const invalidResolverKeys = ['not-a-hex']

            expect(() =>
                buildConfigurationId(seed, invalidResolverKeys)
            ).to.throw('Invalid hex format for resolver key: not-a-hex')
        })

        it('should throw error for invalid position', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [ERC20_RESOLVER_KEY]

            expect(() =>
                buildConfigurationId(seed, resolverKeys, {
                    positionDivisor: -1,
                })
            ).to.throw('Position')
        })
    })

    describe('Configuration Options Tests', function () {
        it('should use default options when none provided', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [ERC20_RESOLVER_KEY]

            const result = buildConfigurationId(seed, resolverKeys)
            expect(result).to.match(/^0x[0-9a-f]+$/)
        })

        it('should handle custom position divisor (valid output)', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [ERC20_RESOLVER_KEY]

            const result = buildConfigurationId(seed, resolverKeys, {
                positionDivisor: 16,
            })
            expect(result).to.match(/^0x[0-9a-f]+$/)
        })

        it('should handle verbose logging option', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = [ERC20_RESOLVER_KEY]

            // This test mainly checks that verbose logging doesn't break the function
            const result = buildConfigurationId(seed, resolverKeys, {
                logLevel: 'verbose',
            })
            expect(result).to.match(/^0x[0-9a-f]+$/)
        })
    })

    describe('Performance and Stress Tests', function () {
        it('should handle large number of resolver keys', async function () {
            const seed = CONFIGURATION_ID_ERC20
            const resolverKeys = []

            // Add many resolver keys
            for (let i = 0; i < 50; i++) {
                resolverKeys.push(ERC20_RESOLVER_KEY)
            }

            const result = buildConfigurationId(seed, resolverKeys)

            // Should still produce valid result
            expect(result).to.match(/^0x[0-9a-f]+$/)
            expect(result.length).to.be.greaterThan(0)
        })
    })
})
