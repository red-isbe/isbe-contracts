// utils/didDocumentBuilder.ts
import { ExpectedDidDocument, EllipticType } from '../types/didDocument.types'

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
