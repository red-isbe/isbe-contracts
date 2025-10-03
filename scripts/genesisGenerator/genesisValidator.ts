import { HardhatRuntimeEnvironment } from "hardhat/types";



export async function validateGenesis(hre:HardhatRuntimeEnvironment, url:string, businessAddress:string) {
    const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
    console.log(`Current block number: ${currentBlockNumber}`);

    const artifact = await import('../../artifacts/contracts/proxies/eip2535/EIP2535AccessControl.sol/EIP2535AccessControl.json');
    const abi = artifact.abi;
    const contract = new hre.ethers.Contract(businessAddress, abi, hre.ethers.provider);

    const info = await contract.getInfo();
    console.info('Contract Info: facets: ', info[1].length, ' interfaces: ', info[2].length);

    console.info('--- Selectors -------------------------------------------------');
    for(const selector of info[1]) {
        const facetInfo = await contract.getFacetAddressAndSelectorPosition(selector);
        console.log(`Selector[${selector}] - address: ${facetInfo[0]} - position: ${facetInfo[1]}`);
    }

    console.info('\n\n--- Interfaces -------------------------------------------------');
    for(const interface_ of info[2]) {
        const facetInfo = await contract.getFacetAddressAndInterfacePosition(interface_);
        console.log(`Interface [${interface_}] - address: ${facetInfo[0]} - position: ${facetInfo[1]}`);
    }

}