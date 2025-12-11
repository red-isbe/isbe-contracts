import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { ZeroAddress, ZeroHash } from 'ethers'

/**
 npx hardhat updateFilter --network localhost \
  --client-filtering-address "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10" \
  --filter-id "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157" \
  --filter-type 1 \
  --transaction-hash "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157" \
  --contract-address "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10" \
  --signature "0x01234567" \
  --json-rpc-method "eth_storageAt" \
  --initial-block 0 \
  --end-block 0 \
  --disabled false
 */
task('updateFilter', 'Updates an existing filter in ClientFilteringFacet')
    .addParam(
        'filterId',
        'Unique identifier of the filter',
        undefined,
        types.string
    )
    .addParam(
        'filterType',
        'Filter type: 0=NONE, 1=TRANSACTION_HASH, 2=CONTRACT, 3=SIGNATURE, 4=CONTRACT_AND_SIGNATURE, 5=JSONRPC_METHOD',
        1,
        types.int
    )
    .addParam(
        'transactionHash',
        'The transaction hash to be filtered (for TRANSACTION_HASH type)',
        ZeroHash,
        types.string
    )
    .addParam(
        'contractAddress',
        'The contract address to be filtered (for CONTRACT & CONTRACT_AND_SIGNATURE types)',
        ZeroAddress,
        types.string
    )
    .addParam(
        'signature',
        'The function signature to be filtered (for SIGNATURE & CONTRACT_AND_SIGNATURE types)',
        '0x00000000',
        types.string
    )
    .addParam(
        'jsonRpcMethod',
        'JSON RPC method to be filtered (for JSONRPC_METHOD type)',
        '',
        types.string
    )
    .addParam('initialBlock', 'The initial block for the filter', 0, types.int)
    .addParam('endBlock', 'The end block for the filter', 0, types.int)
    .addParam(
        'disabled',
        'Whether the filter is disabled',
        false,
        types.boolean
    )
    .addParam(
        'clientFilteringAddress',
        'The address of the ClientFilteringFacet proxy',
        undefined,
        types.string
    )
    .setAction(async (taskArgs, hre) => {
        const {
            filterId,
            filterType,
            transactionHash,
            contractAddress,
            signature,
            jsonRpcMethod,
            initialBlock,
            endBlock,
            disabled,
            clientFilteringAddress,
        } = taskArgs

        // Validate filter type
        if (filterType < 0 || filterType > 5) {
            throw new Error(
                `Invalid filterType: ${filterType}. Must be 0 (NONE), 1 (TRANSACTION_HASH), 2 (CONTRACT), 3 (SIGNATURE), 4 (CONTRACT_AND_SIGNATURE), or 5 (JSONRPC_METHOD)`
            )
        }

        console.log('🔍 Initializing signature provider for filter update...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const { ClientFilteringFacet__factory } =
            await import('../../../typechain-types')

        // Convert jsonRpcMethod string to bytes32
        const jsonRpcMethodBytes32 = jsonRpcMethod
            ? hre.ethers.encodeBytes32String(jsonRpcMethod.slice(0, 31))
            : ZeroHash

        // Build filter struct
        const filter = {
            filterId: filterId,
            filterType: filterType,
            transactionHash: transactionHash,
            contractAddress: contractAddress,
            signature: signature,
            jsonRpcMethod: jsonRpcMethodBytes32,
            initialBlock: BigInt(initialBlock),
            endBlock: BigInt(endBlock),
            disabled: disabled,
        }

        const filterTypeNames = [
            'NONE',
            'TRANSACTION_HASH',
            'CONTRACT',
            'SIGNATURE',
            'CONTRACT_AND_SIGNATURE',
            'JSONRPC_METHOD',
        ]

        console.log('📋 Updating filter with parameters:')
        console.log(`   Filter ID: ${filterId}`)
        console.log(
            `   Filter Type: ${filterTypeNames[filterType]} (${filterType})`
        )
        console.log(`   Transaction Hash: ${transactionHash}`)
        console.log(`   Contract Address: ${contractAddress}`)
        console.log(`   Signature: ${signature}`)
        console.log(`   JSON-RPC Method: ${jsonRpcMethod || '(none)'}`)
        console.log(`   Initial Block: ${initialBlock}`)
        console.log(`   End Block: ${endBlock}`)
        console.log(`   Disabled: ${disabled}`)
        console.log(`   Client Filtering Address: ${clientFilteringAddress}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        if (signatureProvider.getCurveType() === 'secp256r1') {
            const iface = ClientFilteringFacet__factory.createInterface()
            const functionData = iface.encodeFunctionData('updateFilter', [
                filter,
            ])

            const txResponse = await signatureProvider.sendTransaction({
                to: clientFilteringAddress,
                data: functionData,
                gasLimit: 300000n,
            })
            console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
            const receipt = await txResponse.wait()
            console.log(
                `   ✅ Transaction mined in block ${receipt?.blockNumber}`
            )
        } else {
            const signer = await signatureProvider.getSigner()
            const contract = ClientFilteringFacet__factory.connect(
                clientFilteringAddress,
                signer
            )
            const tx = await contract.updateFilter(filter)
            console.log(`   🔗 Transaction submitted: ${tx.hash}`)
            const receipt = await tx.wait()
            console.log(
                `   ✅ Transaction mined in block ${receipt?.blockNumber}`
            )
        }

        console.log('\n✅ Filter updated successfully')
    })
