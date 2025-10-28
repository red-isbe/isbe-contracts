import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ContractMatcher } from './contractMatcher'
import { AbstractSigner, keccak256, toUtf8Bytes, TransactionResponse, AbiCoder, Fragment, Interface, Signer} from 'ethers'
import { ISignatureProvider, SignatureProviderFactory } from '../../tasks/index'
import { revokeRole } from '../access/accessControl/revokeRole'
import { grantRole } from '../access/accessControl/grantRole'
import { pause } from '../pause/pause'
import { unpause } from '../pause/unpause'


// Tipo de dato de la estructura base devuelta por facets()
// type RawFacetEntry = [string, string[]]

// Tipo del objeto transformado más legible
interface Facet {
    facetAddress: string
    selectors: string[]
    numSelectors: number
    facetName?: string
}

const ERROR_SELECTOR_MESSAGE = "0x08c379a0";

class txExcecutor{

    

    private customMap:Map<string, string> = new Map<string, string>();

    constructor(abi: any){

        this._extractCustomError(abi);
    }
    
    async processTX(
        message: string,
        tx: () => Promise<TransactionResponse>,
    ): Promise<void> {
        let pTx: TransactionResponse = undefined as any ;
        try {
            pTx = await tx();
            process.stdout.write(
                `\x1b[31m ${message} - Process transaction (TX: ${pTx.hash})...\x1b[0m\r`
            )
            await pTx.wait()
            process.stdout.write(
                `${message} - Process transaction (TX: ${pTx.hash}) \x1b[32m[OK]\x1b[0m              \n`
        )
        } catch (error) {
            console.error("ERROR processing transaction:");
            if((error as  any).data){
                console.error(this._showError(error.data));
                console.error(`Error type: ${error._isProviderError ? "Error from provider" : "Local error"}`);
            }else{
                console.error(error);
            }
            process.exit(1);
        }
    }

    private _showError(data: any): string {
        if (typeof data !== "string" || !data.startsWith("0x") || data.length < 10) {
            return "Invalid or empty revert data.";
        }

        const ERROR_SELECTOR = "0x08c379a0"; // keccak256("Error(string)")[0:4]
        const coder = new AbiCoder();

        try {
            // Caso 1: Error(string)
            if (data.startsWith(ERROR_SELECTOR)) {
            const reason = coder.decode(["string"], "0x" + data.slice(10));
            return `Reason: ${String(reason[0])}`;
            }

            // Caso 2: Custom error
            const selector = data.slice(0, 10);
            const signature = this.customMap.get(selector);

            if (!signature) {
            return `Unknown custom error selector: ${selector}`;
            }

            try {
            // Crear fragmento y decodificar argumentos
            const fragment = Fragment.from(`error ${signature}`);
            const iface = new Interface([fragment]);
            const args = iface.decodeErrorResult(signature.split("(")[0], data);

            const decodedArgs = args.map((a: any) => String(a)).join(", ");
            return `CustomError: ${signature}${decodedArgs ? ` → (${decodedArgs})` : ""}`;
            } catch (decodeErr) {
            return `CustomError: ${signature} (unable to decode args)`;
            }
        } catch (err) {
            return `Unable to decode revert data: ${(err as Error).message}`;
        }
    }

    private _extractCustomError(abi:any){
        // Normaliza el ABI a array
        const abiArray: any[] = (() => {
            if (!abi) return [];
            if (Array.isArray(abi)) return abi as any[];
            if (typeof abi === "string") {
            try {
                return JSON.parse(abi);
            } catch {
                return [];
            }
            }
            return [];
        })();

        // Función auxiliar para construir los tipos canónicos
        const canonicalType = (param: any): string => {
            if (!param || !param.type) return "unknown";

            if (param.type.startsWith("tuple")) {
            const arraySuffix = param.type.slice("tuple".length);
            const comps = Array.isArray(param.components) ? param.components : [];
            const inner = comps.map(canonicalType).join(",");
            return `(${inner})${arraySuffix}`;
            }

            return param.type;
        };

        // Recorre el ABI buscando errores personalizados
        for (const entry of abiArray) {
            if (!entry || entry.type !== "error") continue;

            const name: string = entry.name ?? "";
            const inputs: any[] = Array.isArray(entry.inputs) ? entry.inputs : [];

            // Construye la firma canónica del error
            const signature = `${name}(${inputs.map(canonicalType).join(",")})`;

            // Calcula el selector (primeros 4 bytes del hash keccak256)
            const selector = keccak256(toUtf8Bytes(signature)).slice(0, 10);

            //console.log(`Custom error found: ${signature} with selector ${selector}`);

            // Guarda en el mapa interno
            this.customMap.set(selector, signature);
        }
    }
}

