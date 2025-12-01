import { Contract, Signer } from "ethers";
import { ISignatureProvider } from "../../tasks/index";
import { HardhatRuntimeEnvironment } from "hardhat/types";


async function decodeError(hre:HardhatRuntimeEnvironment,data: string): Promise<string> {
    // The first 4 bytes are the function selector
    const errorSelector = data.slice(0, 10); // '0x' + 8 hex chars

    // The rest is the encoded error message
    const errorData = '0x' + data.slice(10);

    const abi =  (await hre.artifacts.readArtifact("AnchoringCoreFacet")).abi;

    // Find the error definition in the ABI
    const errorFragment = abi.find((item: any) => item.type === 'error' && hre.ethers.id(item.name + '(' + (item.inputs ? item.inputs.map((input: any) => input.type).join(',') : '') + ')').slice(0, 10) === errorSelector);
    
    if (!errorFragment) {
        return `Unknown error with selector ${errorSelector}`;
    }

    // Decode the error parameters using AbiCoder from ethers v6
    const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder();
    const decodedParams = abiCoder.decode(
        errorFragment.inputs.map((input: any) => input.type),
        errorData
    );

    // Construct a readable error message
    let errorMessage = `Error: ${errorFragment.name}(`;
    errorFragment.inputs.forEach((input: any, index: number) => {
        errorMessage += `${input.name}: ${decodedParams[index]}`;
        if (index < errorFragment.inputs.length - 1) {
            errorMessage += ', ';
        }
    });
    errorMessage += ')';

    return errorMessage;    
}

async function getContract(hre: HardhatRuntimeEnvironment, contractAddress: string): Promise<Contract> {
    console.log(`Getting AnchoringCoreFacet contract at address: ${contractAddress}`);
    const artifact = await hre.artifacts.readArtifact("AnchoringCoreFacet");

    const contract = new hre.ethers.Contract(contractAddress, artifact.abi);
    return contract;
}


export async function getRegisteredChains(hre: HardhatRuntimeEnvironment, governancediamond: string, pageindex: string, pagelength: string, signatureProvider: ISignatureProvider): 
    Promise<{ _thisChainId: bigint, _registeredChainIds: bigint[] }> {


    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getRegisteredChains is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer:Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);

    const result = await connectedContract.getRegisteredChains(pageindex, pagelength);

    return {
        _thisChainId: result._thisChainId,
        _registeredChainIds: result._registeredChainIds
    };
}


export async function getChainMetadata(hre: HardhatRuntimeEnvironment, governancediamond: string, signatureProvider: ISignatureProvider): 
    Promise<{ _thisChainId: bigint, _registeredChainIds: bigint[] }> {

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getChainMetadata is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);

    const result = await connectedContract.getChainMetadata();

    return {
        _thisChainId: result._thisChainId,
        _registeredChainIds: result._registeredChainIds
    };
}

export async function getAnchoringStats(hre: HardhatRuntimeEnvironment, governancediamond: string, chainid: string, signatureProvider: ISignatureProvider): 
    Promise<{ _totalAnchors: bigint, _lastAnchoredBlock: bigint, _thisChainId: bigint, _anchoredChainId: bigint }> {

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getAnchoringStats is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);

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
    endblock: string, 
    signatureProvider: ISignatureProvider
): Promise<Array<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}>> {

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getBlocksInRange is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);

    const result = await connectedContract.getBlocksInRange(chainid, startblock, endblock);

    return result;
}

export async function getLastNBlocks(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    nblocks: string, 
    signatureProvider: ISignatureProvider
): Promise<Array<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}>> {

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getLastNBlocks is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);

    const result = await connectedContract.getLastNBlocks(chainid, nblocks);
    
    return result;
}

export async function isBlockAnchored(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    blocknumber: string, 
    signatureProvider: ISignatureProvider
): Promise<boolean> {
    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("isBlockAnchored is not yet supported for secp256r1 curve");
    }
    
    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);
    const result = await connectedContract.isBlockAnchored(chainid, blocknumber);
    return result;
}

export async function getAnchoredBlock(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string,
    blocknumber: string, 
    signatureProvider: ISignatureProvider
): Promise<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}> {
    
    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getAnchoredBlock is not yet supported for secp256r1 curve");
    }
    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);
    const result = await connectedContract.getAnchoredBlock(chainid, blocknumber);
    return result;
}  

export async function getLastAnchoredBlock(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string, 
    signatureProvider: ISignatureProvider
): Promise<{
    blockNumber: bigint;
    blockHash: string;
    stateRoot: string;
    timestamp: bigint;
    anchorer: string;
}> {

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("getLastAnchoredBlock is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);
    const result = await connectedContract.getLastAnchoredBlock(chainid);
    return result;
}

export async function registerChain(
    hre: HardhatRuntimeEnvironment, 
    governancediamond: string, 
    chainid: string, 
    signatureProvider: ISignatureProvider
): Promise<void> {
    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("registerChain is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);
    const tx = await connectedContract.registerChain(chainid);
    console.log(`Transaction submitted. Hash: ${tx.hash}`);
    await tx.wait();
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

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("anchorBlock is not yet supported for secp256r1 curve");
    }

    const contract = await getContract(hre, governancediamond);
    const signer: Signer = await signatureProvider.getSigner();
    console.log(`Using signer address: ${await signer.getAddress()}`);
    const connectedContract = contract.connect(signer);
    const tx = await connectedContract.anchorBlock(
        chainid, 
        blocknumber, 
        blockhash, 
        stateroot
    );
    console.log(`Transaction submitted. Hash: ${tx.hash}`);
    await tx.wait();
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
    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error("anchorBlocksBatch is not yet supported for secp256r1 curve");
    }

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
    let tx
    const connectedContract = contract.connect(signer);
    try{
        tx = await connectedContract.anchorBlocksBatch(
            chainIdNum, 
            blockNumbersNum, 
            blockHashesArr, 
            stateRootsArr
        );
    }catch(error){
        console.error("Error during anchorBlocksBatch transaction submission:", JSON.stringify(error));
        if(error.data){
            const decodedError = await decodeError(hre,error.data);
            console.error("Decoded error:", decodedError);
        }
        throw error;
    }
    console.log(`Transaction submitted. Hash: ${tx.hash}`);
    await tx.wait();
    console.log(`Transaction confirmed.`);  
}