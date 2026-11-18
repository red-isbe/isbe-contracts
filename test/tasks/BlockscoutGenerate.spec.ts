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
import fs from 'fs'
import os from 'os'
import path from 'path'
import hre from 'hardhat'
import { Artifacts } from 'hardhat/internal/artifacts'
import {
    BlockscoutGenerateError,
    generateStandardInput,
    GenerateStandardInputOptions,
} from '../../tasks/blockscout/standardJsonInput'

/* ------------------------------------------------------------------ */
/* Fixture: a fake Hardhat artifacts dir with several build-info files */
/* ------------------------------------------------------------------ */

const ID_FOO_OLD = '00000000000000000000000000000a01' // historical Foo
const ID_MAIN = '0000000000000000000000000000000b' // current Foo + Bar + Base
const ID_LAST = 'ffffffffffffffffffffffffffffffff' // alphabetically last, unrelated
const ID_DUP = '0000000000000000000000000000000d' // two contracts named Dup

type ContractSpec = { source: string; name: string; bytecode: string }

function makeBuildInfo(
    id: string,
    contracts: ContractSpec[],
    extraSource?: string
) {
    const sources: Record<string, { content: string }> = {}
    const output: Record<string, Record<string, unknown>> = {}
    for (const c of contracts) {
        sources[c.source] = { content: `// ${id}\ncontract ${c.name} {}\n` }
        output[c.source] ??= {}
        output[c.source][c.name] = {
            abi: [],
            evm: {
                bytecode: { object: c.bytecode, linkReferences: {} },
                deployedBytecode: { object: c.bytecode, linkReferences: {} },
            },
        }
    }
    if (extraSource) sources[extraSource] = { content: '// helper\n' }
    return {
        _format: 'hh-sol-build-info-1',
        id,
        solcVersion: '0.8.28',
        solcLongVersion: '0.8.28+commit.7893614a',
        input: {
            language: 'Solidity',
            sources,
            settings: {
                optimizer: { enabled: true, runs: 1000 },
                evmVersion: 'istanbul',
                outputSelection: {
                    '*': { '*': ['abi', 'evm.bytecode'], '': ['ast'] },
                },
                // Arbitrary field: must survive untouched
                metadata: { bytecodeHash: 'ipfs', useLiteralContent: false },
            },
            // Unknown top-level field: must survive untouched
            xIsbeMarker: { id },
        },
        output: { contracts: output, sources: {} },
    }
}

class Fixture {
    readonly root: string
    readonly artifactsDir: string
    readonly buildInfos: Record<string, ReturnType<typeof makeBuildInfo>> = {}

    constructor() {
        this.root = fs.mkdtempSync(
            path.join(os.tmpdir(), 'blockscout-generate-')
        )
        this.artifactsDir = path.join(this.root, 'artifacts')
        fs.mkdirSync(path.join(this.artifactsDir, 'build-info'), {
            recursive: true,
        })
    }

    buildInfoPath(id: string) {
        return path.join(this.artifactsDir, 'build-info', `${id}.json`)
    }

    addBuildInfo(bi: ReturnType<typeof makeBuildInfo>) {
        this.buildInfos[bi.id] = bi
        fs.writeFileSync(this.buildInfoPath(bi.id), JSON.stringify(bi))
    }

    /** Writes the artifact + .dbg.json pointing to `buildInfoId` */
    addArtifact(
        c: ContractSpec,
        buildInfoId: string,
        bytecodeOverride?: string
    ) {
        const dir = path.join(this.artifactsDir, c.source)
        fs.mkdirSync(dir, { recursive: true })
        const code = bytecodeOverride ?? c.bytecode
        fs.writeFileSync(
            path.join(dir, `${c.name}.json`),
            JSON.stringify({
                _format: 'hh-sol-artifact-1',
                contractName: c.name,
                sourceName: c.source,
                abi: [],
                bytecode: code ? `0x${code}` : '0x',
                deployedBytecode: code ? `0x${code}` : '0x',
                linkReferences: {},
                deployedLinkReferences: {},
            })
        )
        fs.writeFileSync(
            path.join(dir, `${c.name}.dbg.json`),
            JSON.stringify({
                _format: 'hh-sol-dbg-1',
                buildInfo: path.relative(dir, this.buildInfoPath(buildInfoId)),
            })
        )
    }

