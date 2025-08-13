import { expect } from 'chai'

/**
 * Estructura que representa un elemento DidWithPeriod del contrato
 */
export interface DidWithPeriod {
    did: string
    notBefore: bigint
    notAfter: bigint
}

/**
 * Tipo que representa el resultado del contrato getDidsByVerificationRelationship
 * [items, total, howMany, prev, next]
 */
export type ContractVerificationRelationshipResult = [
    DidWithPeriod[], // items
    bigint, // total
    bigint, // howMany
    bigint, // prev
    bigint, // next
]

/**
 * Validador para resultados de relaciones de verificación con paginación
 * Proporciona métodos fluidos para verificar los resultados devueltos por
 * getDidsByVerificationRelationship del contrato
 */
export class VerificationRelationshipResultValidator {
    private result: ContractVerificationRelationshipResult

    constructor(result: ContractVerificationRelationshipResult) {
        this.result = result
    }

    /**
     * Factory method para crear una instancia del validador
     */
    static validate(
        result: ContractVerificationRelationshipResult
    ): VerificationRelationshipResultValidator {
        return new VerificationRelationshipResultValidator(result)
    }

    /**
     * Verifica el array de elementos DidWithPeriod
     */
    expectItems(
        expectedItems: DidWithPeriod[]
    ): VerificationRelationshipResultValidator {
        const actualItems = this.result[0]

        expect(actualItems).to.have.lengthOf(
            expectedItems.length,
            'Items array length should match expected'
        )

        actualItems.forEach((actualItem, index) => {
            const expectedItem = expectedItems[index]
            expect(actualItem.did).to.equal(
                expectedItem.did,
                `Item[${index}] DID should match expected`
            )
            expect(actualItem.notBefore).to.equal(
                expectedItem.notBefore,
                `Item[${index}] notBefore should match expected`
            )
            expect(actualItem.notAfter).to.equal(
                expectedItem.notAfter,
                `Item[${index}] notAfter should match expected`
            )
        })

        return this
    }

    /**
     * Verifica que el array de items esté vacío
     */
    expectEmptyItems(): VerificationRelationshipResultValidator {
        expect(this.result[0]).to.be.empty
        return this
    }

    /**
     * Verifica el número total de elementos disponibles
     */
    expectTotal(
        expectedTotal: number
    ): VerificationRelationshipResultValidator {
        expect(this.result[1]).to.equal(
            BigInt(expectedTotal),
            'Total count should match expected value'
        )
        return this
    }

    /**
     * Verifica el número de elementos devueltos en la página actual
     */
    expectHowMany(
        expectedHowMany: number
    ): VerificationRelationshipResultValidator {
        expect(this.result[2]).to.equal(
            BigInt(expectedHowMany),
            'HowMany count should match expected value'
        )
        return this
    }

    /**
     * Verifica el número de página anterior
     */
    expectPrev(expectedPrev: number): VerificationRelationshipResultValidator {
        expect(this.result[3]).to.equal(
            BigInt(expectedPrev),
            'Previous page should match expected value'
        )
        return this
    }

    /**
     * Verifica el número de página siguiente
     */
    expectNext(expectedNext: number): VerificationRelationshipResultValidator {
        expect(this.result[4]).to.equal(
            BigInt(expectedNext),
            'Next page should match expected value'
        )
        return this
    }

    /**
     * Verifica información completa de paginación
     */
    expectPaginationInfo(pagination: {
        total: number
        howMany: number
        prev: number
        next: number
    }): VerificationRelationshipResultValidator {
        return this.expectTotal(pagination.total)
            .expectHowMany(pagination.howMany)
            .expectPrev(pagination.prev)
            .expectNext(pagination.next)
    }

    /**
     * Verifica el resultado completo incluyendo items y paginación
     */
    expectFullResult(expected: {
        items: DidWithPeriod[]
        total: number
        howMany: number
        prev: number
        next: number
    }): VerificationRelationshipResultValidator {
        return this.expectItems(expected.items).expectPaginationInfo({
            total: expected.total,
            howMany: expected.howMany,
            prev: expected.prev,
            next: expected.next,
        })
    }

    /**
     * Verifica que no hay elementos pero mantiene información de paginación
     */
    expectEmptyPage(pagination: {
        total: number
        prev: number
        next: number
    }): VerificationRelationshipResultValidator {
        return this.expectEmptyItems()
            .expectTotal(pagination.total)
            .expectHowMany(0)
            .expectPrev(pagination.prev)
            .expectNext(pagination.next)
    }

    expectDidsOnlyAndDates(
        expectedDids: string[],
        expectedNotBefores: bigint[],
        expectedNotAfters: bigint
    ): VerificationRelationshipResultValidator {
        const actualItems = this.result[0]
        const actualDids = actualItems.map((item) => item.did)
        const actualNotBefores = actualItems.map((item) => item.notBefore)
        const actualNotAfters = actualItems.map((item) => item.notAfter)

        expect(actualDids).to.deep.equal(
            expectedDids,
            'DIDs array should match expected values'
        )
        expect(actualNotBefores).to.be.deep.equal(
            expectedNotBefores,
            'notBefore array should match expected values'
        )
        expect(actualNotAfters).to.be.deep.equal(
            expectedNotAfters,
            'notAfter array should match expected values'
        )

        return this
    }

    /**
     * Verifica que todos los items tengan períodos de validez dentro del rango esperado
     */
    expectValidTimeRange(
        minTime: bigint,
        maxTime: bigint
    ): VerificationRelationshipResultValidator {
        const actualItems = this.result[0]

        actualItems.forEach((item, index) => {
            expect(item.notBefore).to.be.at.least(
                minTime,
                `Item[${index}] notBefore should be at least ${minTime}`
            )
            expect(item.notAfter).to.be.at.most(
                maxTime,
                `Item[${index}] notAfter should be at most ${maxTime}`
            )
            expect(item.notBefore).to.be.below(
                item.notAfter,
                `Item[${index}] notBefore should be before notAfter`
            )
        })

        return this
    }

    /**
     * Verifica que el resultado sea consistente con una consulta de paginación específica
     */
    expectConsistentPagination(
        requestedPage: number,
        requestedPageSize: number
    ): VerificationRelationshipResultValidator {
        const actualItems = this.result[0]
        const total = Number(this.result[1])
        const howMany = Number(this.result[2])

        // Verificar que howMany no exceda el tamaño de página solicitado
        expect(howMany).to.be.at.most(
            requestedPageSize,
            'Returned items should not exceed requested page size'
        )

        // Verificar que howMany coincida con el número real de items
        expect(actualItems).to.have.lengthOf(
            howMany,
            'Items array length should match howMany value'
        )

        // Si no estamos en la última página, howMany debería ser igual al pageSize
        const totalPages = Math.ceil(total / requestedPageSize)
        if (requestedPage < totalPages && total > 0) {
            expect(howMany).to.equal(
                Math.min(
                    requestedPageSize,
                    total - (requestedPage - 1) * requestedPageSize
                ),
                'HowMany should match expected items for this page'
            )
        }

        return this
    }

    /**
     * Obtiene los elementos del resultado para procesamiento adicional
     */
    getItems(): DidWithPeriod[] {
        return this.result[0]
    }

    /**
     * Obtiene información de paginación del resultado
     */
    getPaginationInfo() {
        return {
            total: Number(this.result[1]),
            howMany: Number(this.result[2]),
            prev: Number(this.result[3]),
            next: Number(this.result[4]),
        }
    }
}
