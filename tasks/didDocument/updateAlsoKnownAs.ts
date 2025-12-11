/**
 * @file updateAlsoKnownAs.ts
 * @description Hardhat task to update the alsoKnownAs field of a DID document
 * @module tasks/didDocument
 */

/**
 npx hardhat updateAlsoKnownAs --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --alsoknownas "irn:orgs:alastria" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { updateAlsoKnownAs } from '../../scripts/didDocument/updateAlsoKnownAs'
import { getSignatureProvider } from '../../utils/signature-provider'

task(
    'updateAlsoKnownAs',
    'Updates the alsoKnownAs field of a DID document (requires DID_REGISTRY_ROLE)'
)
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'alsoknownas',
        'New alternative identifier for the entity',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, alsoknownas, diamond } = taskArgs
        return updateAlsoKnownAs(
            did,
            alsoknownas,
            diamond,
            await getSignatureProvider(hre)
        )
    })
