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
import { ethers } from 'hardhat'
import { ZeroHash } from 'ethers'
import { generateProof, proofToDid } from '../../test/support/identity/did'
import { EllipticType } from '../../test/types/identity'
import { randomBytes32, randomBaseDocument } from '../../test/support'
import {
    IDidRegistry,
    DidControllerFacet,
    TrustedIssuersRegistryFacet,
    IAccessControl,
} from '../../typechain-types'

// Role constants
const TRUSTED_ISSUERS_REGISTRY_ROLE =
    '0x851082823889050845ac21877ec718094d3f20497e34e5a8281bde69dde672e5'

const IssuerType = {
    NONE: 0,
    ROOT_TAO: 1,
    TAO: 2,
    TI: 3,
    REVOKED: 4,
} as const

const DIAMOND_ADDRESS = '0x00000000000000000000000000000000000015BE'
const MAX_WAIT_SECONDS = 300
const POLL_INTERVAL_MS = 2000

async function waitForNetwork(): Promise<void> {
    console.log('⏳ Esperando conectividad con la red CASE...')

    const provider = ethers.provider
    let attempts = 0
    const maxAttempts = (MAX_WAIT_SECONDS * 1000) / POLL_INTERVAL_MS

    while (attempts < maxAttempts) {
        try {
            const blockNumber = await provider.getBlockNumber()
            console.log('✅ Red disponible - Bloque:', blockNumber)
            return
        } catch {
            attempts++
            if (attempts % 15 === 0) {
                console.log(
                    `   Reintentando... (${Math.floor((attempts * POLL_INTERVAL_MS) / 1000)}s)`
                )
            }
            await new Promise((resolve) =>
                setTimeout(resolve, POLL_INTERVAL_MS)
            )
        }
    }

    throw new Error(
        `No se pudo conectar a la red después de ${MAX_WAIT_SECONDS} segundos`
    )
}

async function waitForDiamond(): Promise<void> {
    console.log('⏳ Verificando deployment del Diamond...')
    console.log('   Dirección:', DIAMOND_ADDRESS)

    const provider = ethers.provider
    let attempts = 0
    const maxAttempts = (MAX_WAIT_SECONDS * 1000) / POLL_INTERVAL_MS

    while (attempts < maxAttempts) {
        try {
            const code = await provider.getCode(DIAMOND_ADDRESS)

            if (code !== '0x' && code.length > 4) {
                console.log(
                    '✅ Diamond desplegado - Código:',
                    code.length,
                    'bytes'
                )
                return
            }

            attempts++
            if (attempts % 15 === 0) {
                console.log(
                    `   Esperando deployment... (${Math.floor((attempts * POLL_INTERVAL_MS) / 1000)}s)`
                )
            }
            await new Promise((resolve) =>
                setTimeout(resolve, POLL_INTERVAL_MS)
            )
        } catch {
            attempts++
            await new Promise((resolve) =>
                setTimeout(resolve, POLL_INTERVAL_MS)
            )
        }
    }

    throw new Error(
        `Diamond no desplegado después de ${MAX_WAIT_SECONDS} segundos. Ejecuta: npx hardhat deployAll --network localhost`
    )
}

async function verifyFacets(): Promise<void> {
    console.log('⏳ Verificando facetas registradas...')

    try {
        const diamondLoupe = await ethers.getContractAt(
            'IDiamondLoupe',
            DIAMOND_ADDRESS
        )
        const facets = await diamondLoupe.facets()
        console.log('✅ Facetas registradas:', facets.length)

        for (const facet of facets) {
            const selectorCount = facet[1].length
            if (selectorCount > 0) {
                console.log(`   - ${facet[0]}: ${selectorCount} selectores`)
            }
        }
    } catch (error) {
        console.log('⚠️  No se pudieron verificar las facetas:', error)
    }
}

