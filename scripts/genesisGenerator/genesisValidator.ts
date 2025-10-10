import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ContractMatcher } from "./contractMatcher";

// Tipo de dato de la estructura base devuelta por facets()
type RawFacetEntry = [string, string[]];

// Tipo del objeto transformado más legible
interface Facet {
  facetAddress: string;
  selectors: string[];
  numSelectors: number;
  facetName?: string;
}

export async function validateGenesis(hre:HardhatRuntimeEnvironment, businessAddress:string) {
    const contractMatcher = new ContractMatcher();
    await contractMatcher.init(hre);
    
    const provider = hre.ethers.provider;
    const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Current block number: ${currentBlockNumber}`);

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
        console.log("* Selectors:");
        for (const s of f.selectors){
            console.log(`  ${contractMatcher.matchSelector(s)} ${".".repeat(90 - contractMatcher.matchSelector(s).length)} [ ${s} ]`);
        }
    }

    console.log(`\n\n--- Calling pause() function ---------------------------------------`);
    const artifactPausable = await import('../../artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json');
    const pausableContract = new hre.ethers.Contract(businessAddress, artifactPausable.abi, provider);
    const paused = await pausableContract.paused();
    console.log(`Current paused state: ${paused}`);

    


}