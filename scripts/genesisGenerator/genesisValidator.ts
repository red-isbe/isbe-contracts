import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ContractMatcher } from "./contractMatcher";
import { CONFIGURATION_ID_DID_REGISTRY } from "../../test/initialization";
import { AbstractSigner, TransactionResponse } from "ethers";
import { Signer } from "ethers/lib.esm";

// Tipo de dato de la estructura base devuelta por facets()
type RawFacetEntry = [string, string[]];

// Tipo del objeto transformado más legible
interface Facet {
  facetAddress: string;
  selectors: string[];
  numSelectors: number;
  facetName?: string;
}


const ISBE_PROXY_ADDRESS = "0x301dc252d2e09eac1a34f017bdc240d2d72037c2"; // An address of the proxy contracts to test global pause/unpause
const PRIVATE_ISBE_PROXY_ADDRESS = "0x4ac8ab5147f0b280ce96bd1b90a9b3e840804f7e696c16871d2a1f33f93ec063"; // A PK for testing only




async function processTX(message:string,tx:Promise<TransactionResponse>):Promise<void> {
    const pTx:TransactionResponse = await tx;
    process.stdout.write(`\x1b[31m ${message} - Process transaction (TX: ${(await tx).hash})...\x1b[0m\r`);
    await pTx.wait();
    process.stdout.write(`${message} - Process transaction (TX: ${(await tx).hash}) \x1b[32m[OK]\x1b[0m              \n`);
}

async function validateFacests(hre: HardhatRuntimeEnvironment, businessAddress:string) {
    const contractMatcher = new ContractMatcher();
    await contractMatcher.init(hre);
    
    const provider = hre.ethers.provider;

    console.log(`\n\n--- Calling facets() function ---------------------------------------`);

    const artifactLoupe = await import('../../artifacts/contracts/proxies/eip2535/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json');
    const loupeAdapterContract = new hre.ethers.Contract(businessAddress, artifactLoupe.abi, provider);
    const result = await loupeAdapterContract.facets();


    const facets: Facet[] = await Promise.all(
    result.map(async ([facetAddress, selectors]: [string, string[]]): Promise<Facet> => ({
        facetAddress,
        selectors,
        numSelectors: selectors.length,
        facetName: await contractMatcher.singleContractMatcher(facetAddress, hre)
    }))
    );

    // Tabla resumen
    console.log("📘 FACET TABLE:\n");
    console.table(
    facets.map((f: Facet, i: number) => ({
        "#": i + 1,
        "FACET ADDRESS": f.facetAddress,
        "# SELECTORS": f.numSelectors,
        "FACET NAME": f.facetName,
    }))
    );

    // Detalle
    console.log("\n📋 SELECTOR DETAIL:");
    for (const [i, f] of facets.entries()) {
        console.log(`\n${i + 1}. Facet: ${f.facetAddress} (${f.facetName})`);
        console.log(" * Selectors:");
        for (const s of f.selectors){
            console.log(`   ${contractMatcher.matchSelector(s)} ${".".repeat(90 - contractMatcher.matchSelector(s).length)} [ ${s} ]`);
        }
    }

    console.log(`\n\n--- FACETS VALIDATION COMPLETED ---------------------------------------\n`);   
}

async function validatePausable(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    
    const provider = hre.ethers.provider;
    const signer:AbstractSigner = new hre.ethers.Wallet(PRIVATE_ISBE_PROXY_ADDRESS, provider);
    const signerAddress = await signer.getAddress();
    console.log(`Using signer address: ${signerAddress}`);
    console.log(`\n\n--- Calling pause() function ---------------------------------------`);
    const artifactPausable = await import('../../artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json');
    const pausableContract = new hre.ethers.Contract(businessAddress, artifactPausable.abi, signer);

    const autorityLevel = await pausableContract.authorityLevel();
    console.log(`Authority level of signer: ${autorityLevel}`);
    
    let paused = await pausableContract.paused();
    console.log(`Current paused state: ${paused}`);
    
    //process.stdout.write('\x1b[31mWaiting TX (pause) to be processed...\x1b[0m\r');
    await processTX("Pause",pausableContract.pause());
    paused = await pausableContract.paused();
    console.log(`PAUSE:  paused state: ${paused}                    `);

    let authorityLevel = await pausableContract.authorityLevel();
    console.log(`Authority level of signer: ${authorityLevel}`);

    process.stdout.write('\x1b[31mWaiting TX (unpause) to be processed...\x1b[0m\r');;
    await processTX("Unpause", pausableContract.unpause());
    paused = await pausableContract.paused();
    console.log(`UNPAUSE: paused state: ${paused}              `);

    authorityLevel = await pausableContract.authorityLevel();
    console.log(`Authority level of signer: ${authorityLevel}`);
    console.log(`\n\n--- PAUSE FUNCTION VALIDATION COMPLETED ---------------------------------------\n`);
}

