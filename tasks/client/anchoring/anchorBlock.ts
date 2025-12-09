import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { anchorBlock } from '../../../scripts/client/anchoringCoreFacet'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:anchorblock \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --blocknumber 100 \
  --blockhash 0xaaaa... \
  --stateroot 0x1111... \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:anchorblock',
    'Prepare parameters for calling IAnchoringCore.anchorBlock'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID (_chainId, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'blocknumber',
        'Block number (_blockNumber, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'blockhash',
        'Block hash (_blockHash, bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'stateroot',
        'State root (_stateRoot, bytes32)',
        undefined,
        types.string
    )
    .setAction(
        async (
            { governancediamond, chainid, blocknumber, blockhash, stateroot },
            hre: HardhatRuntimeEnvironment
        ) => {
            console.log('anchoringcorefacet:anchorblock')
            console.log('Target Governance Diamond:', governancediamond)
            console.log(
                'Function: anchorBlock(uint256 _chainId, uint256 _blockNumber, bytes32 _blockHash, bytes32 _stateRoot)'
            )
            console.log('Parameters:')
            console.log('  _chainId     :', chainid.toString())
            console.log('  _blockNumber :', blocknumber.toString())
            console.log('  _blockHash   :', blockhash)
            console.log('  _stateRoot   :', stateroot)

            const signatureProvider = SignatureProviderFactory.create(hre)
            console.log(`Network: ${hre.network.name}`)
            console.log(`Curve: ${signatureProvider.getCurveType()}`)

            await anchorBlock(
                hre,
                governancediamond,
                chainid,
                blocknumber,
                blockhash,
                stateroot,
                signatureProvider
            )

            console.log('\n✅ anchorBlock transaction confirmed:')
            console.log('Done.')
        }
    )
