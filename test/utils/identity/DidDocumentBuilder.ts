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
// utils/didDocumentBuilder.ts
import { ExpectedDidDocument, EllipticType } from '../../types/identity'

export class DidDocumentBuilder {
    private document: ExpectedDidDocument

    constructor(baseDocument: string, controllers: string[] = []) {
        this.document = {
            baseDocument,
            controllers,
            vMethodIds: [],
            vMethods: [],
            vRelationships: [],
        }
    }

    addVMethod(
        vMethodId: string,
        publicKey: string,
        ellipticType: EllipticType = EllipticType.SECP_256_K1,
        revoked: boolean = false
    ): this {
        this.document.vMethodIds.push(vMethodId)
        this.document.vMethods.push({
            publicKey,
            ellipticType,
            revoked,
        })
        return this
    }

    addVRelationship(
        relationshipType: string,
        vMethodId: string,
        notBefore: bigint,
        notAfter: bigint,
        status: number = 0
    ): this {
        this.document.vRelationships.push({
            relationshipType,
            vMethodId,
            notBefore,
            notAfter,
            status,
        })
        return this
    }

    addController(controller: string): this {
        this.document.controllers.push(controller)
        return this
    }

    build(): ExpectedDidDocument {
        return { ...this.document }
    }

    static empty(
        baseDocument: string,
        controllers: string[] = []
    ): ExpectedDidDocument {
        return new DidDocumentBuilder(baseDocument, controllers).build()
    }
}