async function validateFacests(
    hre: HardhatRuntimeEnvironment,
    businessAddress: string
) {
    const contractMatcher = new ContractMatcher()
    await contractMatcher.init(hre)

    const provider = hre.ethers.provider

    console.log(
        `\n\n--- Calling facets() function ---------------------------------------`
    )

    const artifactLoupe = await import(
        '../../artifacts/contracts/proxies/eip2535/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json'
    )
    const loupeAdapterContract = new hre.ethers.Contract(
        businessAddress,
        artifactLoupe.abi,
        provider
    )
    const result = await loupeAdapterContract.facets()

    const facets: Facet[] = await Promise.all(
        result.map(
            async ([facetAddress, selectors]: [
                string,
                string[],
            ]): Promise<Facet> => ({
                facetAddress,
                selectors,
                numSelectors: selectors.length,
                facetName: await contractMatcher.singleContractMatcher(
                    facetAddress,
                    hre
                ),
            })
        )
    )

    // Tabla resumen
    console.log('📘 FACET TABLE:\n')
    console.table(
        facets.map((f: Facet, i: number) => ({
            '#': i + 1,
            'FACET ADDRESS': f.facetAddress,
            '# SELECTORS': f.numSelectors,
            'FACET NAME': f.facetName,
        }))
    )

    // Detalle
    console.log('\n📋 SELECTOR DETAIL:')
    for (const [i, f] of facets.entries()) {
        console.log(`\n${i + 1}. Facet: ${f.facetAddress} (${f.facetName})`)
        console.log(' * Selectors:')
        for (const s of f.selectors) {
            console.log(
                `   ${contractMatcher.matchSelector(s)} ${'.'.repeat(90 - contractMatcher.matchSelector(s).length)} [ ${s} ]`
            )
        }
    }

    console.log(
        `\n\n--- FACETS VALIDATION COMPLETED ---------------------------------------\n`
    )
}

async function validatePausable(
    hre: HardhatRuntimeEnvironment,
    businessAddress: string
) {
    const signatureProvider: ISignatureProvider =
        SignatureProviderFactory.create(hre)
    const signer: AbstractSigner = await signatureProvider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log(`Using signer address: ${signerAddress}`)

    console.log(
        `\n\n--- Calling pause() function ---------------------------------------`
    )
    const artifactPausable = await import(
        '../../artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json'
    )
    const txExec = new txExcecutor(artifactPausable.abi);
    

    const pausableContract = new hre.ethers.Contract(
        businessAddress,
        artifactPausable.abi,
        signer
    )

    const autorityLevel = await pausableContract.authorityLevel()
    console.log(`Authority level of signer: ${autorityLevel}`)

    let paused = await pausableContract.paused()
    console.log(`Current paused state: ${paused}`)

    //process.stdout.write('\x1b[31mWaiting TX (pause) to be processed...\x1b[0m\r');
    //await txExec.processTX('Pause', ()=>pausableContract.pause())
    await pause(businessAddress, signatureProvider);
    paused = await pausableContract.paused()
    console.log(`PAUSE:  paused state: ${paused}                    `)

    let authorityLevel = await pausableContract.authorityLevel()
    console.log(`Authority level of signer: ${authorityLevel}`)

    process.stdout.write(
        '\x1b[31mWaiting TX (unpause) to be processed...\x1b[0m\r'
    )
    //await txExec.processTX('Unpause', ()=>pausableContract.unpause())
    await unpause(businessAddress, signatureProvider);
    paused = await pausableContract.paused()
    console.log(`UNPAUSE: paused state: ${paused}              `)

    authorityLevel = await pausableContract.authorityLevel()
    console.log(`Authority level of signer: ${authorityLevel}`)
    console.log(
        `\n\n--- PAUSE FUNCTION VALIDATION COMPLETED ---------------------------------------\n`
    )
}

