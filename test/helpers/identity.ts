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
import { expect } from 'chai'
import { ContractTransactionResponse, Contract } from 'ethers'

/**
 * Test helper for validating empty parameter rejections
 */
export async function expectEmptyParameterRejection(
    operation: () => Promise<ContractTransactionResponse>,
    facet: Contract,
    errorName: string,
    errorArgs?: unknown[]
): Promise<void> {
    const expectation = expect(operation()).to.be.revertedWithCustomError(
        facet,
        errorName
    )

    if (errorArgs) {
        await expectation.withArgs(...errorArgs)
    } else {
        await expectation
    }
}

/**
 * Test helper for validating successful operations with events
 */
export async function expectSuccessWithEvent(
    operation: Promise<ContractTransactionResponse>,
    eventName: string,
    eventArgs: unknown[]
): Promise<void> {
    await expect(operation)
        .to.emit(operation, eventName)
        .withArgs(...eventArgs)
}

/**
 * Common validation test parameters
 */
export interface ValidationTestParams {
    emptyDidTest?: {
        getOperation: (did: string) => Promise<ContractTransactionResponse>
        facet: Contract
    }
    emptyStringTest?: {
        getOperation: (value: string) => Promise<ContractTransactionResponse>
        facet: Contract
        paramName: string
    }
    emptyBytesTest?: {
        getOperation: (value: string) => Promise<ContractTransactionResponse>
        facet: Contract
    }
    emptyUintTest?: {
        getOperation: (
            value: bigint | number
        ) => Promise<ContractTransactionResponse>
        facet: Contract
        paramName: string
    }
    didNotExistsTest?: {
        getOperation: (did: string) => Promise<ContractTransactionResponse>
        facet: Contract
        generateRandomDid: () => string
    }
}

/**
 * Run common empty parameter validation tests
 */
export function runCommonValidationTests(
    operationName: string,
    params: ValidationTestParams,
    constants: {
        ZeroHash: string
        emptyString: string
        emptyBytes: string
    }
): void {
    if (params.emptyDidTest) {
        it(`GIVEN operation WHEN try to ${operationName} with empty did THEN it fails`, async () => {
            await expectEmptyParameterRejection(
                () => params.emptyDidTest!.getOperation(constants.ZeroHash),
                params.emptyDidTest!.facet,
                'EmptyBytes32'
            )
        })
    }

    if (params.emptyStringTest) {
        it(`GIVEN operation WHEN try to ${operationName} with empty ${params.emptyStringTest.paramName} THEN it fails`, async () => {
            await expectEmptyParameterRejection(
                () =>
                    params.emptyStringTest!.getOperation(constants.emptyString),
                params.emptyStringTest!.facet,
                'EmptyString'
            )
        })
    }

    if (params.emptyBytesTest) {
        it(`GIVEN operation WHEN try to ${operationName} with empty bytes THEN it fails`, async () => {
            await expectEmptyParameterRejection(
                () => params.emptyBytesTest!.getOperation(constants.emptyBytes),
                params.emptyBytesTest!.facet,
                'EmptyBytes'
            )
        })
    }

    if (params.emptyUintTest) {
        it(`GIVEN operation WHEN try to ${operationName} with empty ${params.emptyUintTest.paramName} THEN it fails`, async () => {
            await expectEmptyParameterRejection(
                () => params.emptyUintTest!.getOperation(0),
                params.emptyUintTest!.facet,
                'EmptyUint'
            )
        })
    }

    if (params.didNotExistsTest) {
        it(`GIVEN operation WHEN try to ${operationName} with non-existent DID THEN it fails`, async () => {
            const randomDid = params.didNotExistsTest!.generateRandomDid()
            await expectEmptyParameterRejection(
                () => params.didNotExistsTest!.getOperation(randomDid),
                params.didNotExistsTest!.facet,
                'DidNotExists',
                [randomDid]
            )
        })
    }
}

/**
 * Helper for pagination test expectations
 */
interface ValidatorLike {
    validate: (result: unknown) => {
        expectFullResult: (expected: {
            dids: string[]
            totalCount: number
            filteredCount: number
            pageNumber: bigint
            totalPages: bigint
        }) => void
        expectDidsArray: (dids: string[]) => ValidatorLike
        expectCounts: (total: number, filtered: number) => ValidatorLike
        expectPaginationInfo: (prev: bigint, next: bigint) => ValidatorLike
    }
}

export interface PaginationTestHelper {
    testFullList: (
        operation: () => Promise<unknown>,
        validator: ValidatorLike,
        expectedDids: string[]
    ) => Promise<void>
    testBitByBit: (
        operation: (page: number, size: number) => Promise<unknown>,
        validator: ValidatorLike,
        expectedDids: string[],
        pageSize: number
    ) => Promise<void>
    testOutOfBounds: (
        operation: (page: number, size: number) => Promise<unknown>,
        validator: ValidatorLike,
        totalCount: number
    ) => Promise<void>
}

export const paginationTestHelper: PaginationTestHelper = {
    async testFullList(operation, validator, expectedDids) {
        const result = await operation()
        validator.validate(result).expectFullResult({
            dids: expectedDids,
            totalCount: expectedDids.length,
            filteredCount: expectedDids.length,
            pageNumber: 1n,
            totalPages: 1n,
        })
    },

    async testBitByBit(operation, validator, expectedDids, pageSize) {
        const totalPages = Math.ceil(expectedDids.length / pageSize)

        for (let page = 1; page <= totalPages; page++) {
            const startIdx = (page - 1) * pageSize
            const endIdx = Math.min(startIdx + pageSize, expectedDids.length)
            const expectedSlice = expectedDids.slice(startIdx, endIdx)
            const result = await operation(page, pageSize)

            validator
                .validate(result)
                .expectDidsArray(expectedSlice)
                .expectCounts(expectedDids.length, expectedSlice.length)
                .expectPaginationInfo(
                    BigInt(page === totalPages ? totalPages - 1 : 1),
                    BigInt(totalPages)
                )
        }
    },

    async testOutOfBounds(operation, validator, totalCount) {
        const result = await operation(2, 5)
        validator
            .validate(result)
            .expectDidsArray([])
            .expectCounts(totalCount, 0)
            .expectPaginationInfo(1n, 1n)
    },
}
