/**
 * @file addVerificationRelationship.ts
 * @description Hardhat task to add a verification relationship to a DID
 * @module tasks/didVerificationRelationship
 */

/**
 * ⚠️ WARNING: The method must exist in the DID and not be revoked. Use only valid names:
 * authentication | assertionMethod | keyAgreement | capabilityInvocation | capabilityDelegation.
 * notBefore/notAfter > 0 and notAfter >= notBefore; if it already exists you will see VerificationRelationshipExists.
 * Use a NON-revoked vMethodId. If you revoked it before, create a new one with addVerificationMethod.
 *
  NOTBEFORE=$(date +%s)
  NOTAFTER=$((NOTBEFORE + 2592000))
  npx hardhat addVerificationRelationship --network localhost \
   --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
   --name "authentication" \
   --vmethodid 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab \
   --notbefore $NOTBEFORE \
   --notafter $NOTAFTER \
   --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { addVerificationRelationship } from '../../scripts/didVerificationRelationship/addVerificationRelationship'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

// Write: addVerificationRelationship(bytes32,string,bytes32,uint256,uint256)
task('addVerificationRelationship', 'Adds a verification relationship to a DID')
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam('name', 'Relationship name', undefined, types.string)
    .addParam(
        'vmethodid',
        'Verification Method ID (bytes32)',
        undefined,
        types.string
    )
    .addParam(
        'notbefore',
        'Unix timestamp when it becomes valid',
        undefined,
        types.int
    )
    .addParam(
        'notafter',
        'Unix timestamp when it expires',
        undefined,
        types.int
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, name, vmethodid, notbefore, notafter, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        return addVerificationRelationship(
            did,
            name,
            vmethodid,
            notbefore,
            notafter,
            diamond,
            signatureProvider
        )
    })
