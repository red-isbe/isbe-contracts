/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { executeTimeStampingWrite } from './utils'

export interface StampWithSignatureInput {
    originalHash: string
    tsaHash: string
    externalReferenceId: string
    sender: string
    expirationTimestamp: bigint | number
    nonce: bigint | number
    signature: string
}

type SignedTsrDataStruct = {
    tsrData: {
        originalHash: string
        tsaHash: string
        externalReferenceId: string
    }
    sender: string
    expirationTimestamp: bigint
    nonce: bigint
}

export async function stampWithSignature(
    input: StampWithSignatureInput,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const signedTsrData: SignedTsrDataStruct = {
        tsrData: {
            originalHash: input.originalHash,
            tsaHash: input.tsaHash,
            externalReferenceId: input.externalReferenceId,
        },
        sender: input.sender,
        expirationTimestamp: BigInt(input.expirationTimestamp),
        nonce: BigInt(input.nonce),
    }

    console.log(
        '🔏 Initializing signature provider for stamping with signature...'
    )
    console.log('📋 Stamping with signature:')
    console.log(`   Original Hash: ${input.originalHash}`)
    console.log(`   TSA Hash: ${input.tsaHash}`)
    console.log(`   External Reference ID: ${input.externalReferenceId}`)
    console.log(`   Sender: ${input.sender}`)
    console.log(
        `   Expiration: ${new Date(Number(input.expirationTimestamp) * 1000).toISOString()}`
    )
    console.log(`   Nonce: ${input.nonce}`)
    console.log(`   Signature: ${input.signature.slice(0, 20)}...`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    await executeTimeStampingWrite(
        diamond,
        signatureProvider,
        'stampWithSignature',
        [signedTsrData, input.signature],
        300000n
    )

    console.log('\n✅ Hash set stamped with signature successfully')
}