async function validateRoles(
    hre: HardhatRuntimeEnvironment,
    businessAddress: string
) {
    // Por implementar
    console.log(
        `\n\n--- VALIDATING ROLES ---------------------------------------\n`
    )

    //const provider = hre.ethers.provider
    // const signer: AbstractSigner = new hre.ethers.Wallet(
    //     PRIVATE_ISBE_PROXY_ADDRESS,
    //     provider
    // )
    //const signer = (await hre.ethers.getSigners())[0];
    const signatureProvider: ISignatureProvider =
        SignatureProviderFactory.create(hre)
    const signer: Signer = await signatureProvider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log(`Using signer address: ${signerAddress}`)
    console.log("Current network "+hre.network.name);

    const artifact = await import(
        '../../artifacts/contracts/factory/accessControl/AccessControlGovernanceFacet.sol/AccessControlGovernanceFacet.json'
    )
    const txExec = new txExcecutor(artifact.abi);
    const accessControlContract = new hre.ethers.Contract(
        businessAddress,
        artifact.abi,
        signer
    )
    const roleNumber: number = Number(
        await accessControlContract.getRolesByAccountCount(signerAddress)
    )
    console.log(`Roles count for business address: ${roleNumber}`)

    let roles = await accessControlContract.getRolesByAccount(
        signerAddress,
        0n,
        roleNumber
    )
    roles.forEach((r: string, i: number) => {
        console.log(`  Role ${i}: ${r}`)
    })

    const role: string = '' + Array.from(roles)[roleNumber - 1]
    console.log(`\nTesting last role: ${role} \n`)

    // await txExec.processTX(
    //     'Revoke Role',
    //     ()=>accessControlContract.revokeRole(role, signerAddress) <---- Lanzar como rawtransaction y usar renunce role
    // )
    await revokeRole(role, signerAddress, businessAddress, signatureProvider);
    console.log(`Renounced role ${role}`)
    roles = await accessControlContract.getRolesByAccount(
        signerAddress,
        0n,
        roleNumber - 1
    )
    roles.forEach((r: string, i: number) => {
        console.log(`  Role ${i}: ${r}`)
    })
    console.log('')

    // process.stdout.write(
    //     '\x1b[31mWaiting TX (rgrantRole) to be processed...\x1b[0m\r'
    // )
    // await txExec.processTX(
    //     'Grant Role',
    //     () => accessControlContract.grantRole(role, signerAddress )
    // )
    await grantRole(role, signerAddress, businessAddress, signatureProvider);

    console.log(`Granded role ${role}`)
    roles = await accessControlContract.getRolesByAccount(
        signerAddress,
        0n,
        roleNumber
    )
    roles.forEach((r: string, i: number) => {
        console.log(`  Role ${i}: ${r}`)
    })

    // roles = await accessControlContract.getRolesByAccountCount("0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6");
    // console.log(`Roles count for governance address: ${roles}`);
    // roles = await accessControlContract.getRolesByAccountCount("0x5FbDB2315678afecb367f032d93F642f64180aa3");
    // console.log(`Roles count for default address: ${roles}`);
    console.log(
        `\n\n--- ROLES VALIDATION COMPLETED ---------------------------------------\n`
    )
}

async function validateBusinesLogic(
    hre: HardhatRuntimeEnvironment,
    businessAddress: string
) {
    console.log(
        `\n\n--- VALIDATING BUSINESS LOGIC ---------------------------------------\n`
    )
    const provider = hre.ethers.provider
    const artifact = await import(
        '../../artifacts/contracts/factory/businesslogic/BusinessLogicFactoryFacet.sol/BusinessLogicFactoryFacet.json'
    )
    const businessLogicContract = new hre.ethers.Contract(
        businessAddress,
        artifact.abi,
        provider
    )

    const businessLogics: string[] =
        await businessLogicContract.getBusinessLogics()
    //console.log(businessLogics);
    businessLogics.forEach((b: string, i: number) => {
        console.log(`  Business Logic ${i}: ${b}`)
    })

    console.log(
        '\n\n--- BUSINESS LOGIC COMPLETED ---------------------------------------\n'
    )
}

export async function validateGenesis(
    hre: HardhatRuntimeEnvironment,
    businessAddress: string
) {
    console.log(
        `\n\n=== VALIDATING GENESIS DEPLOYMENT ===================================\n`
    )
    await validateFacests(hre, businessAddress)
    await validateBusinesLogic(hre, businessAddress)
    await validateRoles(hre, businessAddress)
    await validatePausable(hre, businessAddress)
    console.log(
        `\n\n=== GENESIS VALIDATION COMPLETED ===================================`
    )
}

