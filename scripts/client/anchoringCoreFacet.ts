import { Contract, Signer, TransactionResponse, Provider } from "ethers";
import { ISignatureProvider } from "../../tasks/index";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TransactionReceipt } from "ethers/lib.esm";


class ErrorDecoder {
    private hre: HardhatRuntimeEnvironment;
    private contractName: string;

    constructor(hre: HardhatRuntimeEnvironment, contractName: string = "AnchoringCoreFacet") {
        this.hre = hre;
        this.contractName = contractName;
    }

    async processTx(txPromise: Promise<TransactionResponse>): Promise<any> {
        try{
            const tx: TransactionResponse = await txPromise;
            process.stdout.write(
                'Sending transaction to network. TX Hash: ' + tx.hash + '           \r'
            );  
            const receipt: TransactionReceipt = await tx.wait();
            process.stdout.write(
                'Sending transaction to network. TX Hash: ' + tx.hash +'    [\x1b[32mOK\x1b[0m]                              \n'
            )
            return receipt;
        }catch(error){
            if(error.data){
                const decodedError = await this.decodeError(error.data);
                console.error("Decoded error:  \x1b[31m" + decodedError+ "\x1b[0m \n\n");
            }
        throw error;
        }
    }

    private async decodeError(data: string): Promise<string> {
        // The first 4 bytes are the function selector
        const errorSelector = data.slice(0, 10); // '0x' + 8 hex chars

        // The rest is the encoded error message
        const errorData = '0x' + data.slice(10);

        const abi = (await this.hre.artifacts.readArtifact(this.contractName)).abi;

        // Find the error definition in the ABI
        const errorFragment = abi.find((item: any) => 
            item.type === 'error' && 
            this.hre.ethers.id(item.name + '(' + (item.inputs ? item.inputs.map((input: any) => input.type).join(',') : '') + ')').slice(0, 10) === errorSelector
        );
        
        if (!errorFragment) {
            return `Unknown error with selector ${errorSelector}`;
        }

        // Decode the error parameters using AbiCoder from ethers v6
        const abiCoder = this.hre.ethers.AbiCoder.defaultAbiCoder();
        const decodedParams = abiCoder.decode(
            errorFragment.inputs.map((input: any) => input.type),
            errorData
        );

        // Construct a readable error message
        let errorMessage = `${errorFragment.name}(`;
        errorFragment.inputs.forEach((input: any, index: number) => {
            errorMessage += `${input.name}: ${decodedParams[index]}`;
            if (index < errorFragment.inputs.length - 1) {
                errorMessage += ', ';
            }
        });
        errorMessage += ')';

        return errorMessage;
    }
}


async function getContract(hre: HardhatRuntimeEnvironment, contractAddress: string): Promise<Contract> {
    console.log(`Getting AnchoringCoreFacet contract at address: ${contractAddress}`);
    const artifact = await hre.artifacts.readArtifact("AnchoringCoreFacet");
    
    const contract = new hre.ethers.Contract(contractAddress, artifact.abi);
    return contract;
}



/***************************************************************************************************************************** */


export async function getRegisteredChains(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    pageindex: string, 
    pagelength: string
): Promise<{ _thisChainId: bigint, _registeredChainIds: bigint[] }> {

    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);
    
    // Convert string parameters to numbers
    const pageIndexNum = Number(pageindex);
    const pageLengthNum = Number(pagelength);
    
    console.log(`Fetching registered chains with pageIndex: ${pageIndexNum}, pageLength: ${pageLengthNum}`);
    const result = await connectedContract.getRegisteredChains(pageIndexNum, pageLengthNum);
    console.log(`Fetched ${result._registeredChainIds.length} registered chain IDs.`);

    return {
        _thisChainId: result._thisChainId,
        _registeredChainIds: result._registeredChainIds
    };
}


export async function getChainMetadata(hre: HardhatRuntimeEnvironment, governancediamond: string): 
    Promise<{ _thisChainId: bigint, _registeredChainIds: bigint[] }> {

    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);
    
    const result = await connectedContract.getChainMetadata();

    return {
        _thisChainId: result._thisChainId,
        _registeredChainIds: result._registeredChainIds
    };
}

export async function getAnchoringStats(hre: HardhatRuntimeEnvironment, governancediamond: string, chainid: string): 
    Promise<{ _totalAnchors: bigint, _lastAnchoredBlock: bigint, _thisChainId: bigint, _anchoredChainId: bigint }> {

    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);

    const result = await connectedContract.getAnchoringStats(chainid);

    return {
        _totalAnchors: result._totalAnchors,
        _lastAnchoredBlock: result._lastAnchoredBlock,
        _thisChainId: result._thisChainId,
        _anchoredChainId: result._anchoredChainId
    };
}

export async function getBlocksInRange(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    startblock: string, 
    endblock: string
): Promise<Array<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}>> {

    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);

    const result = await connectedContract.getBlocksInRange(chainid, startblock, endblock);

    return result;
}