async function validateRoles(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    // Por implementar
    console.log(`\n\n--- VALIDATING ROLES ---------------------------------------\n`);
    const provider = hre.ethers.provider;
    const signer:AbstractSigner = new hre.ethers.Wallet(PRIVATE_ISBE_PROXY_ADDRESS, provider);
    const signerAddress = await signer.getAddress();
    console.log(`Using signer address: ${signerAddress}`);
    const artifact = await import('../../artifacts/contracts/factory/accessControl/AccessControlGovernanceFacet.sol/AccessControlGovernanceFacet.json');
    const accessControlContract = new hre.ethers.Contract(businessAddress, artifact.abi, signer);
    let roleNumber:number = Number(await accessControlContract.getRolesByAccountCount(signerAddress));
    console.log(`Roles count for business address: ${roleNumber}`);

    let roles = await accessControlContract.getRolesByAccount(signerAddress,0n,roleNumber);
    roles.forEach((r:string,i:number) => {
        console.log(`  Role ${i}: ${r}`);
    });

    let role: string = ""+ Array.from(roles)[roleNumber - 1]
    console.log(`\nTesting last role: ${role} \n`);

    await processTX("Revoke Role", accessControlContract.revokeRole(role,signerAddress));
    console.log(`Renounced role ${role}`);
    roles = await accessControlContract.getRolesByAccount(signerAddress,0n,roleNumber-1);
    roles.forEach((r:string,i:number) => {
        console.log(`  Role ${i}: ${r}`);
    });
    console.log("");

    process.stdout.write('\x1b[31mWaiting TX (rgrantRole) to be processed...\x1b[0m\r');
    await processTX("Grant Role", accessControlContract.grantRole(role,signerAddress));
    console.log(`Granded role ${role}`);
    roles = await accessControlContract.getRolesByAccount(signerAddress,0n,roleNumber);
    roles.forEach((r:string,i:number) => {
        console.log(`  Role ${i}: ${r}`);
    });

    // roles = await accessControlContract.getRolesByAccountCount("0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6");
    // console.log(`Roles count for governance address: ${roles}`);
    // roles = await accessControlContract.getRolesByAccountCount("0x5FbDB2315678afecb367f032d93F642f64180aa3");
    // console.log(`Roles count for default address: ${roles}`);
    console.log(`\n\n--- ROLES VALIDATION COMPLETED ---------------------------------------\n`);
}

async function validateBusinesLogic(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    console.log(`\n\n--- VALIDATING BUSINESS LOGIC ---------------------------------------\n`);
    const provider = hre.ethers.provider;
    const artifact = await import('../../artifacts/contracts/factory/businesslogic/BusinessLogicFactoryFacet.sol/BusinessLogicFactoryFacet.json');
    const businessLogicContract = new hre.ethers.Contract(businessAddress, artifact.abi, provider);

    const businessLogics:string[] = await businessLogicContract.getBusinessLogics();
    //console.log(businessLogics);
    businessLogics.forEach((b:string,i:number) => {
        console.log(`  Business Logic ${i}: ${b}`);
    });

    console.log("\n\n--- BUSINESS LOGIC COMPLETED ---------------------------------------\n");
}

async function validateGlobalPause(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    console.log(`\n\n--- GLOBAL PAUSE/UNPAUSE TEST ---------------------------------------\n`);
    const provider = hre.ethers.provider;
    const signer:AbstractSigner = new hre.ethers.Wallet(PRIVATE_ISBE_PROXY_ADDRESS, provider);
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const artifact = await import('../../artifacts/contracts/factory/globalisbepause/GlobalIsbePause.sol/GlobalIsbePause.json');
    const globalPauseIsbeContract = new hre.ethers.Contract(businessAddress, artifact.abi, signer);

    
    const artifactPausable = await import('../../artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json');
    const pausableContract = new hre.ethers.Contract(ISBE_PROXY_ADDRESS, artifactPausable.abi, signer);

    let paused = await pausableContract.paused();
    console.log(`CURRENT paused state: ${paused}`);

    await processTX("Global Pause", globalPauseIsbeContract.pauseIsbe(ISBE_PROXY_ADDRESS));

    paused = await pausableContract.paused();
    console.log(`NEW paused state: ${paused}`);

    await processTX("Global UnPause", globalPauseIsbeContract.unpauseIsbe(ISBE_PROXY_ADDRESS));
}

async function validateProxyFactory(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    console.log(`\n\n--- VALIDATING PROXY FACTORY ---------------------------------------\n`);
    const provider = hre.ethers.provider;
    const artifact = await import('../../artifacts/contracts/factory/proxyfactory/ProxyFactoryFacet.sol/ProxyFactoryFacet.json');
    const proxyFactory = new hre.ethers.Contract(businessAddress, artifact.abi, provider);
    const configurations = await proxyFactory.getConfigurationByProxy(ISBE_PROXY_ADDRESS);
    console.log(`Configuration for ISBE Proxy (${ISBE_PROXY_ADDRESS}):`);
    console.log(`  - Configuration ID: \t${configurations[0]}`);
    console.log(`  - Version: \t\t${configurations[1]}`);

}

export async function validateGenesis(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    console.log(`\n\n=== VALIDATING GENESIS DEPLOYMENT ===================================\n`);
    await validateFacests(hre, businessAddress);
    await validateProxyFactory(hre, businessAddress);
    await validateBusinesLogic(hre, businessAddress);
    await validatePausable(hre, businessAddress);
    await validateRoles(hre, businessAddress);
    await validateGlobalPause(hre, businessAddress);
    console.log(`\n\n=== GENESIS VALIDATION COMPLETED ===================================`);
}