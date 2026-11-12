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
/**
 * Safe upgrade of the ISBE governance diamond.
 *
 * Two modes:
 *
 * - Partial upgrade (`--facets` given): only the selected facets change. The tool
 *   reads the current diamond with the loupe, matches every new facet with the
 *   installed one through `businessIdIntrospection()` and builds a standard
 *   EIP-2535 `diamondCut` (Add / Replace / Remove) plus an `interfaceCut`.
 *   `facetUpdates` is never used in this mode, because it wipes every selector
 *   and interface before installing the facets it receives.
 *
 * - Full replacement (no `--facets`): every ISBE facet is redeployed and
 *   installed with `facetUpdates`, as before, but only after checking that the
 *   result keeps the diamond operable.
 *
 * In both modes:
 * - the diamond can never lose DiamondCut or DiamondLoupe functions;
 * - functions are never removed unless `allowRemove` is set;
 * - a function is never moved from one facet to a different one;
 * - every transaction is simulated with `staticCall` before being sent;
 * - the final report reads the real diamond and fails if it does not match.
 */
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import type { ContractTransactionResponse } from 'ethers'
import type { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'
import {
    deployAllFacets,
    DEFAULT_FACETS,
    type FacetDeploymentResult,
} from './deployAllFacets'
import { FACET_RESOLVER_KEYS } from './facetResolverKeys'

// ============================================================================
// Types
// ============================================================================

export const ITEM_CUT_ACTION = { Add: 0, Replace: 1, Remove: 2 } as const

export interface ItemCut {
    facetAddress: string
    action: number
    items: string[]
}

/** Data a facet declares about itself through IEIP2535Introspection */
export interface FacetIntrospection {
    businessId: string
    selectors: string[]
    interfaces: string[]
}

/** A facet that is currently installed in the diamond */
export interface InstalledFacet {
    address: string
    selectors: string[]
    /** Undefined when the facet does not answer IEIP2535Introspection */
    introspection?: FacetIntrospection
}

/** Current state of the diamond, as returned by the loupe */
export interface DiamondState {
    facets: InstalledFacet[]
    /** selector -> facet address (lowercase) */
    selectorOwner: Map<string, string>
}

/** A facet that the operator wants to install */
export interface CandidateFacet {
    name: string
    /** Undefined while the facet is not deployed yet (dry-run) */
    address?: string
    introspection: FacetIntrospection
}

export interface ItemChanges {
    add: string[]
    replace: string[]
    remove: string[]
}

export interface FacetChange {
    name: string
    businessId: string
    address?: string
    previousAddress?: string
    selectors: ItemChanges
    interfaces: ItemChanges
}

export interface UpgradePlan {
    mode: 'partial' | 'full'
    changes: FacetChange[]
    /** Full mode only: selectors of facets outside the new list that would disappear */
    otherRemovedSelectors: { facetAddress: string; selectors: string[] }[]
    hasChanges: boolean
}

export interface PlanInput {
    state: DiamondState
    facets: CandidateFacet[]
    /** Interface ids the diamond supports today (lowercase) */
    supportedInterfaces: ReadonlySet<string>
    /** Selectors the diamond must always keep (DiamondCut + DiamondLoupe) */
    criticalSelectors: readonly string[]
    allowRemove: boolean
    /** Optional pretty printer for selectors in error messages */
    describeSelector?: (selector: string) => string
}

/**
 * Raised when an upgrade would leave the diamond in a bad state, or when the
 * diamond is not as expected after the upgrade. `problems` lists every issue.
 */
export class DiamondUpgradeError extends Error {
    readonly problems: string[]

    constructor(summary: string, problems: string[]) {
        super(`${summary}\n   - ${problems.join('\n   - ')}`)
        this.name = 'DiamondUpgradeError'
        this.problems = problems
    }
}

// ============================================================================
// Pure planning (no network access)
// ============================================================================

const norm = (value: string): string => value.toLowerCase()

function emptyChanges(): ItemChanges {
    return { add: [], replace: [], remove: [] }
}

function hasItemChanges(changes: ItemChanges): boolean {
    return (
        changes.add.length > 0 ||
        changes.replace.length > 0 ||
        changes.remove.length > 0
    )
}

function findInstalled(
    state: DiamondState,
    businessId: string
): InstalledFacet[] {
    return state.facets.filter(
        (facet) =>
            facet.introspection !== undefined &&
            norm(facet.introspection.businessId) === norm(businessId)
    )
}

function describeOwner(state: DiamondState, owner: string): string {
    const facet = state.facets.find((f) => norm(f.address) === norm(owner))
    const businessId = facet?.introspection?.businessId
    const label = businessId ? facetLabel(businessId) : 'unknown facet'
    return `${label} (${owner})`
}

/** Checks shared by both modes on the list of candidate facets */
function checkCandidates(
    facets: CandidateFacet[],
    describe: (selector: string) => string
): string[] {
    const problems: string[] = []

    const businessIds = new Map<string, string>()
    const selectorOwners = new Map<string, string>()
    const interfaceOwners = new Map<string, string>()

    for (const facet of facets) {
        const businessId = norm(facet.introspection.businessId)
        const previous = businessIds.get(businessId)
        if (previous !== undefined) {
            problems.push(
                `${facet.name} and ${previous} have the same business id ${businessId}`
            )
        }
        businessIds.set(businessId, facet.name)

        if (facet.introspection.selectors.length === 0) {
            problems.push(`${facet.name} declares no functions`)
        }

        for (const selector of facet.introspection.selectors.map(norm)) {
            const owner = selectorOwners.get(selector)
            if (owner !== undefined && owner !== facet.name) {
                problems.push(
                    `Function ${describe(selector)} is declared by both ${owner} and ${facet.name}`
                )
            }
            selectorOwners.set(selector, facet.name)
        }

        for (const interfaceId of facet.introspection.interfaces.map(norm)) {
            const owner = interfaceOwners.get(interfaceId)
            if (owner !== undefined && owner !== facet.name) {
                problems.push(
                    `Interface ${interfaceId} is declared by both ${owner} and ${facet.name}`
                )
            }
            interfaceOwners.set(interfaceId, facet.name)
        }
    }

    return problems
}

/** R4: DiamondCut and DiamondLoupe functions must survive any upgrade */
function checkCriticalSelectors(
    finalSelectors: ReadonlySet<string>,
    criticalSelectors: readonly string[],
    describe: (selector: string) => string
): string[] {
    return criticalSelectors
        .map(norm)
        .filter((selector) => !finalSelectors.has(selector))
        .map(
            (selector) =>
                `The diamond would lose ${describe(selector)}, which DiamondCut/DiamondLoupe need. ` +
                'The diamond could not be repaired afterwards.'
        )
}

/**
 * Builds the plan of a partial upgrade: only the given facets change.
 * Throws DiamondUpgradeError when the upgrade is not safe.
 */
export function planPartialUpgrade(input: PlanInput): UpgradePlan {
    const { state, facets, supportedInterfaces, allowRemove } = input
    const describe = input.describeSelector ?? ((s: string) => s)
    const problems = checkCandidates(facets, describe)

    if (facets.length === 0) {
        problems.push('No facets to upgrade')
    }

    const changes: FacetChange[] = []
    const finalSelectors = new Set(state.selectorOwner.keys())

    for (const facet of facets) {
        const businessId = facet.introspection.businessId
        const installed = findInstalled(state, businessId)

        if (installed.length > 1) {
            problems.push(
                `${facet.name}: ${installed.length} installed facets share business id ${businessId} ` +
                    `(${installed.map((f) => f.address).join(', ')}). Cannot tell which one to replace.`
            )
            continue
        }

        const previous = installed[0]
        const previousAddress = previous ? norm(previous.address) : undefined
        const newAddress = facet.address ? norm(facet.address) : undefined
        const change: FacetChange = {
            name: facet.name,
            businessId,
            address: facet.address,
            previousAddress: previous?.address,
            selectors: emptyChanges(),
            interfaces: emptyChanges(),
        }

        // Same contract already installed: nothing to do for this facet
        if (newAddress !== undefined && newAddress === previousAddress) {
            changes.push(change)
            continue
        }

        // --- Functions -------------------------------------------------
        const newSelectors = facet.introspection.selectors.map(norm)
        for (const selector of newSelectors) {
            const owner = state.selectorOwner.get(selector)
            if (owner === undefined) {
                change.selectors.add.push(selector)
            } else if (newAddress !== undefined && owner === newAddress) {
                // Already served by this exact contract
            } else if (owner === previousAddress) {
                change.selectors.replace.push(selector)
            } else {
                problems.push(
                    `${facet.name} declares ${describe(selector)}, which today belongs to ` +
                        `${describeOwner(state, owner)}. A partial upgrade never moves a function ` +
                        'from one facet to another.'
                )
            }
        }

        if (previous) {
            const kept = new Set(newSelectors)
            change.selectors.remove = previous.selectors
                .map(norm)
                .filter((selector) => !kept.has(selector))
            if (change.selectors.remove.length > 0 && !allowRemove) {
                problems.push(
                    `${facet.name} no longer declares ${change.selectors.remove.map(describe).join(', ')}. ` +
                        'Removing functions requires --allow-remove.'
                )
            }
        }

        change.selectors.add.forEach((s) => finalSelectors.add(s))
        if (allowRemove) {
            change.selectors.remove.forEach((s) => finalSelectors.delete(s))
        }

        // --- Interfaces (ERC-165) ---------------------------------------
        const newInterfaces = facet.introspection.interfaces.map(norm)
        const previousInterfaces = new Set(
            (previous?.introspection?.interfaces ?? []).map(norm)
        )
        for (const interfaceId of newInterfaces) {
            const supported = supportedInterfaces.has(interfaceId)
            if (previousInterfaces.has(interfaceId)) {
                if (supported) change.interfaces.replace.push(interfaceId)
                else change.interfaces.add.push(interfaceId)
            } else if (supported) {
                problems.push(
                    `${facet.name} declares interface ${interfaceId}, which the diamond already ` +
                        'supports through another facet'
                )
            } else {
                change.interfaces.add.push(interfaceId)
            }
        }
        const declared = new Set(newInterfaces)
        change.interfaces.remove = [...previousInterfaces].filter(
            (id) => !declared.has(id) && supportedInterfaces.has(id)
        )

        changes.push(change)
    }

    problems.push(
        ...checkCriticalSelectors(
            finalSelectors,
            input.criticalSelectors,
            describe
        )
    )

    if (problems.length > 0) {
        throw new DiamondUpgradeError(
            'Partial upgrade rejected. The diamond was not changed.',
            problems
        )
    }

    return {
        mode: 'partial',
        changes,
        otherRemovedSelectors: [],
        hasChanges: changes.some(
            (c) => hasItemChanges(c.selectors) || hasItemChanges(c.interfaces)
        ),
    }
}

/**
 * Builds the plan of a full replacement (`facetUpdates`): the diamond ends up
 * with exactly the given facets. Throws DiamondUpgradeError when that would
 * break the diamond or silently remove functions.
 */
export function planFullReplacement(input: PlanInput): UpgradePlan {
    const { state, facets, allowRemove } = input
    const describe = input.describeSelector ?? ((s: string) => s)
    const problems = checkCandidates(facets, describe)

    if (facets.length === 0) {
        problems.push('A full replacement needs at least one facet')
    }

    const finalSelectors = new Set(
        facets.flatMap((f) => f.introspection.selectors.map(norm))
    )
    problems.push(
        ...checkCriticalSelectors(
            finalSelectors,
            input.criticalSelectors,
            describe
        )
    )

    const matched = new Set<string>()
    const changes: FacetChange[] = facets.map((facet) => {
        const installed = findInstalled(state, facet.introspection.businessId)
        installed.forEach((f) => matched.add(norm(f.address)))
        const previousSelectors = new Set(
            installed.flatMap((f) => f.selectors.map(norm))
        )
        const previousInterfaces = new Set(
            installed.flatMap((f) =>
                (f.introspection?.interfaces ?? []).map(norm)
            )
        )
        const newSelectors = facet.introspection.selectors.map(norm)
        const newInterfaces = facet.introspection.interfaces.map(norm)
        return {
            name: facet.name,
            businessId: facet.introspection.businessId,
            address: facet.address,
            previousAddress: installed[0]?.address,
            selectors: {
                add: newSelectors.filter((s) => !state.selectorOwner.has(s)),
                replace: newSelectors.filter((s) => state.selectorOwner.has(s)),
                remove: [...previousSelectors].filter(
                    (s) => !finalSelectors.has(s)
                ),
            },
            interfaces: {
                add: newInterfaces.filter((i) => !previousInterfaces.has(i)),
                replace: newInterfaces.filter((i) => previousInterfaces.has(i)),
                remove: [...previousInterfaces].filter(
                    (i) => !newInterfaces.includes(i)
                ),
            },
        }
    })

    const otherRemovedSelectors = state.facets
        .filter((f) => !matched.has(norm(f.address)))
        .map((f) => ({
            facetAddress: f.address,
            selectors: f.selectors
                .map(norm)
                .filter((s) => !finalSelectors.has(s)),
        }))
        .filter((f) => f.selectors.length > 0)

    const removed = [
        ...changes.flatMap((c) => c.selectors.remove),
        ...otherRemovedSelectors.flatMap((f) => f.selectors),
    ]
    if (removed.length > 0 && !allowRemove) {
        const owned = removed.map((selector) => {
            const owner = state.selectorOwner.get(selector)
            return owner
                ? `${describe(selector)} (today in ${describeOwner(state, owner)})`
                : describe(selector)
        })
        problems.push(
            `The full replacement would remove ${removed.length} function(s) that exist today: ` +
                `${owned.join(', ')}. Removing functions requires --allow-remove.`
        )
    }

    if (problems.length > 0) {
        throw new DiamondUpgradeError(
            'Full replacement rejected. The diamond was not changed.',
            problems
        )
    }

    return { mode: 'full', changes, otherRemovedSelectors, hasChanges: true }
}

/**
 * Turns a partial plan into the `diamondCut` and `interfaceCut` arguments.
 * Every facet must have its final address.
 */
export function buildItemCuts(plan: UpgradePlan): {
    selectorCuts: ItemCut[]
    interfaceCuts: ItemCut[]
} {
    const zero = '0x0000000000000000000000000000000000000000'
    const selectorCuts: ItemCut[] = []
    const interfaceCuts: ItemCut[] = []

    const push = (
        cuts: ItemCut[],
        address: string,
        changes: ItemChanges
    ): void => {
        if (changes.replace.length > 0) {
            cuts.push({
                facetAddress: address,
                action: ITEM_CUT_ACTION.Replace,
                items: changes.replace,
            })
        }
        if (changes.add.length > 0) {
            cuts.push({
                facetAddress: address,
                action: ITEM_CUT_ACTION.Add,
                items: changes.add,
            })
        }
        if (changes.remove.length > 0) {
            cuts.push({
                facetAddress: zero,
                action: ITEM_CUT_ACTION.Remove,
                items: changes.remove,
            })
        }
    }

    for (const change of plan.changes) {
        if (!change.address) {
            throw new Error(`${change.name} has no address yet`)
        }
        push(selectorCuts, change.address, change.selectors)
        push(interfaceCuts, change.address, change.interfaces)
    }

    return { selectorCuts, interfaceCuts }
}

// ============================================================================
// Reading the network
// ============================================================================

const INTROSPECTION_ABI = [
    'function selectorsIntrospection() view returns (bytes4[])',
    'function interfacesIntrospection() view returns (bytes4[])',
    'function businessIdIntrospection() view returns (bytes32)',
]

/** Fake address used to run facet code through `eth_call` state overrides */
const PROBE_ADDRESS = '0x00000000000000000000000000000000000c0dE1'

/** The node does not accept `eth_call` state overrides */
export class StateOverrideUnsupportedError extends Error {
    constructor(cause: string, facetName?: string) {
        super(
            `The node could not simulate ${facetName ?? 'the facet'} with an eth_call state override (${cause}). ` +
                'Deploy the facets first with `deployFacets` and pass them with --facet-addresses ' +
                'to get an exact dry-run.'
        )
        this.name = 'StateOverrideUnsupportedError'
    }
}

async function callIntrospection(
    hre: HardhatRuntimeEnvironment,
    address: string,
    code?: string
): Promise<FacetIntrospection> {
    const iface = new hre.ethers.Interface(INTROSPECTION_ABI)
    const call = async (fn: string): Promise<string> => {
        const data = iface.encodeFunctionData(fn)
        if (code === undefined) {
            return hre.ethers.provider.call({ to: address, data })
        }
        return (await hre.network.provider.request({
            method: 'eth_call',
            params: [{ to: address, data }, 'latest', { [address]: { code } }],
        })) as string
    }

    // Sequential on purpose: some nodes reject concurrent calls with state overrides
    const selectors = await call('selectorsIntrospection')
    const interfaces = await call('interfacesIntrospection')
    const businessId = await call('businessIdIntrospection')

    return {
        selectors: (
            iface.decodeFunctionResult(
                'selectorsIntrospection',
                selectors
            )[0] as string[]
        ).map(norm),
        interfaces: (
            iface.decodeFunctionResult(
                'interfacesIntrospection',
                interfaces
            )[0] as string[]
        ).map(norm),
        businessId: norm(
            iface.decodeFunctionResult(
                'businessIdIntrospection',
                businessId
            )[0] as string
        ),
    }
}

/** Introspects an already deployed facet */
export async function introspectDeployedFacet(
    hre: HardhatRuntimeEnvironment,
    address: string
): Promise<FacetIntrospection> {
    const code = await hre.ethers.provider.getCode(address)
    if (code === '0x') {
        throw new Error(`There is no contract at ${address}`)
    }
    return callIntrospection(hre, address)
}

/**
 * Introspects a facet from its compiled artifact without deploying it, by
 * running its runtime code through an `eth_call` state override.
 */
export async function introspectFacetArtifact(
    hre: HardhatRuntimeEnvironment,
    facetName: string
): Promise<FacetIntrospection> {
    const artifact = await hre.artifacts.readArtifact(facetName)
    try {
        return await callIntrospection(
            hre,
            PROBE_ADDRESS,
            artifact.deployedBytecode
        )
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new StateOverrideUnsupportedError(message, facetName)
    }
}

/** Reads the diamond through its loupe and introspects every installed facet */
export async function readDiamondState(
    hre: HardhatRuntimeEnvironment,
    diamond: string
): Promise<DiamondState> {
    const loupe = await hre.ethers.getContractAt('DiamondLoupeFacet', diamond)

    let facets: { facetAddress: string; functionSelectors: string[] }[]
    try {
        facets = await loupe.facets()
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(
            `Cannot read the diamond at ${diamond} through its loupe (${message}). ` +
                'Refusing to change a diamond whose state cannot be read.'
        )
    }

    const selectorOwner = new Map<string, string>()
    const installed: InstalledFacet[] = []
    for (const facet of facets) {
        const address = norm(facet.facetAddress)
        const selectors = facet.functionSelectors.map(norm)
        selectors.forEach((selector) => selectorOwner.set(selector, address))

        let introspection: FacetIntrospection | undefined
        try {
            introspection = await callIntrospection(hre, address)
        } catch {
            introspection = undefined
        }
        installed.push({ address, selectors, introspection })
    }

    return { facets: installed, selectorOwner }
}

async function readSupportedInterfaces(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    interfaceIds: Iterable<string>
): Promise<Set<string>> {
    const loupe = await hre.ethers.getContractAt('DiamondLoupeFacet', diamond)
    const supported = new Set<string>()
    for (const interfaceId of new Set(interfaceIds)) {
        if (await loupe.supportsInterface(interfaceId)) {
            supported.add(norm(interfaceId))
        }
    }
    return supported
}

/** Selectors of IDiamondCut, IDiamondLoupe and ERC-165 `supportsInterface` */
export async function getCriticalSelectors(
    hre: HardhatRuntimeEnvironment
): Promise<string[]> {
    const selectors: string[] = []
    for (const name of ['IDiamondCut', 'IDiamondLoupe']) {
        const artifact = await hre.artifacts.readArtifact(name)
        const iface = new hre.ethers.Interface(artifact.abi)
        iface.forEachFunction((fn) => selectors.push(norm(fn.selector)))
    }
    selectors.push('0x01ffc9a7') // supportsInterface(bytes4)
    return [...new Set(selectors)]
}

/** Builds a selector -> "name(args)" dictionary for readable messages */
async function buildSelectorDictionary(
    hre: HardhatRuntimeEnvironment,
    contractNames: readonly string[]
): Promise<(selector: string) => string> {
    const names = new Map<string, string>()
    for (const name of contractNames) {
        try {
            const artifact = await hre.artifacts.readArtifact(name)
            const iface = new hre.ethers.Interface(artifact.abi)
            iface.forEachFunction((fn) =>
                names.set(norm(fn.selector), fn.format('sighash'))
            )
        } catch {
            // Unknown artifact: selectors are shown as raw hex
        }
    }
    return (selector: string) => {
        const name = names.get(norm(selector))
        return name ? `${name} [${norm(selector)}]` : norm(selector)
    }
}

function facetLabel(businessId: string): string {
    const entry = Object.entries(FACET_RESOLVER_KEYS).find(
        ([, key]) => norm(key) === norm(businessId)
    )
    return entry ? entry[0] : `business id ${businessId}`
}

// ============================================================================
// Reporting
// ============================================================================

export function printPlan(
    plan: UpgradePlan,
    describe: (selector: string) => string = (s) => s
): void {
    const title =
        plan.mode === 'partial'
            ? 'PARTIAL UPGRADE PLAN (diamondCut + interfaceCut)'
            : 'FULL REPLACEMENT PLAN (facetUpdates)'
    console.log(`\n📋 ${title}`)

    const printItems = (
        label: string,
        items: string[],
        format: (s: string) => string
    ): void => {
        if (items.length === 0) return
        console.log(`      ${label}:`)
        items.forEach((item) => console.log(`         ${format(item)}`))
    }

    for (const change of plan.changes) {
        const from = change.previousAddress ?? 'not installed'
        const to = change.address ?? '(to be deployed)'
        console.log(`\n   • ${change.name}`)
        console.log(`      ${from} → ${to}`)
        const nothing =
            !hasItemChanges(change.selectors) &&
            !hasItemChanges(change.interfaces)
        if (nothing) {
            console.log('      No changes (already installed)')
            continue
        }
        printItems('+ functions added', change.selectors.add, describe)
        printItems('~ functions replaced', change.selectors.replace, describe)
        printItems('- functions removed', change.selectors.remove, describe)
        printItems('+ interfaces added', change.interfaces.add, (s) => s)
        printItems('~ interfaces replaced', change.interfaces.replace, (s) => s)
        printItems('- interfaces removed', change.interfaces.remove, (s) => s)
    }

    for (const other of plan.otherRemovedSelectors) {
        console.log(`\n   • Facet outside the list: ${other.facetAddress}`)
        printItems('- functions removed', other.selectors, describe)
    }
    console.log('')
}

// ============================================================================
// Verification (R7)
// ============================================================================

export interface VerificationResult {
    ok: boolean
    problems: string[]
}

/**
 * Reads the real diamond and checks that:
 * - every function declared by every new facet points to that facet;
 * - every interface declared by every new facet is supported;
 * - DiamondCut and DiamondLoupe functions are present;
 * - (partial) removed functions are gone and every other function is untouched.
 */
export async function verifyDiamond(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    plan: UpgradePlan,
    facets: CandidateFacet[],
    before: DiamondState,
    criticalSelectors: readonly string[],
    describe: (selector: string) => string = (s) => s
): Promise<VerificationResult> {
    const problems: string[] = []

    let after: DiamondState
    try {
        after = await readDiamondState(hre, diamond)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return { ok: false, problems: [message] }
    }

    for (const facet of facets) {
        const address = norm(facet.address ?? '')
        for (const selector of facet.introspection.selectors.map(norm)) {
            const owner = after.selectorOwner.get(selector)
            if (owner !== address) {
                problems.push(
                    `${describe(selector)} of ${facet.name} points to ${owner ?? 'nothing'} instead of ${address}`
                )
            }
        }
    }

    const declaredInterfaces = facets.flatMap((f) =>
        f.introspection.interfaces.map(norm)
    )
    const supported = await readSupportedInterfaces(
        hre,
        diamond,
        declaredInterfaces
    )
    for (const interfaceId of declaredInterfaces) {
        if (interfaceId === '0xffffffff') continue
        if (!supported.has(interfaceId)) {
            problems.push(`Interface ${interfaceId} is not supported`)
        }
    }

    for (const selector of criticalSelectors.map(norm)) {
        if (!after.selectorOwner.has(selector)) {
            problems.push(`Critical function ${describe(selector)} is missing`)
        }
    }

    if (plan.mode === 'partial') {
        const touched = new Set<string>()
        for (const change of plan.changes) {
            change.selectors.add.forEach((s) => touched.add(s))
            change.selectors.replace.forEach((s) => touched.add(s))
            change.selectors.remove.forEach((s) => touched.add(s))
            change.selectors.remove.forEach((s) => {
                if (after.selectorOwner.has(s)) {
                    problems.push(`${describe(s)} should have been removed`)
                }
            })
        }
        for (const [selector, owner] of before.selectorOwner) {
            if (touched.has(selector)) continue
            if (after.selectorOwner.get(selector) !== owner) {
                problems.push(
                    `${describe(selector)} was not part of the upgrade but changed from ${owner} ` +
                        `to ${after.selectorOwner.get(selector) ?? 'nothing'}`
                )
            }
        }
    }

    return { ok: problems.length === 0, problems }
}

// ============================================================================
// Orchestration
// ============================================================================

export interface DiamondUpgradeOptions {
    diamond: string
    /** Validated facet names (see resolveFacetSelection). Undefined: full replacement */
    facets?: string[]
    /** Already deployed facets, in the same order as the facet names */
    facetAddresses?: string[]
    dryRun: boolean
    allowRemove: boolean
    skipVerification: boolean
    signatureProvider?: ISignatureProvider
}

export interface DiamondUpgradeResult {
    plan: UpgradePlan
    deployed: FacetDeploymentResult[]
    executed: boolean
    transactionHashes: string[]
    verification?: VerificationResult
}

function isAddress(value: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(value)
}

async function sendAndWait(
    send: () => Promise<ContractTransactionResponse>,
    label: string
): Promise<string> {
    console.log(`📡 Sending ${label}...`)
    const tx = await send()
    // Same waiting strategy as the other diamond scripts (see getEvent)
    const receipt = await tx.wait()
    if (!receipt || receipt.status !== 1) {
        throw new Error(`${label} transaction ${tx.hash} failed`)
    }
    console.log(`   ✅ ${label} mined: ${tx.hash}`)
    return tx.hash
}

/**
 * Runs a safe diamond upgrade. Throws before deploying or sending anything when
 * the plan is not safe, and throws after the upgrade when the real diamond does
 * not match the plan.
 */
export async function runDiamondUpgrade(
    hre: HardhatRuntimeEnvironment,
    options: DiamondUpgradeOptions
): Promise<DiamondUpgradeResult> {
    const { diamond, dryRun, allowRemove, skipVerification } = options
    const mode = options.facets === undefined ? 'full' : 'partial'
    const names = options.facets ?? [...DEFAULT_FACETS]

    if (!isAddress(diamond)) {
        throw new Error(`Invalid diamond address: ${diamond}`)
    }
    if (options.facetAddresses !== undefined) {
        if (options.facetAddresses.length !== names.length) {
            throw new Error(
                `Mismatch: ${names.length} facet names but ${options.facetAddresses.length} addresses provided`
            )
        }
        options.facetAddresses.forEach((address, index) => {
            if (!isAddress(address)) {
                throw new Error(
                    `Invalid facet address at index ${index}: ${address}`
                )
            }
        })
    }

    const describe = await buildSelectorDictionary(hre, [
        ...DEFAULT_FACETS,
        ...names,
    ])
    const criticalSelectors = await getCriticalSelectors(hre)

    console.log('🔍 Reading current diamond state...')
    const before = await readDiamondState(hre, diamond)
    console.log(
        `   ${before.facets.length} facets, ${before.selectorOwner.size} functions installed`
    )

    // --- Introspect the new facets before deploying anything -----------
    let candidates: CandidateFacet[] | undefined
    if (options.facetAddresses !== undefined) {
        candidates = []
        for (let i = 0; i < names.length; i++) {
            const address = options.facetAddresses[i]
            const introspection = await introspectDeployedFacet(hre, address)
            const expected = FACET_RESOLVER_KEYS[names[i]]
            if (
                expected !== undefined &&
                norm(expected) !== introspection.businessId
            ) {
                throw new Error(
                    `The contract at ${address} is not ${names[i]} (business id ${introspection.businessId}). ` +
                        'Check the order of --facet-addresses.'
                )
            }
            candidates.push({ name: names[i], address, introspection })
        }
    } else {
        try {
            candidates = []
            for (const name of names) {
                candidates.push({
                    name,
                    introspection: await introspectFacetArtifact(hre, name),
                })
            }
        } catch (error: unknown) {
            if (!(error instanceof StateOverrideUnsupportedError)) throw error
            if (dryRun) throw error
            console.log(
                '   ⚠️  The node cannot simulate undeployed facets; the plan will be ' +
                    'checked right after deploying them, before touching the diamond.'
            )
            candidates = undefined
        }
    }

    const plan = async (facets: CandidateFacet[]): Promise<UpgradePlan> => {
        const interfaceIds = [
            ...facets.flatMap((f) => f.introspection.interfaces),
            ...before.facets.flatMap((f) => f.introspection?.interfaces ?? []),
        ]
        const input: PlanInput = {
            state: before,
            facets,
            supportedInterfaces: await readSupportedInterfaces(
                hre,
                diamond,
                interfaceIds
            ),
            criticalSelectors,
            allowRemove,
            describeSelector: describe,
        }
        return mode === 'partial'
            ? planPartialUpgrade(input)
            : planFullReplacement(input)
    }

    let currentPlan: UpgradePlan | undefined
    if (candidates !== undefined) {
        currentPlan = await plan(candidates)
        printPlan(currentPlan, describe)
    }

    if (dryRun) {
        console.log('🔍 DRY RUN: nothing was deployed or sent.')
        return {
            plan: currentPlan as UpgradePlan,
            deployed: [],
            executed: false,
            transactionHashes: [],
        }
    }

    if (currentPlan !== undefined && !currentPlan.hasChanges) {
        console.log(
            '✅ The diamond already has these facets. Nothing to deploy or send.'
        )
        return {
            plan: currentPlan,
            deployed: [],
            executed: false,
            transactionHashes: [],
        }
    }

    const signatureProvider =
        options.signatureProvider ?? SignatureProviderFactory.create(hre)

    // --- Deploy --------------------------------------------------------
    let deployed: FacetDeploymentResult[] = []
    let finalCandidates: CandidateFacet[]
    if (options.facetAddresses !== undefined) {
        finalCandidates = candidates as CandidateFacet[]
    } else {
        const result = await deployAllFacets(
            hre,
            names,
            undefined,
            signatureProvider
        )
        deployed = result.facets
        finalCandidates = []
        for (let i = 0; i < names.length; i++) {
            const address = result.facetAddresses[i]
            const introspection = await introspectDeployedFacet(hre, address)
            const simulated = candidates?.[i]?.introspection
            if (
                simulated !== undefined &&
                JSON.stringify(simulated) !== JSON.stringify(introspection)
            ) {
                throw new Error(
                    `${names[i]} deployed at ${address} does not match its artifact. Diamond not changed.`
                )
            }
            finalCandidates.push({ name: names[i], address, introspection })
        }
    }

    // Plan again with the real addresses (also the first plan when the node
    // cannot simulate undeployed code). Throws before sending anything.
    const finalPlan = await plan(finalCandidates)
    if (currentPlan === undefined) {
        printPlan(finalPlan, describe)
    }

    // --- Simulate and send ---------------------------------------------
    const signer = await signatureProvider.getSigner()
    const cut = await hre.ethers.getContractAt(
        'DiamondCutAccessControlFacet',
        diamond,
        signer
    )
    const zero = hre.ethers.ZeroAddress
    const transactionHashes: string[] = []

    if (finalPlan.mode === 'partial') {
        const { selectorCuts, interfaceCuts } = buildItemCuts(finalPlan)
        console.log('🧪 Simulating transactions...')
        if (selectorCuts.length > 0) {
            await cut.diamondCut.staticCall(selectorCuts, zero, '0x')
        }
        if (interfaceCuts.length > 0) {
            await cut.interfaceCut.staticCall(interfaceCuts)
        }
        if (selectorCuts.length > 0) {
            transactionHashes.push(
                await sendAndWait(
                    () => cut.diamondCut(selectorCuts, zero, '0x'),
                    'diamondCut'
                )
            )
        }
        if (interfaceCuts.length > 0) {
            try {
                transactionHashes.push(
                    await sendAndWait(
                        () => cut.interfaceCut(interfaceCuts),
                        'interfaceCut'
                    )
                )
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : String(error)
                throw new Error(
                    `The functions were upgraded but interfaceCut failed (${message}). ` +
                        'ERC-165 interfaces are NOT up to date.'
                )
            }
        }
    } else {
        const addresses = finalCandidates.map((f) => f.address as string)
        console.log('🧪 Simulating facetUpdates...')
        await cut.facetUpdates.staticCall(addresses, zero, '0x')
        transactionHashes.push(
            await sendAndWait(
                () => cut.facetUpdates(addresses, zero, '0x'),
                'facetUpdates'
            )
        )
    }

    // --- Verify --------------------------------------------------------
    let verification: VerificationResult | undefined
    if (!skipVerification) {
        console.log('🔍 Verifying the diamond...')
        verification = await verifyDiamond(
            hre,
            diamond,
            finalPlan,
            finalCandidates,
            before,
            criticalSelectors,
            describe
        )
        if (!verification.ok) {
            throw new DiamondUpgradeError(
                'The diamond does not match the plan after the upgrade',
                verification.problems
            )
        }
        console.log(
            '   ✅ Every function and interface of the upgraded facets is in place'
        )
    }

    return {
        plan: finalPlan,
        deployed,
        executed: true,
        transactionHashes,
        verification,
    }
}