export async function getLastNBlocks(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    nblocks: string
): Promise<Array<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}>> {

    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);

    const result = await connectedContract.getLastNBlocks(chainid, nblocks);
    
    return result;
}

export async function isBlockAnchored(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    blocknumber: string
): Promise<boolean> {
    
    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);
    const result = await connectedContract.isBlockAnchored(chainid, blocknumber);
    return result;
}

export async function getAnchoredBlock(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    blocknumber: string
): Promise<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}> {
    
    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);
    const result = await connectedContract.getAnchoredBlock(chainid, blocknumber);
    return result;
}  

export async function getLastAnchoredBlock(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string
): Promise<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}> {

    const contract = await getContract(hre, governancediamond);
    const provider: Provider = hre.ethers.provider;
    console.log(`Using HRE default provider with network: ${await provider.getNetwork().then(n => n.name)}`);
    const connectedContract = contract.connect(provider);
    const result = await connectedContract.getLastAnchoredBlock(chainid);
    return result;
}

export async function registerChain(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string, 
    signatureProvider: ISignatureProvider
): Promise<void> {
    
    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    
    // Convert string parameter to proper type
    const chainIdNum = Number(chainid);
    
    const errorDecoder = new ErrorDecoder(hre, "AnchoringCoreFacet");
    
    if (signatureProvider.getCurveType() === 'secp256r1') {
        // For secp256r1, encode the function call and send as raw transaction
        const data = contract.interface.encodeFunctionData("registerChain", [chainIdNum]);
        
        const tx = signatureProvider.sendTransaction({
            to: governancediamond,
            data: data
        });
        
        const receipt = await errorDecoder.processTx(tx);
    } else {
        // For secp256k1, use standard contract call
        const connectedContract = contract.connect(signer);
        const receipt = await errorDecoder.processTx(connectedContract.registerChain(chainIdNum));
    }
    
    console.log(`Transaction confirmed.`);
}

export async function anchorBlock(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string, 
    blocknumber: string, 
    blockhash: string, 
    stateroot: string, 
    signatureProvider: ISignatureProvider
): Promise<void> {

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    
    // Convert string parameters to proper types
    const chainIdNum = Number(chainid);
    const blockNumberNum = Number(blocknumber);
    
    const errorDecoder = new ErrorDecoder(hre, "AnchoringCoreFacet");
    
    if (signatureProvider.getCurveType() === 'secp256r1') {
        // For secp256r1, encode the function call and send as raw transaction
        const data = contract.interface.encodeFunctionData("anchorBlock", [chainIdNum, blockNumberNum, blockhash, stateroot]);
        
        const tx = signatureProvider.sendTransaction({
            to: governancediamond,
            data: data
        });
        
        const receipt = await errorDecoder.processTx(tx);
    } else {
        // For secp256k1, use standard contract call
        const connectedContract = contract.connect(signer);
        const receipt = await errorDecoder.processTx(connectedContract.anchorBlock(
            chainIdNum, 
            blockNumberNum, 
            blockhash, 
            stateroot
        ));
    }
    
    console.log(`Transaction confirmed.`);
}


export async function anchorBlocksBatch(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string, 
    blockNumbersArr: string[], 
    blockHashesArr: string[], 
    stateRootsArr: string[], 
    signatureProvider: ISignatureProvider
): Promise<void> {
    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    
    // Convert string parameters to proper types
    const chainIdNum = Number(chainid);
    const blockNumbersNum = blockNumbersArr.map(n => Number(n));
    
    console.log('\n📋 anchorBlocksBatch parameters:');
    console.log('  governancediamond:', governancediamond);
    console.log(`  chainid: ${chainIdNum} (converted from string: ${chainid})`);
    console.log(`  blockNumbersArr:(length: ${blockNumbersNum.length})`);
    console.log(`  blockHashesArr: (length: ${blockHashesArr.length})`);
    console.log(`  stateRootsArr:(length: ${stateRootsArr.length})`);
    console.log('\n  Individual values:');
    blockNumbersNum.forEach((num, i) => {
        console.log(`    [${i}] blockNumber: ${num}, blockHash: ${blockHashesArr[i]}, stateRoot: ${stateRootsArr[i]}`);
    });

    const errorDecoder = new ErrorDecoder(hre, "AnchoringCoreFacet");
    
    if (signatureProvider.getCurveType() === 'secp256r1') {
        // For secp256r1, encode the function call and send as raw transaction
        const data = contract.interface.encodeFunctionData("anchorBlocksBatch", [chainIdNum, blockNumbersNum, blockHashesArr, stateRootsArr]);
        
        const tx = signer.sendTransaction({
            to: governancediamond,
            data: data
        });
        
        const receipt = await errorDecoder.processTx(tx);
    } else {
        // For secp256k1, use standard contract call
        const connectedContract = contract.connect(signer);
        const receipt = await errorDecoder.processTx(connectedContract.anchorBlocksBatch(
            chainIdNum, 
            blockNumbersNum, 
            blockHashesArr, 
            stateRootsArr
        ));
    }

    console.log(`Transaction confirmed.`);  
}