async function main() {
    console.log('='.repeat(70))
    console.log('  Test E2E: DID + TIR Integration')
    console.log('  ISBE-23 Branch - Version 20260301')
    console.log('='.repeat(70))
    console.log('')
    console.log('🌐 Esperando a que la red CASE esté lista...')
    console.log('   URL: http://172.16.240.30:8545')
    console.log('   Chain ID: 2222')
    console.log('')

    const startTime = Date.now()

    await waitForNetwork()
    await waitForDiamond()
    await verifyFacets()

    console.log('')
    console.log('─'.repeat(70))
    console.log('🚀 Iniciando pruebas E2E...')
    console.log('─'.repeat(70))
    console.log('')

    const [deployer, issuer, controller] = await ethers.getSigners()

    console.log('Cuentas:')
    console.log('  Deployer:   ', deployer.address)
    console.log('  Issuer:     ', issuer.address)
    console.log('  Controller: ', controller.address)
    console.log('')

    const didRegistry = (await ethers.getContractAt(
        'IDidRegistry',
        DIAMOND_ADDRESS
    )) as IDidRegistry

    const didControllerFacet = (await ethers.getContractAt(
        'DidControllerFacet',
        DIAMOND_ADDRESS
    )) as DidControllerFacet

    const trustedIssuersRegistry = (await ethers.getContractAt(
        'TrustedIssuersRegistryFacet',
        DIAMOND_ADDRESS
    )) as TrustedIssuersRegistryFacet

    console.log('═══ PASO 1: Crear DID para Issuer ═══')
    console.log('Generando proof criptográfica...')

    const { config } = await import('hardhat')
    const accountsConfig = config.networks.hardhat.accounts as {
        mnemonic: string
    }
    const { HDNodeWallet } = await import('ethers')

    // Use timestamp-based derivation paths to ensure unique DIDs per test run
    // Hardhat pre-funds first 20 accounts, so we use paths > 1000 to avoid conflicts
    // and fund these wallets from deployer
    const runId = (Date.now() % 10000) + 1000 // Unique per run, guaranteed > 1000
    const issuerPath = `m/44'/60'/0'/0/${runId}`
    const issuerWallet = HDNodeWallet.fromPhrase(
        accountsConfig.mnemonic,
        '',
        issuerPath
    ).connect(ethers.provider)

    const proof = await generateProof(issuerWallet)
    const issuerDid = proofToDid(proof)

    console.log('Issuer DID derivado:', issuerDid)
    console.log('Issuer derivation path:', issuerPath)
    console.log('Issuer publicKey:', issuerWallet.signingKey.publicKey)

    const vMethodId = randomBytes32()
    const baseDocument = randomBaseDocument()
    const notBefore = BigInt(Math.floor(Date.now() / 1000))
    const notAfter = notBefore + 31536000n

    // IMPORTANT: Must use the public key (65 bytes) not the address (20 bytes)
    // The contract _validateProof expects publicKey for signature verification
    const issuerPublicKey = issuerWallet.signingKey.publicKey

    const tx1 = await didRegistry.connect(issuer).insertFirstDidDocument(
        issuerDid,
        baseDocument,
        vMethodId,
        proof,
        issuerPublicKey, // PUBLIC KEY (65 bytes), NOT ADDRESS
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter,
        ''
    )
    const receipt1 = await tx1.wait()
    if (!receipt1) throw new Error('Transaction failed')
    console.log('✅ DID Issuer creado')
    console.log('   TX:', receipt1.hash)
    console.log('   Block:', receipt1.blockNumber)
    console.log('   Gas:', receipt1.gasUsed.toString())
    console.log('')

    console.log('═══ PASO 2: Crear DID para Controller ═══')
    const controllerPath = `m/44'/60'/0'/0/${runId + 1}`
    const controllerWallet = HDNodeWallet.fromPhrase(
        accountsConfig.mnemonic,
        '',
        controllerPath
    ).connect(ethers.provider)

    // Fund both wallets from deployer (accounts 0-19 have pre-funded ETH in local networks)
    console.log('Funding derived wallets...')
    const deployerSigner = (await ethers.getSigners())[0]

    const issuerFundTx = await deployerSigner.sendTransaction({
        to: await issuerWallet.getAddress(),
        value: ethers.parseEther('1.0'),
    })
    await issuerFundTx.wait()

    const controllerFundTx = await deployerSigner.sendTransaction({
        to: await controllerWallet.getAddress(),
        value: ethers.parseEther('1.0'),
    })
    await controllerFundTx.wait()
    console.log('✅ Wallets funded')

    const controllerProof = await generateProof(controllerWallet)
    const controllerDid = proofToDid(controllerProof)

    console.log('Controller DID derivado:', controllerDid)
    console.log('Controller derivation path:', controllerPath)

    const controllerPublicKey = controllerWallet.signingKey.publicKey

    // Use the same authorized signer (issuer has DID_REGISTRY_ROLE)
    // The DID is derived from the proof, not from the signer
    const tx2 = await didRegistry
        .connect(issuer)
        .insertFirstDidDocument(
            controllerDid,
            baseDocument,
            randomBytes32(),
            controllerProof,
            controllerPublicKey,
            EllipticType.SECP_256_K1,
            notBefore,
            notAfter,
            ''
        )
    const receipt2 = await tx2.wait()
    if (!receipt2) throw new Error('Transaction failed')
    console.log('✅ DID Controller creado')
    console.log('   TX:', receipt2.hash)
    console.log('')

    console.log('═══ PASO 3: Configurar Jerarquía Trusted Issuers ═══')
    console.log('')

    // Trusted Issuers Registry has a trust hierarchy:
    // ROOT_TAO (created by TRUSTED_ISSUERS_REGISTRY_ROLE holder)
    //   └─► TAO (created by ROOT_TAO)
    //        └─► TI (created by TAO or ROOT_TAO)

    const accessControl = (await ethers.getContractAt(
        'IAccessControl',
        DIAMOND_ADDRESS
    )) as IAccessControl

    // 3.1: Grant TRUSTED_ISSUERS_REGISTRY_ROLE to deployer if needed
    console.log('3.1: Verificando permisos TRUSTED_ISSUERS_REGISTRY_ROLE...')
    let hasTirRole = await accessControl.hasRole(
        TRUSTED_ISSUERS_REGISTRY_ROLE,
        deployer.address
    )
    console.log('   Deployer tiene TIR_ROLE:', hasTirRole)

    if (!hasTirRole) {
        console.log('   Otorgando TIR_ROLE a deployer...')
        const grantTx = await accessControl.grantRole(
            TRUSTED_ISSUERS_REGISTRY_ROLE,
            deployer.address
        )
        await grantTx.wait()
        hasTirRole = await accessControl.hasRole(
            TRUSTED_ISSUERS_REGISTRY_ROLE,
            deployer.address
        )
        console.log('   TIR_ROLE otorgado:', hasTirRole)
    }
    console.log('')

    // 3.2: Create ROOT_TAO DID (issuer's DID becomes ROOT_TAO)
    console.log('3.2: Registrando issuer como ROOT_TAO...')
    console.log('   ROOT_TAO DID:', issuerDid)

    const rootTaoRevisionId = randomBytes32()
    const tx3 = await trustedIssuersRegistry
        .connect(deployer)
        .setAttributeMetadata(
            issuerDid,
            IssuerType.ROOT_TAO,
            rootTaoRevisionId,
            ZeroHash, // ROOT_TAO is self-referential
            ZeroHash // No parent attribute
        )
    const receipt3 = await tx3.wait()
    if (!receipt3) throw new Error('Transaction failed')
    console.log('✅ ROOT_TAO registrado')
    console.log('   TX:', receipt3.hash)
    console.log('   Gas:', receipt3.gasUsed.toString())

    const rootTaoInfo = await trustedIssuersRegistry.getIssuer(issuerDid)
    console.log('   Atributos ROOT_TAO:', rootTaoInfo[1].toString())
    console.log('')

    // 3.3: Register issuer as TI (accredited by ROOT_TAO - which is itself)
    console.log('3.3: Acreditando issuer como Trusted Issuer (TI)...')
    console.log('   TI DID:', issuerDid)
    console.log('   Acreditado por ROOT_TAO:', issuerDid)

    const tiRevisionId = randomBytes32()
    const tx4 = await trustedIssuersRegistry
        .connect(deployer)
        .setAttributeMetadata(
            issuerDid,
            IssuerType.TI,
            tiRevisionId,
            issuerDid, // taoDid: ROOT_TAO's DID (self)
            rootTaoRevisionId // attributeIdTao: ROOT_TAO's revision
        )
    const receipt4 = await tx4.wait()
    if (!receipt4) throw new Error('Transaction failed')
    console.log('✅ TI registrado')
    console.log('   TX:', receipt4.hash)
    console.log('   Gas:', receipt4.gasUsed.toString())

    const tiInfo = await trustedIssuersRegistry.getIssuer(issuerDid)
    console.log('   Total atributos:', tiInfo[1].toString())
    console.log('')

    console.log('═══ PASO 4: Añadir Controller al DID ═══')
    console.log('Añadiendo controller DID:', controllerDid)

    // Use issuerWallet (which controls issuerDid) not 'issuer' account
    const issuerAddress = await issuerWallet.getAddress()
    console.log('Issuer wallet address:', issuerAddress)

    const tx5 = await didControllerFacet
        .connect(issuerWallet)
        .addController(issuerDid, controllerDid)
    const receipt5 = await tx5.wait()
    if (!receipt5) throw new Error('Transaction failed')
    console.log('✅ Controller añadido')
    console.log('   TX:', receipt5.hash)
    console.log('   Gas:', receipt5.gasUsed.toString())

    const controllerWalletAddress = await controllerWallet.getAddress()
    const isControllerCheck = await didControllerFacet[
        'checkController(bytes32,address)'
    ](issuerDid, controllerWalletAddress)
    if (!isControllerCheck) throw new Error('Controller no verificado')
    console.log('✅ Controller verificado via checkController')
    console.log('')

    console.log('═══ PASO 5: Validación de Integración ═══')

    console.log('\n--- 5.1: Verificar Issuer en TIR ---')
    const issuerCheck = await trustedIssuersRegistry.getIssuer(issuerDid)
    console.log('   Issuer registrado:', issuerCheck[1] > 0n)
    console.log('   Total atributos:', issuerCheck[1].toString())

    console.log('\n--- 5.2: Verificar DID existe ---')
    const didDoc = await didRegistry.getDidDocument(issuerDid)
    const hasControllers = didDoc.controllers.length > 0
    console.log('   DID tiene controllers:', hasControllers)
    console.log('   Controllers:', didDoc.controllers.map((c) => c).join(', '))

    console.log('\n--- 5.3: Verificar Controller ---')
    const issuerWalletAddress = await issuerWallet.getAddress()
    const controllerCheck = await didControllerFacet[
        'checkController(bytes32,address)'
    ](issuerDid, issuerWalletAddress)
    console.log('   Issuer es controller de su DID:', controllerCheck)

    const controllerCheck2 = await didControllerFacet[
        'checkController(bytes32,address)'
    ](issuerDid, controllerWalletAddress)
    console.log('   Controller agregado es controller:', controllerCheck2)

    if (!controllerCheck || !controllerCheck2) {
        throw new Error('Verificaciones de controller fallaron')
    }
    console.log('✅ Todas las verificaciones exitosas')
    console.log('')

    console.log('═══ PASO 6: Validar Persistencia ═══')
    console.log('Re-consultando todos los datos...')

    const issuerPersist = await trustedIssuersRegistry.getIssuer(issuerDid)
    console.log('Issuer persiste:', issuerPersist[1] > 0n)

    const didDocPersist = await didRegistry.getDidDocument(issuerDid)
    console.log('DID persiste:', didDocPersist.controllers.length > 0)

    const controllerPersist = await didControllerFacet[
        'checkController(bytes32,address)'
    ](issuerDid, controllerWalletAddress)
    console.log('Controller persiste:', controllerPersist)

    if (
        issuerPersist[1] === 0n ||
        didDocPersist.controllers.length === 0 ||
        !controllerPersist
    ) {
        throw new Error('Datos no persisten correctamente')
    }
    console.log('✅ Todos los datos persisten correctamente')
    console.log('')

    console.log('═══ PASO 7: Resumen de Gas ═══')
    const gasUsed = {
        createIssuerDID: receipt1.gasUsed,
        createControllerDID: receipt2.gasUsed,
        registerTrustedIssuer: receipt3.gasUsed,
        addController: receipt4.gasUsed,
        total:
            receipt1.gasUsed +
            receipt2.gasUsed +
            receipt3.gasUsed +
            receipt4.gasUsed,
    }

    console.log('Gas consumido:')
    console.log('   Crear DID Issuer:     ', gasUsed.createIssuerDID.toString())
    console.log(
        '   Crear DID Controller: ',
        gasUsed.createControllerDID.toString()
    )
    console.log(
        '   Registrar TI:         ',
        gasUsed.registerTrustedIssuer.toString()
    )
    console.log('   Add Controller:       ', gasUsed.addController.toString())
    console.log('   TOTAL:                ', gasUsed.total.toString())
    console.log('')

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

    console.log('═'.repeat(70))
    console.log('✅ TEST E2E COMPLETADO EXITOSAMENTE')
    console.log('═'.repeat(70))
    console.log('\nValidaciones completadas:')
    console.log('  ✅ Creación de DID con proof derivation (ISBE-23)')
    console.log('  ✅ Registro de trusted issuer via setAttributeMetadata')
    console.log('  ✅ Gestión de controllers (PR #49)')
    console.log('  ✅ Verificación de integración DID + TIR')
    console.log('  ✅ Persistencia de datos')
    console.log('')
    console.log('Estadísticas:')
    console.log(`  Tiempo total: ${elapsedSeconds}s`)
    console.log(`  Gas total: ${gasUsed.total.toString()}`)
    console.log('')
    console.log('Red: CASE en MSI (http://172.16.240.30:8545)')
    console.log('Ejecutado desde: EVO')
    console.log('Versión: 20260301')
    console.log('')

    console.log('⏸️  Test completado. Presiona Ctrl+C para salir.')
    console.log('   Los contratos permanecen desplegados en la red.')
    console.log('   Diamond address:', DIAMOND_ADDRESS)
    console.log('')

    await new Promise(() => {})
}

main().catch((error) => {
    console.error('\n❌ ERROR EN TEST E2E:', error)
    console.log('')
    console.log('Posibles soluciones:')
    console.log('  1. Asegúrate de que la red CASE esté corriendo en MSI')
    console.log('  2. Verifica que LOCALHOST_URL=http://172.16.240.30:8545')
    console.log('  3. Ejecuta: npx hardhat deployAll --network localhost')
    console.log('')
    process.exit(1)
})
