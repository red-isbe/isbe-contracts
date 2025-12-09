import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { registerChain } from '../../../scripts/client/anchoringCoreFacet'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:registerchain \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:registerchain',
    'Prepare parameters for calling IAnchoringCore.registerChain'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID to register (_chainId, uint256)',
        undefined,
        types.string
    )
    .setAction(
        async (
            { governancediamond, chainid },
            hre: HardhatRuntimeEnvironment
        ) => {
            console.log('anchoringcorefacet:registerchain')
            console.log('Target Governance Diamond:', governancediamond)
            console.log('Function: registerChain(uint256 _chainId)')
            console.log('Parameters:')
            console.log('  _chainId:', chainid.toString())

            const signatureProvider = SignatureProviderFactory.create(hre)
            console.log(`Network: ${hre.network.name}`)
            console.log(`Curve: ${signatureProvider.getCurveType()}`)

            await registerChain(
                hre,
                governancediamond,
                chainid,
                signatureProvider
            )

            console.log('\n✅ registerChain transaction confirmed:')
            console.log('Done.')
        }
    )
