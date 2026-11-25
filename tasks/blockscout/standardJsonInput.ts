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
import fs from 'fs'
import path from 'path'
import type { Artifacts, BuildInfo } from 'hardhat/types'

/**
 * Pure logic behind `blockscout:generate`: given a contract and the Hardhat
 * artifacts, pick the build-info that actually compiled that contract and
 * export its `input` (the Solidity Standard JSON Input) untouched.
 *
 * It never compiles, never touches the network and never rewrites the input.
 */

export const HARDHAT_BUILD_INFO_FORMAT = 'hh-sol-build-info-1'

export class BlockscoutGenerateError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'BlockscoutGenerateError'
    }
}

export interface GenerateStandardInputOptions {
    /** Fully Qualified Name (`path/Contract.sol:Contract`) or bare contract name */
    contract: string
    /** Optional build-info: file path, `<id>` or `<id>.json` under `<artifacts>/build-info` */
    buildInfo?: string
    /**
     * Optional output path. Default: `<root>/verify/<Contract>.<buildId>.standard-input.json`.
     * Must be outside the artifacts directory.
     */
    output?: string
    /** Hardhat artifacts manager (`hre.artifacts`) */
    artifacts: Artifacts
    /** Hardhat artifacts directory (`hre.config.paths.artifacts`) */
    artifactsDir: string
    /** Project root (`hre.config.paths.root`), base of the default output directory */
    root: string
}

export interface CompilerSettingsSummary {
    optimizer: unknown
    evmVersion: unknown
    viaIR: unknown
    metadata: unknown
    libraries: unknown
    remappings: unknown
}

export interface GenerateStandardInputResult {
    fullyQualifiedName: string
    sourceName: string
    contractName: string
    buildInfoId: string
    buildInfoPath: string
    /** `true` when the build-info came from `--build-info`, `false` when from the artifact */
    explicitBuildInfo: boolean
    solcVersion: string
    solcLongVersion: string
    settings: CompilerSettingsSummary
    sourcesCount: number
    outputPath: string
    outputBytes: number
    warnings: string[]
}

type BuildInfoContract = {
    evm?: {
        bytecode?: {
            object?: string
            linkReferences?: Record<string, Record<string, unknown>>
        }
    }
}

const FQN_SEPARATOR = ':'
const BUILD_INFO_ID_RE = /^[0-9a-fA-F]{32}(\.json)?$/

export function splitFullyQualifiedName(fqn: string): {
    sourceName: string
    contractName: string
} {
    const idx = fqn.lastIndexOf(FQN_SEPARATOR)
    if (idx <= 0 || idx === fqn.length - 1) {
        throw new BlockscoutGenerateError(
            `Invalid Fully Qualified Name "${fqn}". Expected "path/Contract.sol:Contract".`
        )
    }
    return {
        sourceName: fqn.slice(0, idx),
        contractName: fqn.slice(idx + 1),
    }
}

function formatCandidates(names: string[]): string {
    return names.map((n) => `  - ${n}`).join('\n')
}

/**
 * Resolves `contract` (FQN or bare name) to a single FQN.
 * `candidates` are the FQNs that can be chosen from (artifacts or build-info).
 */
export function resolveFullyQualifiedName(
    contract: string,
    candidates: string[],
    origin: string
): string {
    const requested = contract.trim()
    if (requested.length === 0) {
        throw new BlockscoutGenerateError('--contract must not be empty.')
    }

    if (requested.includes(FQN_SEPARATOR)) {
        splitFullyQualifiedName(requested)
        if (candidates.includes(requested)) return requested
        const { contractName } = splitFullyQualifiedName(requested)
        const sameName = candidates.filter(
            (c) => splitFullyQualifiedName(c).contractName === contractName
        )
        throw new BlockscoutGenerateError(
            `Contract "${requested}" not found in ${origin}.` +
                (sameName.length
                    ? `\nContracts with the same name:\n${formatCandidates(sameName)}`
                    : '\nCompile it with `npx hardhat compile` (or pass the right --build-info) and try again.')
        )
    }

    const matches = candidates.filter(
        (c) => splitFullyQualifiedName(c).contractName === requested
    )
    if (matches.length === 1) return matches[0]
    if (matches.length > 1) {
        throw new BlockscoutGenerateError(
            `Contract name "${requested}" is ambiguous in ${origin}. Use its Fully Qualified Name:\n` +
                formatCandidates(matches.sort())
        )
    }
    const lower = requested.toLowerCase()
    const similar = candidates
        .filter((c) => c.toLowerCase().includes(lower))
        .sort()
        .slice(0, 10)
    throw new BlockscoutGenerateError(
        `Contract "${requested}" not found in ${origin}.` +
            (similar.length
                ? `\nDid you mean:\n${formatCandidates(similar)}`
                : '\nCompile it with `npx hardhat compile` (or pass the right --build-info) and try again.')
    )
}

