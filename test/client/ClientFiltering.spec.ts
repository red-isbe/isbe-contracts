import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
    ClientFiltering,
    ClientFilteringFacet,
    GlobalIsbePause,
    IClientFiltering,
    ISBEPauseFacet,
} from '../../typechain-types'
import { Signer, ZeroAddress, ZeroHash } from 'ethers'
import {
    CLIENT_FILTERING_RESOLVER_KEY,
    CLIENT_FILTERING_ROLE,
    PAUSER_ROLE,
} from '../constants'
import {
    CONFIGURATION_ID_CLIENT_FILTERING,
    deployGovernance,
} from '../initialization'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { FilterType } from '../../scripts/client/interfaces'

describe('ClientFiltering', function () {
    let admin: Signer
    let adminAddress: string
    let other: Signer
    let otherAddress: string
    let clientFilteringFacet: ClientFilteringFacet
    let clientFiltering: ClientFiltering
    let globalIsbePause: GlobalIsbePause
    let pauseFacet: ISBEPauseFacet
    let filter: IClientFiltering.FilterStruct
    let MOCK_FILTERS: IClientFiltering.FilterStruct[]

    function getRandomFilterType(): FilterType {
        const randomIndex = randomInt() % 5n
        return (Number(randomIndex) + 1) as FilterType
    }
    const randomizeFilter = (
        filterType: FilterType = FilterType.NONE,
        index?: number
    ): IClientFiltering.FilterStruct => {
        const transactionHash = randomHx()
        const contractAddress = ethers.getAddress(randomHx(20))
        const initialBlock = randomInt()
        const endBlock = initialBlock + (randomInt() % 10_0000n)
        return {
            filterId:
                index !== undefined
                    ? ethers.keccak256(ethers.toUtf8Bytes(`filter_${index}`))
                    : randomHx(),
            filterType,
            transactionHash:
                filterType === FilterType.TRANSACTION_HASH
                    ? transactionHash
                    : ZeroHash,
            contractAddress:
                filterType === FilterType.CONTRACT ||
                filterType === FilterType.CONTRACT_AND_SIGNATURE
                    ? contractAddress
                    : ZeroAddress,
            signature:
                filterType === FilterType.SIGNATURE ||
                filterType === FilterType.CONTRACT_AND_SIGNATURE
                    ? randomHx(4)
                    : '0x00000000',
            jsonRpcMethod:
                filterType === FilterType.JSONRPC_METHOD
                    ? transactionHash
                    : ZeroHash,
            initialBlock,
            endBlock,
        } as IClientFiltering.FilterStruct
    }

    // Generar string hexadecimal aleatorio
    function randomHx(length: number = 32): string {
        return ethers.hexlify(ethers.randomBytes(length))
    }

    function randomInt(): bigint {
        const randomBytes = ethers.randomBytes(32)
        return ethers.toBigInt(ethers.hexlify(randomBytes))
    }

    async function deployInitial() {
        ;[admin, other] = await ethers.getSigners()
        adminAddress = await admin.getAddress()
        otherAddress = await other.getAddress()
        const rbac = [
            {
                role: PAUSER_ROLE,
                members: [adminAddress],
            },
            {
                role: CLIENT_FILTERING_ROLE,
                members: [adminAddress],
            },
        ]
        const gov = await deployGovernance(
            admin,
            rbac,
            CONFIGURATION_ID_CLIENT_FILTERING
        )
        globalIsbePause = gov.globalIsbePause
        clientFilteringFacet = gov.clientFilteringFacet
        clientFiltering = gov.clientFiltering
        pauseFacet = gov.pause
        expect(
            await clientFilteringFacet.businessIdIntrospection()
        ).to.be.equal(CLIENT_FILTERING_RESOLVER_KEY)
        expect(
            await clientFilteringFacet.interfacesIntrospection()
        ).to.be.deep.equal(['0x9ae60694'])
    }

    describe('ClientFiltering', () => {
        beforeEach(async () => {
            await loadFixture(deployInitial)
        })

        describe('registerFilter', () => {
            describe('Bad data on Filter', () => {
                beforeEach(async () => {
                    filter = randomizeFilter()
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert empty filterId  THEN it fails', async () => {
                    filter.filterId = ethers.ZeroHash
                    await expect(
                        clientFiltering.registerFilter(filter)
                    ).to.be.revertedWithCustomError(
                        clientFilteringFacet,
                        'EmptyBytes32'
                    )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert NONE as filterType without hash THEN it fails', async () => {
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert TRANSACTION_HASH as filterType without hash THEN it fails', async () => {
                    filter.filterType = FilterType.TRANSACTION_HASH
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert CONTRACT as filterType without address THEN it fails', async () => {
                    filter.filterType = FilterType.CONTRACT
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert CONTRACT_AND_SIGNATURE as filterType without address THEN it fails', async () => {
                    filter.filterType = FilterType.CONTRACT_AND_SIGNATURE
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert CONTRACT_AND_SIGNATURE as filterType without signature THEN it fails', async () => {
                    filter.filterType = FilterType.CONTRACT_AND_SIGNATURE
                    filter.contractAddress = adminAddress
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert SIGNATURE as filterType without sig THEN it fails', async () => {
                    filter.filterType = FilterType.SIGNATURE
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert JSONRPC_METHOD as filterType without jsonRpcMethod THEN it fails', async () => {
                    filter.filterType = FilterType.JSONRPC_METHOD
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert filter with bad block numbers THEN it fails', async () => {
                    filter.filterType = FilterType.JSONRPC_METHOD
                    filter.endBlock = 1n
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'InvalidFilter'
                        )
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
            })

            describe('FilterData OK', () => {
                beforeEach(() => {
                    filter = randomizeFilter(getRandomFilterType())
                    filter.endBlock = 0
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert same filterId twice THEN it fails', async () => {
                    await clientFiltering.registerFilter(filter)
                    await expect(clientFiltering.registerFilter(filter))
                        .to.be.revertedWithCustomError(
                            clientFilteringFacet,
                            'FilterIdExists'
                        )
                        .withArgs(filter.filterId)
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert when it is paused from governance THEN it fails', async () => {
                    await globalIsbePause.pauseIsbe(
                        await clientFiltering.getAddress()
                    )
                    await expect(
                        clientFiltering.registerFilter(filter)
                    ).to.be.revertedWithCustomError(clientFiltering, 'IsPaused')
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert when it is paused THEN it fails', async () => {
                    await pauseFacet.pause()
                    await expect(
                        clientFiltering.registerFilter(filter)
                    ).to.be.revertedWithCustomError(clientFiltering, 'IsPaused')
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert with not granted account THEN it fails', async () => {
                    await expect(
                        clientFiltering.connect(other).registerFilter(filter)
                    )
                        .to.be.revertedWithCustomError(
                            clientFiltering,
                            'AccountHasNoRole'
                        )
                        .withArgs(otherAddress, CLIENT_FILTERING_ROLE)
                })
                it('GIVEN deployed ClientFiltering WHEN try to insert correct values and roles THEN it success', async () => {
                    expect(await clientFiltering.registerFilter(filter))
                        .to.emit(clientFiltering, 'FilterRegistered')
                        .withArgs(
                            filter.filterId,
                            filter.filterType,
                            filter.transactionHash,
                            filter.contractAddress,
                            filter.signature,
                            filter.jsonRpcMethod,
                            filter.initialBlock,
                            filter.endBlock
                        )
                })
            })
        })

        describe('Getters', () => {
            const setupFiltersFixture = async () => {
                await deployInitial()
                MOCK_FILTERS = Array.from({ length: 5 }, (_, index) =>
                    randomizeFilter(getRandomFilterType(), index)
                )
                // Register filters sequentially to maintain order
                for (const filter of MOCK_FILTERS) {
                    await clientFiltering.registerFilter(filter)
                }
            }

            beforeEach(async () => {
                await loadFixture(setupFiltersFixture)
            })

            describe('getFiltersLength', () => {
                it('should return the correct number of registered filters', async () => {
                    const actualLength =
                        await clientFiltering.getFiltersLength()
                    expect(actualLength).to.equal(MOCK_FILTERS.length)
                })
            })

            describe('isFilterRegistered', () => {
                it('should return true for existing filters and false for non-existing ones', async () => {
                    // Test existing filters
                    for (const filter of MOCK_FILTERS) {
                        const exists = await clientFiltering.isFilterRegistered(
                            filter.filterId
                        )
                        expect(exists, `Filter ${filter.filterId} should exist`)
                            .to.be.true
                    }

                    // Test non-existing filter
                    const nonExistingFilterId = randomHx()
                    const exists =
                        await clientFiltering.isFilterRegistered(
                            nonExistingFilterId
                        )
                    expect(
                        exists,
                        `Filter ${nonExistingFilterId} should not exist`
                    ).to.be.false
                })
            })

            describe('getFiltersByPage', () => {
                it('should return all filters when requesting more than available', async () => {
                    const pageSize = MOCK_FILTERS.length * 2
                    const filters = (await clientFiltering.getFiltersByPage(
                        1,
                        pageSize
                    )) as IClientFiltering.FilterStructOutput[]

                    expect(filters).to.have.lengthOf(MOCK_FILTERS.length)
                    assertFiltersMatch(filters, MOCK_FILTERS)
                })

                it('should support pagination correctly', async () => {
                    const pageSize = 2

                    // First page
                    const firstPage = await clientFiltering.getFiltersByPage(
                        1,
                        pageSize
                    )
                    expect(firstPage).to.have.lengthOf(pageSize)
                    assertFiltersMatch(
                        firstPage,
                        MOCK_FILTERS.slice(0, pageSize)
                    )

                    // Second page
                    const secondPage = await clientFiltering.getFiltersByPage(
                        2,
                        pageSize
                    )
                    expect(secondPage).to.have.lengthOf(pageSize)
                    assertFiltersMatch(secondPage, MOCK_FILTERS.slice(2, 4))

                    // Third page (partial)
                    const thirdPage = await clientFiltering.getFiltersByPage(
                        3,
                        pageSize
                    )
                    expect(thirdPage).to.have.lengthOf(1)
                    assertFiltersMatch(thirdPage, MOCK_FILTERS.slice(4, 5))
                })

                it('should return empty array when requesting page beyond available data', async () => {
                    const emptyPage = await clientFiltering.getFiltersByPage(
                        2,
                        MOCK_FILTERS.length
                    )
                    expect(emptyPage).to.be.an('array').that.is.empty
                })
            })

            // Helper function to reduce code duplication
            function assertFiltersMatch(
                actualFilters: IClientFiltering.FilterStructOutput[],
                expectedFilters: IClientFiltering.FilterStruct[],
                startIndex = 0
            ): void {
                actualFilters.forEach((actualFilter, index) => {
                    const expectedFilter = expectedFilters[startIndex + index]
                    const filterIndex = startIndex + index

                    expect(
                        actualFilter[0],
                        `Filter ${filterIndex} ID mismatch`
                    ).to.deep.equal(expectedFilter.filterId)
                    expect(
                        actualFilter[1],
                        `Filter ${filterIndex} TYPE mismatch`
                    ).to.deep.equal(expectedFilter.filterType)
                    expect(
                        actualFilter[2],
                        `Filter ${filterIndex} transaction hash mismatch`
                    ).to.deep.equal(expectedFilter.transactionHash)
                    expect(
                        actualFilter[3],
                        `Filter ${filterIndex} contract address mismatch`
                    ).to.deep.equal(expectedFilter.contractAddress)
                    expect(
                        actualFilter[4],
                        `Filter ${filterIndex} signature mismatch`
                    ).to.deep.equal(expectedFilter.signature)
                    expect(
                        actualFilter[5],
                        `Filter ${filterIndex} jsonRpcMethod mismatch`
                    ).to.deep.equal(expectedFilter.jsonRpcMethod)
                    expect(
                        actualFilter[6],
                        `Filter ${filterIndex} initial block mismatch`
                    ).to.deep.equal(expectedFilter.initialBlock)
                    expect(
                        actualFilter[7],
                        `Filter ${filterIndex} end block mismatch`
                    ).to.deep.equal(expectedFilter.endBlock)
                })
            }
        })
    })
})