    opts(extra: Partial<GenerateStandardInputOptions> & { contract: string }) {
        return {
            artifacts: new Artifacts(this.artifactsDir),
            artifactsDir: this.artifactsDir,
            root: this.root,
            output: path.join(this.root, 'out', 'standard-input.json'),
            ...extra,
        }
    }

    cleanup() {
        fs.rmSync(this.root, { recursive: true, force: true })
    }
}

const FOO_OLD: ContractSpec = {
    source: 'contracts/foo/Foo.sol',
    name: 'Foo',
    bytecode: '6001',
}
const FOO: ContractSpec = {
    source: 'contracts/foo/Foo.sol',
    name: 'Foo',
    bytecode: '6002',
}
const BAR: ContractSpec = {
    source: 'contracts/bar/Bar.sol',
    name: 'Bar',
    bytecode: '6003',
}
const BASE: ContractSpec = {
    source: 'contracts/foo/Base.sol',
    name: 'Base',
    bytecode: '',
}
const LAST: ContractSpec = {
    source: 'contracts/z/Zed.sol',
    name: 'Zed',
    bytecode: '6009',
}
const DUP_A: ContractSpec = {
    source: 'contracts/a/Dup.sol',
    name: 'Dup',
    bytecode: '600a',
}
const DUP_B: ContractSpec = {
    source: 'contracts/b/Dup.sol',
    name: 'Dup',
    bytecode: '600b',
}

async function expectGenerateError(
    p: Promise<unknown>,
    pattern: RegExp
): Promise<void> {
    try {
        await p
    } catch (err) {
        expect(err).to.be.instanceOf(BlockscoutGenerateError)
        expect((err as Error).message).to.match(pattern)
        return
    }
    expect.fail(`expected BlockscoutGenerateError matching ${pattern}`)
}