/** Resolves the `--build-info` argument to an existing file. */
export function resolveBuildInfoPath(
    arg: string,
    artifactsDir: string
): string {
    const candidates: string[] = [path.resolve(arg)]
    if (BUILD_INFO_ID_RE.test(arg)) {
        const file = arg.endsWith('.json') ? arg : `${arg}.json`
        candidates.unshift(path.join(artifactsDir, 'build-info', file))
    }
    const found = candidates.find(
        (c) => fs.existsSync(c) && fs.statSync(c).isFile()
    )
    if (!found) {
        throw new BlockscoutGenerateError(
            `build-info "${arg}" not found. Tried:\n${formatCandidates(candidates)}`
        )
    }
    return found
}

/** Reads and structurally validates a Hardhat build-info file. */
export function readBuildInfo(filePath: string): BuildInfo {
    let parsed: unknown
    try {
        parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (err) {
        throw new BlockscoutGenerateError(
            `Cannot read build-info ${filePath}: ${(err as Error).message}`
        )
    }
    assertValidBuildInfo(parsed, filePath)
    return parsed
}

export function assertValidBuildInfo(
    value: unknown,
    origin: string
): asserts value is BuildInfo {
    const bi = value as Partial<BuildInfo> | null
    const problems: string[] = []
    if (!bi || typeof bi !== 'object') {
        throw new BlockscoutGenerateError(`${origin} is not a JSON object.`)
    }
    if (bi._format !== HARDHAT_BUILD_INFO_FORMAT)
        problems.push(
            `_format is "${String(bi._format)}", expected "${HARDHAT_BUILD_INFO_FORMAT}"`
        )
    if (typeof bi.solcLongVersion !== 'string' || !bi.solcLongVersion)
        problems.push('missing solcLongVersion')
    if (!bi.input || typeof bi.input !== 'object')
        problems.push('missing input')
    else {
        if (bi.input.language !== 'Solidity')
            problems.push(
                `input.language is "${String(bi.input.language)}", expected "Solidity"`
            )
        if (!bi.input.sources || typeof bi.input.sources !== 'object')
            problems.push('missing input.sources')
        if (!bi.input.settings || typeof bi.input.settings !== 'object')
            problems.push('missing input.settings')
    }
    if (!bi.output || typeof bi.output !== 'object' || !bi.output.contracts)
        problems.push('missing output.contracts')
    if (problems.length) {
        throw new BlockscoutGenerateError(
            `Invalid build-info ${origin}:\n${formatCandidates(problems)}`
        )
    }
}

export function listBuildInfoContracts(buildInfo: BuildInfo): string[] {
    const out: string[] = []
    for (const [source, contracts] of Object.entries(
        buildInfo.output.contracts
    )) {
        for (const name of Object.keys(contracts ?? {}))
            out.push(`${source}:${name}`)
    }
    return out
}

function stripHexPrefix(s: string | undefined): string {
    return (s ?? '').replace(/^0x/, '')
}

/**
 * Checks the contract is really in this compilation and is deployable.
 * Returns non-fatal warnings.
 */
export function validateContractInBuildInfo(
    buildInfo: BuildInfo,
    fqn: string,
    origin: string
): string[] {
    const { sourceName, contractName } = splitFullyQualifiedName(fqn)
    const warnings: string[] = []

    if (!(sourceName in buildInfo.input.sources)) {
        throw new BlockscoutGenerateError(
            `Source "${sourceName}" is not in input.sources of ${origin}. This build-info did not compile ${fqn}.`
        )
    }
    const contract = buildInfo.output.contracts[sourceName]?.[contractName] as
        | BuildInfoContract
        | undefined
    if (!contract) {
        throw new BlockscoutGenerateError(
            `Contract ${fqn} is not in output.contracts of ${origin}.`
        )
    }
    const bytecode = contract.evm?.bytecode
    if (!bytecode || typeof bytecode.object !== 'string') {
        throw new BlockscoutGenerateError(
            `${origin} has no evm.bytecode for ${fqn} (outputSelection did not request it). Cannot check it is deployable.`
        )
    }
    if (stripHexPrefix(bytecode.object).length === 0) {
        throw new BlockscoutGenerateError(
            `${fqn} has empty bytecode: it is an abstract contract or an interface and cannot be deployed or verified on its own.`
        )
    }
    const links = Object.entries(bytecode.linkReferences ?? {}).flatMap(
        ([file, libs]) => Object.keys(libs).map((lib) => `${file}:${lib}`)
    )
    if (links.length) {
        warnings.push(
            `${fqn} links external libraries (${links.join(', ')}). Blockscout will need their deployed addresses.`
        )
    }
    return warnings
}

export function summarizeSettings(
    buildInfo: BuildInfo
): CompilerSettingsSummary {
    const s = buildInfo.input.settings as unknown as Record<string, unknown>
    return {
        optimizer: s.optimizer,
        evmVersion: s.evmVersion ?? '(compiler default)',
        viaIR: s.viaIR ?? false,
        metadata: s.metadata ?? '(compiler default)',
        libraries: s.libraries ?? {},
        remappings: s.remappings ?? [],
    }
}

/** Default output directory, relative to the project root. */
export const DEFAULT_OUTPUT_DIR = 'verify'

export function defaultOutputPath(
    root: string,
    contractName: string,
    buildInfoId: string
): string {
    return path.join(
        root,
        DEFAULT_OUTPUT_DIR,
        `${contractName}.${buildInfoId}.standard-input.json`
    )
}

/**
 * Absolute, normalized path with symlinks (and, on case-insensitive file
 * systems, letter case) resolved for the deepest part that already exists.
 */
function canonicalPath(p: string): string {
    let existing = path.resolve(p)
    const rest: string[] = []
    while (!fs.existsSync(existing)) {
        const parent = path.dirname(existing)
        if (parent === existing) break
        rest.unshift(path.basename(existing))
        existing = parent
    }
    let real = existing
    try {
        real = fs.realpathSync.native(existing)
    } catch {
        // keep the resolved path
    }
    return path.join(real, ...rest)
}

/** `true` if `target` is `dir` itself or anything below it. */
export function isInsideDirectory(target: string, dir: string): boolean {
    const rel = path.relative(canonicalPath(dir), canonicalPath(target))
    return (
        rel === '' ||
        (rel !== '..' &&
            !rel.startsWith(`..${path.sep}`) &&
            !path.isAbsolute(rel))
    )
}

/**
 * Hardhat treats every `.json` under the artifacts directory as a contract
 * artifact (breaking tasks that list artifacts) and deletes unknown ones on
 * the next compile, so the verification JSON must live elsewhere.
 */
export function assertOutputOutsideArtifacts(
    outputPath: string,
    artifactsDir: string
): void {
    if (isInsideDirectory(outputPath, artifactsDir)) {
        throw new BlockscoutGenerateError(
            `Output ${path.resolve(outputPath)} is inside the Hardhat artifacts directory (${path.resolve(artifactsDir)}). ` +
                'Hardhat would treat it as a contract artifact and delete it on the next compile. ' +
                `Use a path outside it, e.g. ${DEFAULT_OUTPUT_DIR}/<file>.json.`
        )
    }
}

/** Serializes `input` exactly as it is (no reordering, no extra fields). */
export function serializeStandardInput(buildInfo: BuildInfo): string {
    return JSON.stringify(buildInfo.input)
}

export async function generateStandardInput(
    opts: GenerateStandardInputOptions
): Promise<GenerateStandardInputResult> {
    const { artifacts, artifactsDir } = opts
    if (opts.output !== undefined) {
        assertOutputOutsideArtifacts(opts.output, artifactsDir)
    }
    const warnings: string[] = []
    let buildInfo: BuildInfo
    let buildInfoPath: string
    let fqn: string
    const explicitBuildInfo = Boolean(opts.buildInfo)

    if (opts.buildInfo) {
        buildInfoPath = resolveBuildInfoPath(opts.buildInfo, artifactsDir)
        buildInfo = readBuildInfo(buildInfoPath)
        fqn = resolveFullyQualifiedName(
            opts.contract,
            listBuildInfoContracts(buildInfo),
            `build-info ${path.basename(buildInfoPath)}`
        )
    } else {
        fqn = resolveFullyQualifiedName(
            opts.contract,
            await artifacts.getAllFullyQualifiedNames(),
            'the current Hardhat artifacts'
        )
        let found: BuildInfo | undefined
        let cause = ''
        try {
            found = await artifacts.getBuildInfo(fqn)
        } catch (err) {
            // Hardhat throws ENOENT when the .dbg.json points to a deleted file
            cause = ` (${(err as Error).message})`
        }
        if (!found) {
            throw new BlockscoutGenerateError(
                `No build-info for ${fqn}: its .dbg.json is missing or points to a deleted file${cause}. ` +
                    'Run `npx hardhat compile` or pass --build-info explicitly.'
            )
        }
        assertValidBuildInfo(found, `build-info of ${fqn}`)
        buildInfo = found
        buildInfoPath = path.join(
            artifactsDir,
            'build-info',
            `${buildInfo.id}.json`
        )
        if (!fs.existsSync(buildInfoPath))
            buildInfoPath = `(id ${buildInfo.id})`
    }

    const origin = `build-info ${buildInfo.id ?? path.basename(buildInfoPath)}`
    warnings.push(...validateContractInBuildInfo(buildInfo, fqn, origin))

    // Cross-check against the current artifact, if there is one.
    if (await artifacts.artifactExists(fqn)) {
        const artifact = await artifacts.readArtifact(fqn)
        const { sourceName, contractName } = splitFullyQualifiedName(fqn)
        const biContract = buildInfo.output.contracts[sourceName][
            contractName
        ] as BuildInfoContract
        const same =
            stripHexPrefix(artifact.bytecode) ===
            stripHexPrefix(biContract.evm?.bytecode?.object)
        if (!same) {
            const msg = `Bytecode of ${fqn} in ${origin} differs from the current artifact.`
            if (!explicitBuildInfo) {
                throw new BlockscoutGenerateError(
                    `${msg} Artifacts are inconsistent; run \`npx hardhat compile\` and retry.`
                )
            }
            warnings.push(
                `${msg} Expected if this is a historical compilation; make sure it is the one that was deployed.`
            )
        }
    } else if (explicitBuildInfo) {
        warnings.push(
            `${fqn} has no artifact in the current compilation (historical build-info).`
        )
    }

    const { sourceName, contractName } = splitFullyQualifiedName(fqn)
    const outputPath = path.resolve(
        opts.output ?? defaultOutputPath(opts.root, contractName, buildInfo.id)
    )
    assertOutputOutsideArtifacts(outputPath, artifactsDir)
    const serialized = serializeStandardInput(buildInfo)
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, serialized)

    return {
        fullyQualifiedName: fqn,
        sourceName,
        contractName,
        buildInfoId: buildInfo.id,
        buildInfoPath,
        explicitBuildInfo,
        solcVersion: buildInfo.solcVersion,
        solcLongVersion: buildInfo.solcLongVersion,
        settings: summarizeSettings(buildInfo),
        sourcesCount: Object.keys(buildInfo.input.sources).length,
        outputPath,
        outputBytes: Buffer.byteLength(serialized),
        warnings,
    }
}
