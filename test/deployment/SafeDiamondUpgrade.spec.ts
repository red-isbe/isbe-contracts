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
import hre, { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { DEFAULT_FACETS } from '../../scripts/deployment/deployAllFacets'
import {
    FacetSelectionError,
    resolveFacetSelection,
} from '../../scripts/deployment/facetSelection'
import {
    DiamondUpgradeError,
    planFullReplacement,
    planPartialUpgrade,
    readDiamondState,
    runDiamondUpgrade,
    verifyDiamond,
    type CandidateFacet,
    type DiamondState,
    type PlanInput,
} from '../../scripts/deployment/safeDiamondUpgrade'
import {
    DEFAULT_ADMIN_ROLE,
    GOVERNANCE_MANAGER_ROLE,
} from '../../utils/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DID_OF = ethers.id('didOf(address)').slice(0, 10)
const IS_KNOWN_DID = ethers.id('isKnownDid(address)').slice(0, 10)
const HAS_ACTIVE_RELATIONSHIP = ethers
    .id('hasActiveRelationship(bytes32)')
    .slice(0, 10)
const LOUPE_FACETS = ethers.id('facets()').slice(0, 10)

function interfaceIdOf(signatures: string[]): string {
    const xor = signatures
        .map((s) => BigInt(ethers.id(s).slice(0, 10)))
        .reduce((a, b) => a ^ b, 0n)
    return '0x' + xor.toString(16).padStart(8, '0')
}

const DID_REGISTRY_QUERY_ID = interfaceIdOf([
    'isKnownDid(address)',
    'didOf(address)',
])
const DID_REGISTRY_QUERY_V2_ID = interfaceIdOf([
    'isKnownDid(address)',
    'didOf(address)',
    'hasActiveRelationship(bytes32)',
])

/** Silences the (verbose) console output of the deployment scripts */
async function quietly<T>(fn: () => Promise<T>): Promise<T> {
    const log = console.log
    const warn = console.warn
    console.log = () => undefined
    console.warn = () => undefined
    try {
        return await fn()
    } finally {
        console.log = log
        console.warn = warn
    }
}

/** Deploys a governance diamond with every ISBE facet, like the genesis one */
async function deployGovernanceDiamondFixture() {
    const [owner, other] = await ethers.getSigners()
    const facetAddresses: Record<string, string> = {}
    for (const name of DEFAULT_FACETS) {
        const facet = await (await ethers.getContractFactory(name)).deploy()
        facetAddresses[name] = (await facet.getAddress()).toLowerCase()
    }
    const diamondContract = await (
        await ethers.getContractFactory('EIP2535AccessControl')
    ).deploy(Object.values(facetAddresses), {
        rbacs: [
            { role: DEFAULT_ADMIN_ROLE, members: [owner.address] },
            { role: GOVERNANCE_MANAGER_ROLE, members: [owner.address] },
        ],
        init: ethers.ZeroAddress,
        initCalldata: '0x',
    })
    const diamond = await diamondContract.getAddress()
    return { owner, other, diamond, facetAddresses }
}

async function deployMock(name: string): Promise<string> {
    const mock = await (await ethers.getContractFactory(name)).deploy()
    return (await mock.getAddress()).toLowerCase()
}

async function snapshot(diamond: string): Promise<[string, string][]> {
    const state = await readDiamondState(hre, diamond)
    return [...state.selectorOwner.entries()].sort()
}

// ---------------------------------------------------------------------------
// Pure planning
// ---------------------------------------------------------------------------

describe('Safe diamond upgrade', function () {
    describe('resolveFacetSelection (--facets validation)', function () {
        it('returns undefined when no selection is given', function () {
            expect(resolveFacetSelection(undefined)).to.equal(undefined)
        })

        it('accepts known facet names', function () {
            expect(
                resolveFacetSelection(['DidRegistryQueryFacet'])
            ).to.deep.equal(['DidRegistryQueryFacet'])
        })

        it('rejects an empty list', function () {
            expect(() => resolveFacetSelection([])).to.throw(
                FacetSelectionError,
                'empty list'
            )
        })

        it('rejects a list where every name is unknown', function () {
            expect(() =>
                resolveFacetSelection(['HashTimestampFacet'])
            ).to.throw(
                FacetSelectionError,
                'Unknown facet(s) in --facets: HashTimestampFacet'
            )
        })

        it('rejects a list with one unknown name among known ones', function () {
            expect(() =>
                resolveFacetSelection(['DidRegistryQueryFacet', 'Nope'])
            ).to.throw(FacetSelectionError, 'Nope')
        })

        it('rejects duplicated names', function () {
            expect(() =>
                resolveFacetSelection([
                    'DidRegistryQueryFacet',
                    'DidRegistryQueryFacet',
                ])
            ).to.throw(FacetSelectionError, 'Duplicated')
        })

        it('rejects something that is not a list of names', function () {
            expect(() =>
                resolveFacetSelection('DidRegistryQueryFacet')
            ).to.throw(FacetSelectionError, 'JSON array')
            expect(() => resolveFacetSelection([1])).to.throw(
                FacetSelectionError,
                'facet names'
            )
        })
    })

    describe('planning', function () {
        const OLD_QUERY = '0x00000000000000000000000000000000000000a1'
        const NEW_QUERY = '0x00000000000000000000000000000000000000b1'
        const LOUPE = '0x00000000000000000000000000000000000000c1'
        const CUT = '0x00000000000000000000000000000000000000d1'
        const QUERY_ID = '0x' + '11'.repeat(32)
        const LOUPE_ID = '0x' + '22'.repeat(32)
        const CUT_ID = '0x' + '33'.repeat(32)

        function state(): DiamondState {
            const facets = [
                {
                    address: OLD_QUERY,
                    selectors: [DID_OF, IS_KNOWN_DID],
                    introspection: {
                        businessId: QUERY_ID,
                        selectors: [DID_OF, IS_KNOWN_DID],
                        interfaces: [DID_REGISTRY_QUERY_ID],
                    },
                },
                {
                    address: LOUPE,
                    selectors: [LOUPE_FACETS],
                    introspection: {
                        businessId: LOUPE_ID,
                        selectors: [LOUPE_FACETS],
                        interfaces: [],
                    },
                },
                {
                    address: CUT,
                    selectors: ['0x1f931c1c'],
                    introspection: {
                        businessId: CUT_ID,
                        selectors: ['0x1f931c1c'],
                        interfaces: [],
                    },
                },
            ]
            const selectorOwner = new Map<string, string>()
            facets.forEach((f) =>
                f.selectors.forEach((s) => selectorOwner.set(s, f.address))
            )
            return { facets, selectorOwner }
        }

        function input(
            facets: CandidateFacet[],
            overrides: Partial<PlanInput> = {}
        ): PlanInput {
            return {
                state: state(),
                facets,
                supportedInterfaces: new Set([DID_REGISTRY_QUERY_ID]),
                criticalSelectors: [LOUPE_FACETS, '0x1f931c1c'],
                allowRemove: false,
                ...overrides,
            }
        }

        const query = (
            selectors: string[],
            interfaces: string[] = [DID_REGISTRY_QUERY_ID],
            businessId = QUERY_ID
        ): CandidateFacet => ({
            name: 'DidRegistryQueryFacet',
            address: NEW_QUERY,
            introspection: { businessId, selectors, interfaces },
        })

        it('replaces existing functions and adds new ones', function () {
            const plan = planPartialUpgrade(
                input([
                    query(
                        [DID_OF, IS_KNOWN_DID, HAS_ACTIVE_RELATIONSHIP],
                        [DID_REGISTRY_QUERY_V2_ID]
                    ),
                ])
            )
            const [change] = plan.changes
            expect(change.previousAddress).to.equal(OLD_QUERY)
            expect(change.selectors.replace).to.have.members([
                DID_OF,
                IS_KNOWN_DID,
            ])
            expect(change.selectors.add).to.deep.equal([
                HAS_ACTIVE_RELATIONSHIP,
            ])
            expect(change.selectors.remove).to.deep.equal([])
            expect(change.interfaces.add).to.deep.equal([
                DID_REGISTRY_QUERY_V2_ID,
            ])
            expect(change.interfaces.remove).to.deep.equal([
                DID_REGISTRY_QUERY_ID,
            ])
            expect(plan.hasChanges).to.equal(true)
        })

        it('does nothing when the same contract is already installed', function () {
            const facet = query([DID_OF, IS_KNOWN_DID])
            facet.address = OLD_QUERY
            const plan = planPartialUpgrade(input([facet]))
            expect(plan.hasChanges).to.equal(false)
        })

        it('refuses to remove functions without allowRemove', function () {
            expect(() => planPartialUpgrade(input([query([DID_OF])]))).to.throw(
                DiamondUpgradeError,
                '--allow-remove'
            )
        })

        it('removes functions with allowRemove', function () {
            const plan = planPartialUpgrade(
                input([query([DID_OF])], { allowRemove: true })
            )
            expect(plan.changes[0].selectors.remove).to.deep.equal([
                IS_KNOWN_DID,
            ])
        })

        it('refuses to move a function from another facet', function () {
            expect(() =>
                planPartialUpgrade(
                    input([query([DID_OF, IS_KNOWN_DID, LOUPE_FACETS])])
                )
            ).to.throw(DiamondUpgradeError, 'never moves a function')
        })

        it('refuses to declare an interface another facet already has', function () {
            expect(() =>
                planPartialUpgrade(
                    input([
                        {
                            name: 'NewFacet',
                            address: NEW_QUERY,
                            introspection: {
                                businessId: '0x' + '44'.repeat(32),
                                selectors: [HAS_ACTIVE_RELATIONSHIP],
                                interfaces: [DID_REGISTRY_QUERY_ID],
                            },
                        },
                    ])
                )
            ).to.throw(DiamondUpgradeError, 'already supports')
        })

        it('refuses to leave the diamond without the loupe, even with allowRemove', function () {
            expect(() =>
                planPartialUpgrade(
                    input(
                        [
                            {
                                name: 'DiamondLoupeFacet',
                                address: NEW_QUERY,
                                introspection: {
                                    businessId: LOUPE_ID,
                                    selectors: ['0x01ffc9a7'],
                                    interfaces: [],
                                },
                            },
                        ],
                        { allowRemove: true }
                    )
                )
            ).to.throw(DiamondUpgradeError, 'could not be repaired')
        })

        describe('full replacement', function () {
            it('refuses a list without DiamondCut and DiamondLoupe', function () {
                // Same situation as `--facets '["DidRegistryQueryFacet"]'` with facetUpdates
                expect(() =>
                    planFullReplacement(
                        input([query([DID_OF, IS_KNOWN_DID])], {
                            allowRemove: true,
                        })
                    )
                ).to.throw(DiamondUpgradeError, 'could not be repaired')
            })

            it('refuses an empty list', function () {
                expect(() =>
                    planFullReplacement(input([], { allowRemove: true }))
                ).to.throw(DiamondUpgradeError, 'at least one facet')
            })

            it('refuses to silently drop functions of facets outside the list', function () {
                const loupe: CandidateFacet = {
                    name: 'DiamondLoupeFacet',
                    address: LOUPE,
                    introspection: state().facets[1]
                        .introspection as CandidateFacet['introspection'],
                }
                const cut: CandidateFacet = {
                    name: 'DiamondCutAccessControlFacet',
                    address: CUT,
                    introspection: state().facets[2]
                        .introspection as CandidateFacet['introspection'],
                }
                expect(() => planFullReplacement(input([loupe, cut]))).to.throw(
                    DiamondUpgradeError,
                    '--allow-remove'
                )
                const plan = planFullReplacement(
                    input([loupe, cut], { allowRemove: true })
                )
                expect(plan.otherRemovedSelectors[0].selectors).to.have.members(
                    [DID_OF, IS_KNOWN_DID]
                )
            })
        })
    })

    // -----------------------------------------------------------------------
    // Against a governance diamond on the Hardhat network
    // -----------------------------------------------------------------------

    describe('on a governance diamond', function () {
        this.timeout(300_000)

        it('ISBECORE-285 regression: upgrading only DidRegistryQueryFacet keeps every other facet', async function () {
            const { diamond, facetAddresses } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const before = await snapshot(diamond)

            const result = await quietly(() =>
                hre.run('updateDiamondFacets', {
                    diamond,
                    facets: ['DidRegistryQueryFacet'],
                })
            )

            expect(result.executed).to.equal(true)
            const newAddress = result.plan.changes[0].address.toLowerCase()
            expect(newAddress).to.not.equal(
                facetAddresses.DidRegistryQueryFacet
            )
            const after = new Map(await snapshot(diamond))
            expect(after.size).to.equal(before.length)
            for (const [selector, owner] of before) {
                const expected =
                    owner === facetAddresses.DidRegistryQueryFacet
                        ? newAddress
                        : owner
                expect(after.get(selector)).to.equal(expected)
            }
            const loupe = await ethers.getContractAt(
                'DiamondLoupeFacet',
                diamond
            )
            expect(
                await loupe.supportsInterface(DID_REGISTRY_QUERY_ID)
            ).to.equal(true)
        })

        for (const facets of [[], ['HashTimestampFacet'], ['Nope', 'Nope2']]) {
            it(`does nothing with --facets ${JSON.stringify(facets)}`, async function () {
                const { diamond } = await loadFixture(
                    deployGovernanceDiamondFixture
                )
                const before = await snapshot(diamond)
                const blockBefore = await ethers.provider.getBlockNumber()

                await expect(
                    quietly(() =>
                        hre.run('updateDiamondFacets', { diamond, facets })
                    )
                ).to.be.rejectedWith(FacetSelectionError)
                await expect(
                    quietly(() =>
                        hre.run('upgradeDiamondE2E', { diamond, facets })
                    )
                ).to.be.rejectedWith(FacetSelectionError)

                expect(await ethers.provider.getBlockNumber()).to.equal(
                    blockBefore
                )
                expect(await snapshot(diamond)).to.deep.equal(before)
            })
        }

        it('upgradeDiamondE2E also upgrades only the listed facet', async function () {
            const { diamond, facetAddresses } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const before = await snapshot(diamond)

            const result = await quietly(() =>
                hre.run('upgradeDiamondE2E', {
                    diamond,
                    facets: ['DidRegistryQueryFacet'],
                })
            )

            expect(result.success).to.equal(true)
            const after = new Map(await snapshot(diamond))
            for (const [selector, owner] of before) {
                if (owner === facetAddresses.DidRegistryQueryFacet) {
                    expect(after.get(selector)).to.not.equal(owner)
                } else {
                    expect(after.get(selector)).to.equal(owner)
                }
            }
        })

        it('dry-run shows the plan and sends nothing', async function () {
            const { diamond } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const before = await snapshot(diamond)
            const blockBefore = await ethers.provider.getBlockNumber()

            const result = await quietly(() =>
                hre.run('updateDiamondFacets', {
                    diamond,
                    facets: ['DidRegistryQueryFacet'],
                    dryRun: true,
                })
            )

            expect(result.executed).to.equal(false)
            expect(result.plan.changes[0].selectors.replace).to.have.members([
                DID_OF,
                IS_KNOWN_DID,
            ])
            expect(await ethers.provider.getBlockNumber()).to.equal(blockBefore)
            expect(await snapshot(diamond)).to.deep.equal(before)
        })

        it('a new version adds its new function and interface', async function () {
            const { diamond } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const mock = await deployMock('DidRegistryQueryFacetV2Mock')

            await quietly(() =>
                runDiamondUpgrade(hre, {
                    diamond,
                    facets: ['DidRegistryQueryFacetV2Mock'],
                    facetAddresses: [mock],
                    dryRun: false,
                    allowRemove: false,
                    skipVerification: false,
                })
            )

            const query = await ethers.getContractAt(
                'DidRegistryQueryFacetV2Mock',
                diamond
            )
            const [, someone] = await ethers.getSigners()
            expect(await query.didOf(someone.address)).to.equal(
                ethers.id('DidRegistryQueryV2')
            )
            expect(await query.hasActiveRelationship(ethers.ZeroHash)).to.equal(
                true
            )
            const loupe = await ethers.getContractAt(
                'DiamondLoupeFacet',
                diamond
            )
            expect(
                await loupe.supportsInterface(DID_REGISTRY_QUERY_V2_ID)
            ).to.equal(true)
            expect(
                await loupe.supportsInterface(DID_REGISTRY_QUERY_ID)
            ).to.equal(false)
        })

        it('removing a function needs --allow-remove', async function () {
            const { diamond } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const mock = await deployMock('DidRegistryQueryFacetReducedMock')
            const before = await snapshot(diamond)
            const options = {
                diamond,
                facets: ['DidRegistryQueryFacetReducedMock'],
                facetAddresses: [mock],
                dryRun: false,
                skipVerification: false,
            }

            await expect(
                quietly(() =>
                    runDiamondUpgrade(hre, { ...options, allowRemove: false })
                )
            ).to.be.rejectedWith(DiamondUpgradeError, '--allow-remove')
            expect(await snapshot(diamond)).to.deep.equal(before)

            await quietly(() =>
                runDiamondUpgrade(hre, { ...options, allowRemove: true })
            )
            const loupe = await ethers.getContractAt(
                'DiamondLoupeFacet',
                diamond
            )
            expect(await loupe.facetAddress(IS_KNOWN_DID)).to.equal(
                ethers.ZeroAddress
            )
            expect((await loupe.facetAddress(DID_OF)).toLowerCase()).to.equal(
                mock
            )
        })

        it('refuses a facet that claims a function of another facet', async function () {
            const { diamond } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const mock = await deployMock('DidRegistryQueryFacetCollisionMock')
            const before = await snapshot(diamond)

            await expect(
                quietly(() =>
                    runDiamondUpgrade(hre, {
                        diamond,
                        facets: ['DidRegistryQueryFacetCollisionMock'],
                        facetAddresses: [mock],
                        dryRun: false,
                        allowRemove: true,
                        skipVerification: false,
                    })
                )
            ).to.be.rejectedWith(DiamondUpgradeError, 'DiamondLoupeFacet')
            expect(await snapshot(diamond)).to.deep.equal(before)
        })

        it('refuses to remove the loupe functions, even with --allow-remove', async function () {
            const { diamond } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const mock = await deployMock('DiamondLoupeFacetReducedMock')
            const before = await snapshot(diamond)

            await expect(
                quietly(() =>
                    runDiamondUpgrade(hre, {
                        diamond,
                        facets: ['DiamondLoupeFacetReducedMock'],
                        facetAddresses: [mock],
                        dryRun: false,
                        allowRemove: true,
                        skipVerification: false,
                    })
                )
            ).to.be.rejectedWith(DiamondUpgradeError, 'could not be repaired')
            expect(await snapshot(diamond)).to.deep.equal(before)
        })

        it('the verification fails when a function does not point to its facet', async function () {
            const { diamond, facetAddresses } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const state = await readDiamondState(hre, diamond)
            const wrong: CandidateFacet = {
                name: 'DidRegistryQueryFacet',
                address: facetAddresses.DiamondLoupeFacet,
                introspection: {
                    businessId: '0x' + '00'.repeat(32),
                    selectors: [DID_OF],
                    interfaces: [],
                },
            }
            const verification = await verifyDiamond(
                hre,
                diamond,
                {
                    mode: 'partial',
                    changes: [],
                    otherRemovedSelectors: [],
                    hasChanges: true,
                },
                [wrong],
                state,
                []
            )
            expect(verification.ok).to.equal(false)
            expect(verification.problems[0]).to.contain(DID_OF)
        })

        it('full replacement without --facets still installs every ISBE facet', async function () {
            const { diamond } = await loadFixture(
                deployGovernanceDiamondFixture
            )
            const before = await snapshot(diamond)

            const result = await quietly(() =>
                hre.run('updateDiamondFacets', { diamond })
            )

            expect(result.plan.mode).to.equal('full')
            expect(result.verification.ok).to.equal(true)
            const after = await snapshot(diamond)
            expect(after.map(([s]) => s)).to.have.members(
                before.map(([s]) => s)
            )
        })
    })
})