describe('blockscout:generate (Standard JSON Input export)', function () {
    let fx: Fixture

    beforeEach(function () {
        fx = new Fixture()
        fx.addBuildInfo(makeBuildInfo(ID_FOO_OLD, [FOO_OLD]))
        fx.addBuildInfo(
            makeBuildInfo(ID_MAIN, [FOO, BAR, BASE], 'contracts/lib/Helper.sol')
        )
        fx.addBuildInfo(makeBuildInfo(ID_LAST, [LAST]))
        fx.addBuildInfo(makeBuildInfo(ID_DUP, [DUP_A, DUP_B]))
        fx.addArtifact(FOO, ID_MAIN)
        fx.addArtifact(BAR, ID_MAIN)
        fx.addArtifact(BASE, ID_MAIN)
        fx.addArtifact(LAST, ID_LAST)
        fx.addArtifact(DUP_A, ID_DUP)
        fx.addArtifact(DUP_B, ID_DUP)
    })

    afterEach(function () {
        fx.cleanup()
    })

    describe('build-info selection', function () {
        it('uses the build-info referenced by the artifact, not the alphabetically last one', async function () {
            const r = await generateStandardInput(
                fx.opts({ contract: 'contracts/foo/Foo.sol:Foo' })
            )
            expect(r.buildInfoId).to.equal(ID_MAIN)
            expect(r.buildInfoId).to.not.equal(ID_LAST)
            expect(r.buildInfoPath).to.equal(fx.buildInfoPath(ID_MAIN))
            expect(r.explicitBuildInfo).to.equal(false)
            expect(r.solcLongVersion).to.equal('0.8.28+commit.7893614a')
        })

        it('writes exactly buildInfo.input (deep and byte equal)', async function () {
            const r = await generateStandardInput(
                fx.opts({ contract: 'contracts/bar/Bar.sol:Bar' })
            )
            const raw = fs.readFileSync(r.outputPath, 'utf-8')
            const expected = fx.buildInfos[ID_MAIN].input
            expect(JSON.parse(raw)).to.deep.equal(expected)
            expect(raw).to.equal(JSON.stringify(expected))
            expect(r.outputBytes).to.equal(Buffer.byteLength(raw))
        })

        it('keeps every field and adds none (no compiler / compilationTarget)', async function () {
            const r = await generateStandardInput(fx.opts({ contract: 'Foo' }))
            const out = JSON.parse(fs.readFileSync(r.outputPath, 'utf-8'))
            expect(Object.keys(out)).to.deep.equal(
                Object.keys(fx.buildInfos[ID_MAIN].input)
            )
            expect(out).to.not.have.property('compiler')
            expect(out.settings).to.not.have.property('compilationTarget')
            expect(out.settings.metadata).to.deep.equal({
                bytecodeHash: 'ipfs',
                useLiteralContent: false,
            })
            expect(out.xIsbeMarker).to.deep.equal({ id: ID_MAIN })
            // Includes sources that are not the target (whole compilation unit)
            expect(out.sources).to.have.property('contracts/lib/Helper.sol')
            // Never mixes in sources from other compilations
            expect(out.sources).to.not.have.property(LAST.source)
        })

        it('produces a different file per contract compiled in different builds', async function () {
            const a = await generateStandardInput(
                fx.opts({
                    contract: 'Zed',
                    output: path.join(fx.root, 'zed.json'),
                })
            )
            const b = await generateStandardInput(
                fx.opts({
                    contract: 'Bar',
                    output: path.join(fx.root, 'bar.json'),
                })
            )
            expect(
                JSON.parse(fs.readFileSync(a.outputPath, 'utf-8'))
            ).to.deep.equal(fx.buildInfos[ID_LAST].input)
            expect(
                JSON.parse(fs.readFileSync(b.outputPath, 'utf-8'))
            ).to.deep.equal(fx.buildInfos[ID_MAIN].input)
        })

        it('defaults the output to <root>/verify/<Contract>.<buildId>.standard-input.json', async function () {
            const r = await generateStandardInput(
                fx.opts({ contract: 'Bar', output: undefined })
            )
            expect(r.outputPath).to.equal(
                path.resolve(
                    fx.root,
                    'verify',
                    `Bar.${ID_MAIN}.standard-input.json`
                )
            )
            expect(fs.existsSync(r.outputPath)).to.equal(true)
            expect(
                fs.existsSync(path.join(fx.artifactsDir, 'verify'))
            ).to.equal(false)
        })
    })

    describe('output location (outside the artifacts directory)', function () {
        const insideArtifacts = (fx: Fixture) => [
            path.join(fx.artifactsDir, 'verify', 'x.json'),
            path.join(fx.artifactsDir, 'x.json'),
            fx.artifactsDir,
            // Not normalized: resolves into artifacts/
            `${fx.root}${path.sep}verify${path.sep}..${path.sep}artifacts${path.sep}verify${path.sep}x.json`,
            `${fx.artifactsDir}${path.sep}.${path.sep}build-info${path.sep}..${path.sep}x.json`,
            // Relative to the current working directory
            path.relative(
                process.cwd(),
                path.join(fx.artifactsDir, 'verify', 'x.json')
            ),
        ]

        it('rejects --output inside the artifacts directory, including non-normalized and relative paths', async function () {
            for (const output of insideArtifacts(fx)) {
                await expectGenerateError(
                    generateStandardInput(fx.opts({ contract: 'Bar', output })),
                    /inside the Hardhat artifacts directory/
                )
            }
            expect(
                fs.existsSync(path.join(fx.artifactsDir, 'verify'))
            ).to.equal(false)
            expect(
                fs.existsSync(path.join(fx.artifactsDir, 'x.json'))
            ).to.equal(false)
        })

        it('rejects --output that reaches the artifacts directory through a symlink', async function () {
            const link = path.join(fx.root, 'link-to-artifacts')
            fs.symlinkSync(fx.artifactsDir, link, 'dir')
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({
                        contract: 'Bar',
                        output: path.join(link, 'x.json'),
                    })
                ),
                /inside the Hardhat artifacts directory/
            )
        })

        it('accepts --output next to the artifacts directory with a similar name', async function () {
            const out = path.join(fx.root, 'artifacts-verify', 'x.json')
            const r = await generateStandardInput(
                fx.opts({ contract: 'Bar', output: out })
            )
            expect(r.outputPath).to.equal(out)
            expect(fs.existsSync(out)).to.equal(true)
        })

        it('generated JSON is not discovered as a Hardhat contract artifact', async function () {
            const before = await new Artifacts(
                fx.artifactsDir
            ).getAllFullyQualifiedNames()
            await generateStandardInput(
                fx.opts({ contract: 'Bar', output: undefined })
            )
            await generateStandardInput(
                fx.opts({ contract: 'Zed', output: undefined })
            )
            const after = await new Artifacts(
                fx.artifactsDir
            ).getAllFullyQualifiedNames()
            expect(after.sort()).to.deep.equal(before.sort())
            expect(after.some((n) => n.includes('standard-input'))).to.equal(
                false
            )
        })

        it('generated JSON survives the obsolete-artifact cleanup run by every compile', async function () {
            const r = await generateStandardInput(
                fx.opts({ contract: 'Bar', output: undefined })
            )
            // Control: an unknown .json inside artifacts/ is what compile deletes
            const strayInside = path.join(
                fx.artifactsDir,
                'verify',
                'stray.json'
            )
            fs.mkdirSync(path.dirname(strayInside), { recursive: true })
            fs.writeFileSync(strayInside, '{}')

            const artifacts = new Artifacts(fx.artifactsDir)
            artifacts.addValidArtifacts(
                [FOO, BAR, BASE, LAST, DUP_A, DUP_B].map((c) => ({
                    sourceName: c.source,
                    artifacts: [c.name],
                }))
            )
            await artifacts.removeObsoleteArtifacts()

            expect(fs.existsSync(strayInside)).to.equal(false)
            expect(fs.readFileSync(r.outputPath, 'utf-8')).to.equal(
                JSON.stringify(fx.buildInfos[ID_MAIN].input)
            )
        })
    })

    describe('--build-info', function () {
        it('accepts a historical build-info by id and exports its input verbatim', async function () {
            const r = await generateStandardInput(
                fx.opts({
                    contract: 'contracts/foo/Foo.sol:Foo',
                    buildInfo: ID_FOO_OLD,
                })
            )
            expect(r.buildInfoId).to.equal(ID_FOO_OLD)
            expect(r.explicitBuildInfo).to.equal(true)
            expect(
                JSON.parse(fs.readFileSync(r.outputPath, 'utf-8'))
            ).to.deep.equal(fx.buildInfos[ID_FOO_OLD].input)
            expect(r.warnings.join('\n')).to.match(
                /differs from the current artifact/
            )
        })

        it('accepts <id>.json and a file path', async function () {
            const byFile = await generateStandardInput(
                fx.opts({ contract: 'Foo', buildInfo: `${ID_FOO_OLD}.json` })
            )
            const byPath = await generateStandardInput(
                fx.opts({
                    contract: 'Foo',
                    buildInfo: fx.buildInfoPath(ID_FOO_OLD),
                })
            )
            expect(byFile.buildInfoId).to.equal(ID_FOO_OLD)
            expect(byPath.buildInfoPath).to.equal(fx.buildInfoPath(ID_FOO_OLD))
        })

        it('fails if the contract is not in that build-info', async function () {
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({
                        contract: 'contracts/bar/Bar.sol:Bar',
                        buildInfo: ID_FOO_OLD,
                    })
                ),
                /not found in build-info/
            )
        })

        it('fails if the build-info does not exist', async function () {
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({
                        contract: 'Foo',
                        buildInfo: 'deadbeefdeadbeefdeadbeefdeadbeef',
                    })
                ),
                /not found/
            )
        })

        it('rejects a file that is not a Hardhat build-info', async function () {
            const bogus = path.join(fx.root, 'bogus.json')
            fs.writeFileSync(
                bogus,
                JSON.stringify({ language: 'Solidity', sources: {} })
            )
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({ contract: 'Foo', buildInfo: bogus })
                ),
                /Invalid build-info[\s\S]*_format/
            )
        })

        it('rejects a build-info whose input.sources lacks the contract source', async function () {
            const bi = makeBuildInfo('0000000000000000000000000000000e', [FOO])
            delete (bi.input.sources as Record<string, unknown>)[FOO.source]
            const file = path.join(fx.root, 'broken.json')
            fs.writeFileSync(file, JSON.stringify(bi))
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({
                        contract: 'contracts/foo/Foo.sol:Foo',
                        buildInfo: file,
                    })
                ),
                /is not in input.sources/
            )
        })
    })

    describe('contract resolution and validation', function () {
        it('resolves a unique bare name to its FQN', async function () {
            const r = await generateStandardInput(fx.opts({ contract: 'Bar' }))
            expect(r.fullyQualifiedName).to.equal('contracts/bar/Bar.sol:Bar')
            expect(r.contractName).to.equal('Bar')
            expect(r.sourceName).to.equal('contracts/bar/Bar.sol')
        })

        it('rejects an ambiguous bare name listing the candidates', async function () {
            await expectGenerateError(
                generateStandardInput(fx.opts({ contract: 'Dup' })),
                /ambiguous[\s\S]*contracts\/a\/Dup.sol:Dup[\s\S]*contracts\/b\/Dup.sol:Dup/
            )
        })

        it('resolves the ambiguous contract with its FQN', async function () {
            const r = await generateStandardInput(
                fx.opts({ contract: 'contracts/b/Dup.sol:Dup' })
            )
            expect(r.buildInfoId).to.equal(ID_DUP)
        })

        it('rejects unknown contracts', async function () {
            await expectGenerateError(
                generateStandardInput(fx.opts({ contract: 'Nope' })),
                /not found/
            )
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({ contract: 'contracts/x/Foo.sol:Foo' })
                ),
                /not found[\s\S]*contracts\/foo\/Foo.sol:Foo/
            )
        })

        it('rejects abstract contracts / interfaces (empty bytecode)', async function () {
            await expectGenerateError(
                generateStandardInput(fx.opts({ contract: 'Base' })),
                /empty bytecode/
            )
        })

        it('fails when the artifact points to a missing build-info', async function () {
            fs.rmSync(fx.buildInfoPath(ID_MAIN))
            await expectGenerateError(
                generateStandardInput(fx.opts({ contract: 'Bar' })),
                /No build-info/
            )
        })

        it('fails when the artifact and its build-info are inconsistent', async function () {
            fx.addArtifact(BAR, ID_MAIN, 'dead')
            await expectGenerateError(
                generateStandardInput(fx.opts({ contract: 'Bar' })),
                /inconsistent/
            )
        })

        it('does not write any file when validation fails', async function () {
            const out = path.join(fx.root, 'never.json')
            await expectGenerateError(
                generateStandardInput(
                    fx.opts({ contract: 'Base', output: out })
                ),
                /empty bytecode/
            )
            expect(fs.existsSync(out)).to.equal(false)
        })
    })

    describe('task against the real project artifacts', function () {
        const FQN =
            'contracts/evidenceregistry/EvidenceRegistryFacet.sol:EvidenceRegistryFacet'

        it('blockscout:generate exports the build-info input of EvidenceRegistryFacet', async function () {
            if (!(await hre.artifacts.artifactExists(FQN))) this.skip()
            const out = path.join(fx.root, 'erf.json')
            const r = await hre.run('blockscout:generate', {
                contract: FQN,
                output: out,
            })
            const buildInfo = await hre.artifacts.getBuildInfo(FQN)
            expect(r.buildInfoId).to.equal(buildInfo!.id)
            expect(fs.readFileSync(out, 'utf-8')).to.equal(
                JSON.stringify(buildInfo!.input)
            )
        })

        it('defaults the output to verify/ under the project root, outside hre.config.paths.artifacts', async function () {
            const { root, artifacts } = hre.config.paths
            expect(
                path
                    .resolve(root, 'verify')
                    .startsWith(path.resolve(artifacts) + path.sep)
            ).to.equal(false)
            await expectGenerateError(
                generateStandardInput({
                    contract: FQN,
                    output: path.join(artifacts, 'verify', 'x.json'),
                    artifacts: hre.artifacts,
                    artifactsDir: artifacts,
                    root,
                }),
                /inside the Hardhat artifacts directory/
            )
        })

        it('generated JSON is not an artifact and survives a real compile', async function () {
            if (!(await hre.artifacts.artifactExists(FQN))) this.skip()
            const out = path.join(fx.root, 'verify', 'erf.json')
            const before = await hre.artifacts.getAllFullyQualifiedNames()
            await hre.run('blockscout:generate', { contract: FQN, output: out })
            const after = await hre.artifacts.getAllFullyQualifiedNames()
            expect(after.sort()).to.deep.equal(before.sort())

            await hre.run('compile', { quiet: true })

            const buildInfo = await hre.artifacts.getBuildInfo(FQN)
            expect(fs.readFileSync(out, 'utf-8')).to.equal(
                JSON.stringify(buildInfo!.input)
            )
        })
    })
})
