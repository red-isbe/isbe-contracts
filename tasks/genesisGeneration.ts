import { HardhatUserConfig, task } from 'hardhat/config'
import {
    buildGenesisWithAlloc,
    GenesisAlloc,
    getFacetsValidate,
    matchContractNames,
    retrieveSlotStructure,
} from '../scripts/genesisGenerator'
import { LOUPE_ABI } from '../scripts/genesisGenerator/genesisValidator'


const CONFIG_ID =
    '0x0000000000000000000000000000000000000000000000000000000000000001'

const PAUSE_ROLE =
    '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1'

const CUSTOM_BUSINESS_LOGIC_CODE_PATH =
    './artifacts/contracts/hashtimestamp/HashTimestampFacet.sol/HashTimestampFacet.json'

const CUSTOM_BUSINESS_LOGIC_ID =
    '0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a'

const DEFAULT_BUSINESS_LOGICS_CODE_PATHS = [
    './artifacts/contracts/proxies/isbeproxy/facets/IsbeCutFacet.sol/IsbeCutFacet.json',
    './artifacts/contracts/proxies/isbeproxy/facets/IsbeLoupeFacet.sol/IsbeLoupeFacet.json',
    './artifacts/contracts/access/accessControl/AccessControlFacet.sol/AccessControlFacet.json',
    './artifacts/contracts/pause/ISBEPauseFacet.sol/ISBEPauseFacet.json',
]

const DEFAULT_BUSINESS_LOGICS_IDS = [
    '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25',
    '0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2',
    '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c',
    '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3',
]

const USE_CASE_ROLES = [
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
    '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239',
]

const DUMB_ROLE =
    '0xfd7c9c0377a2a6c4d8b9979f202e292dafbdfc5571e38d678a0f17ba082ac055'
const DUMB_ROLE_2 =
    '0x17cb3e1f7aabf16b3fd269c288ae0a59540f78cdbba8f4f7fa08cd952b850fca'


task(
    'genesis:generate',
    'Generate genesis by extracting storage slots from deployment transactions in Hardhat network'
).addOptionalParam(
    "template",                   
    "Template JSON file to use",  
    "qbftConfigFile.json"        
  ).setAction(async (taskArgs, hre) => {
    console.info("---------------------------------------------------------------------")
    console.info("🚀    ISBE Genesis generation started...")
    console.info("---------------------------------------------------------------------")
    hre.network.name = 'hardhat'

    let templateDir = (hre.config as unknown as { genesisGenerator: { templateDir: string } }).genesisGenerator.templateDir;
    if(templateDir.slice(-1) !== '/') {
        templateDir += '/';
    }
    let outputDir = (hre.config as unknown as { genesisGenerator: { outputDir: string } }).genesisGenerator.outputDir;
    if(outputDir.slice(-1) !== '/') {
        outputDir += '/';
    }
    
    const templateFile = taskArgs.template;
    const genesisTemplateFile = templateDir + templateFile;
    const outputFile = outputDir + templateFile;
    console.log(`📄 Using template file: ${genesisTemplateFile}`);

    console.log('🚀 DeployAll...')
    const result = await hre.run('deployAll')
    console.log('✅ Deploy all (Done).')

    console.log('🚀 Genesis generation...')
    let slotStructure: GenesisAlloc = await retrieveSlotStructure(hre)
    slotStructure = await matchContractNames(hre, slotStructure)
    console.log(
        '✅ Slot structure retrieved.----------------------------------------------------------'
    )
     await buildGenesisWithAlloc(genesisTemplateFile, slotStructure, outputFile);
    

    console.log(
        '✅ Genesis generation (Done).----------------------------------------------------------'
    )

    return result // propagate deployAll result if neeeded
})


task(
    'genesis:validate',
    'Validate genesis by extracting storage slots from deployment transactions in Hardhat network'
).addOptionalParam(
    "proxyaddress",                  
    "Gobernance Address",  
    "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6"         
  ).setAction(async (taskArgs, hre) => {
    console.info("---------------------------------------------------------------------")
    console.info("🚀    ISBE Genesis validation started...")
    console.info("---------------------------------------------------------------------")
    
    const provider = hre.ethers.provider;
    const proxyaddress:string = taskArgs.proxyaddress;
    console.log(`📄 Using address: ${proxyaddress}`);
   
    const contract = new hre.ethers.Contract(proxyaddress, LOUPE_ABI, provider);
    const selector = contract.interface.getFunction("facets")?.selector

    console.log("Selector facets():", selector); // 0x7a0ed627
    console.log('Diamond facets:')
    // const facets = await contract.facets();
    const facets = await provider.send("eth_call", [{
        to: proxyaddress, 
        data: selector 
    },"latest"]);
    console.log(facets);

    // for (let i = 0; i < resultGovernanceFacets.facets.length; i++) {
    //     console.log('  Facet :', resultGovernanceFacets.facets[i].facetAddress)
    //     for (
    //         let j = 0;
    //         j < resultGovernanceFacets.facets[i].functionSelectors.length;
    //         j++
    //     ) {
    //         console.log(
    //             '     Selector : ',
    //             resultGovernanceFacets.facets[i].functionSelectors[j]
    //         )
    //     }
    // }

    
});