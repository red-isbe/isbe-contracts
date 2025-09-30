import { task, types } from 'hardhat/config'
import { registerFilter } from '../../scripts/client/registerFilter'
import { getSigner } from '../../scripts/utils/getSigner'
import { ZeroAddress, ZeroHash } from 'ethers'

/**
 npx hardhat registerFilter --network localhost \
  --client-filtering-address "0xaa294264E0F26fBEeD82044Ec6961dfceb15E0d8" \
  --filter-id "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157" \
  --filter-type 1 \
  --transaction-hash "0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157" \
  --contract-address "0xaa294264E0F26fBEeD82044Ec6961dfceb15E0d8" \
  --signature "0x01234567" \
  --json-rpc-method "eth_storageAt" \
  --initial-block "0" \
  --end-block "0"
 */
task('registerFilter', 'register filter')
    .addParam(
        'filterId',
        'Unique identifier of the filter',
        undefined,
        types.string
    )
    .addParam(
        'filterType',
        '1: TRANSACTION_HASH, 2: CONTRACT, 3: SIGNATURE, 4: CONTRACT_AND_SIGNATURE, 5: JSONRPC_METHOD',
        1,
        types.int
    )
    .addParam(
        'transactionHash',
        'The transaction hash to be filtered. Only available with TRANSACTION_HASH.',
        ZeroHash,
        types.string
    )
    .addParam(
        'contractAddress',
        'The contract address to be filtered. Only available with CONTRACT & CONTRACT_AND_SIGNATURE.',
        ZeroAddress,
        types.string
    )
    .addParam(
        'signature',
        'The signature to be filtered. Only available with SIGNATURE & CONTRACT_AND_SIGNATURE.',
        '0x00000000',
        types.string
    )
    .addParam(
        'jsonRpcMethod',
        'JSON RPC method to be filtered. Only available with JSONRPC_METHOD.',
        '',
        types.string
    )
    .addParam('initialBlock', 'The initial block for the filter', 0, types.int)
    .addParam('endBlock', 'The latest block for the filter', 0, types.int)
    .addParam(
        'clientFilteringAddress',
        'The address of the proxy associated to ClientFilteringFacet',
        undefined,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                filterId: string
                filterType: number
                transactionHash: string
                contractAddress: string
                signature: string
                jsonRpcMethod: string
                initialBlock: number
                endBlock: number
                clientFilteringAddress: string
            },
            hre
        ) => {
            const {
                filterId,
                filterType,
                transactionHash,
                contractAddress,
                signature,
                jsonRpcMethod,
                initialBlock,
                endBlock,
                clientFilteringAddress,
            } = taskArgs

            const signer = await getSigner(hre)

            // Convertir strings a los tipos correctos
            const result = await registerFilter(
                filterId,
                BigInt(filterType),
                transactionHash,
                contractAddress,
                signature,
                jsonRpcMethod,
                BigInt(initialBlock),
                BigInt(endBlock),
                clientFilteringAddress,
                signer
            )

            console.log(
                'Register filter result:',
                JSON.stringify(result, null, 2)
            )
        }
    )
