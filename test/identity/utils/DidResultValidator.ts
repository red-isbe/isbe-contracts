import { expect } from 'chai'
import { ContractGetDidsResult } from '../types/didDocument.types'

export class DidsResultValidator {
    private result: ContractGetDidsResult

    constructor(result: ContractGetDidsResult) {
        this.result = result
    }

    static validate(result: ContractGetDidsResult): DidsResultValidator {
        return new DidsResultValidator(result)
    }

    expectDidsArray(expectedDids: string[]): DidsResultValidator {
        expect(
            this.result[0],
            'DIDs array should match expected values'
        ).to.be.deep.equal(expectedDids)
        return this
    }

    expectTotalCount(expectedTotal: number): DidsResultValidator {
        expect(
            this.result[1],
            'Total count should match expected value'
        ).to.be.equal(expectedTotal)
        return this
    }

    expectFilteredCount(expectedFiltered: number): DidsResultValidator {
        expect(
            this.result[2],
            'Filtered count should match expected value'
        ).to.be.equal(expectedFiltered)
        return this
    }

    expectPageNumber(expectedPageNumber: bigint): DidsResultValidator {
        expect(
            this.result[3],
            'Page number should match expected value'
        ).to.be.equal(expectedPageNumber)
        return this
    }

    expectTotalPages(expectedTotalPages: bigint): DidsResultValidator {
        expect(
            this.result[4],
            'Total pages should match expected value'
        ).to.be.equal(expectedTotalPages)
        return this
    }

    expectFullResult(expected: {
        dids: string[]
        totalCount: number
        filteredCount: number
        pageNumber: bigint
        totalPages: bigint
    }): DidsResultValidator {
        return this.expectDidsArray(expected.dids)
            .expectTotalCount(expected.totalCount)
            .expectFilteredCount(expected.filteredCount)
            .expectPageNumber(expected.pageNumber)
            .expectTotalPages(expected.totalPages)
    }

    expectPaginationInfo(
        pageNumber: bigint,
        totalPages: bigint
    ): DidsResultValidator {
        return this.expectPageNumber(pageNumber).expectTotalPages(totalPages)
    }

    expectCounts(
        totalCount: number,
        filteredCount?: number
    ): DidsResultValidator {
        this.expectTotalCount(totalCount)
        if (filteredCount !== undefined) {
            this.expectFilteredCount(filteredCount)
        }
        return this
    }
}
