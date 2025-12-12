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
----------------------------------------------------------------------------------- */
// utils/didDocumentVerifier.ts
import { expect } from 'chai'
import {
    DidDocumentResult,
    ExpectedDidDocument,
    VMethod,
    VRelationship,
    ContractDidDocumentResult,
    ContractVMethodTuple,
    ContractVRelationshipTuple,
} from '../types/didDocument.types'

export interface VerificationOptions {
    verifyVMethods?: boolean
    verifyVRelationships?: boolean
}

export class DidDocumentVerifier {
    /**
     * Verifica un documento DID completo contra los datos esperados
     */
    static verifyDidDocument(
        actualResult: ContractDidDocumentResult,
        expected: ExpectedDidDocument,
        options: VerificationOptions = {}
    ): void {
        const parsed = this.parseDidDocumentResult(actualResult)

        // Verificación básica de estructura
        expect(parsed.baseDocument).to.equal(
            expected.baseDocument,
            'Base document mismatch'
        )
        expect(parsed.controllers).to.deep.equal(
            expected.controllers,
            'Controllers mismatch'
        )
        expect(parsed.vMethodIds).to.deep.equal(
            expected.vMethodIds,
            'VMethod IDs mismatch'
        )

        // Verificación de vMethods
        if (options.verifyVMethods !== false) {
            this.verifyVMethods(parsed.vMethods, expected.vMethods)
        }

        // Verificación de vRelationships
        if (options.verifyVRelationships !== false) {
            this.verifyVRelationships(
                parsed.vRelationships,
                expected.vRelationships
            )
        }
    }

    /**
     * Convierte el array del contrato a un objeto tipado
     * Note: Contract returns: [baseDocument, alsoKnownAs, controllers, vMethodIds, vMethods, vRelationships]
     */
    static parseDidDocumentResult(
        result: ContractDidDocumentResult
    ): DidDocumentResult {
        return {
            baseDocument: result[0],
            // result[1] is alsoKnownAs (string) - we skip it for now
            controllers: result[2],
            vMethodIds: result[3],
            vMethods:
                result[4]?.map((vm: ContractVMethodTuple) => ({
                    publicKey: vm[0],
                    ellipticType: Number(vm[1]),
                    revoked: vm[2],
                })) || [],
            vRelationships:
                result[5]?.map((vr: ContractVRelationshipTuple) => ({
                    relationshipType: vr[0],
                    vMethodId: vr[1],
                    notBefore: BigInt(vr[2]),
                    notAfter: BigInt(vr[3]),
                    status: vr[4],
                })) || [],
        }
    }

    /**
     * Verifica métodos de verificación
     */
    private static verifyVMethods(
        actual: VMethod[],
        expected: VMethod[]
    ): void {
        expect(actual).to.have.lengthOf(
            expected.length,
            'VMethods length mismatch'
        )

        actual.forEach((actualVMethod, index) => {
            const expectedVMethod = expected[index]
            expect(actualVMethod.publicKey).to.equal(
                expectedVMethod.publicKey,
                `VMethod[${index}] publicKey mismatch`
            )
            expect(actualVMethod.ellipticType).to.equal(
                expectedVMethod.ellipticType,
                `VMethod[${index}] ellipticType mismatch`
            )
            expect(actualVMethod.revoked).to.equal(
                expectedVMethod.revoked,
                `VMethod[${index}] revoked status mismatch`
            )
        })
    }

    /**
     * Verifica relaciones de verificación
     */
    private static verifyVRelationships(
        actual: VRelationship[],
        expected: VRelationship[]
    ): void {
        expect(actual).to.have.lengthOf(
            expected.length,
            'VRelationships length mismatch'
        )

        actual.forEach((actualVRel, index) => {
            const expectedVRel = expected[index]
            expect(actualVRel.relationshipType).to.equal(
                expectedVRel.relationshipType,
                `VRelationship[${index}] relationshipType mismatch`
            )
            expect(actualVRel.vMethodId).to.equal(
                expectedVRel.vMethodId,
                `VRelationship[${index}] vMethodId mismatch`
            )
            expect(actualVRel.notBefore).to.equal(
                expectedVRel.notBefore,
                `VRelationship[${index}] notBefore mismatch`
            )
            expect(actualVRel.notAfter).to.equal(
                expectedVRel.notAfter,
                `VRelationship[${index}] notAfter mismatch`
            )
            expect(actualVRel.status).to.equal(
                expectedVRel.status,
                `VRelationship[${index}] status mismatch`
            )
        })
    }

    /**
     * Verifica que un documento DID esté vacío (sin vMethods ni vRelationships)
     */
    static verifyEmptyDidDocument(
        actualResult: ContractDidDocumentResult,
        baseDocument: string,
        controllers: string[]
    ): void {
        const parsed = this.parseDidDocumentResult(actualResult)

        expect(parsed.baseDocument).to.equal(baseDocument)
        expect(parsed.controllers).to.deep.equal(controllers)
        expect(parsed.vMethodIds).to.deep.equal([])
        expect(parsed.vMethods).to.have.lengthOf(0)
        expect(parsed.vRelationships).to.have.lengthOf(0)
    }
}
