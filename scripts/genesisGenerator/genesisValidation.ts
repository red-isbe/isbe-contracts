import { HardhatRuntimeEnvironment } from "hardhat/types"
import {DeploymentResult, DeployedGovernance} from "../../tasks/deployment/types/DeploymentTypes"
import { DeploymentValidator } from "../../tasks/deployment/validators/DeploymentValidator"
import { EIP2535AccessControl, EIP2535AccessControl__factory, IIsbeFactory } from "../../typechain-types";
import { getIsbeFactory } from "../utils/getIsbeFactory";
import { Signer } from "ethers";

export class GenesisValidation {
    private hre: HardhatRuntimeEnvironment;
    private gobernanceAddress: string;

    constructor(hre: HardhatRuntimeEnvironment, gobernanceAddress: string) {
        this.hre = hre;
        this.gobernanceAddress = gobernanceAddress;

    }

    async validate(): Promise<void> {
        console.log('🔍 Executing genesis validations...');
        const code:string = await this.hre.ethers.provider.getCode(this.gobernanceAddress);
        if(!code || code === '0x' || code === '0x0') {
            console.error(`❌ Gobernance contract not found at address ${this.gobernanceAddress} code: ${code}`);
        }else{
            console.info(`✅ Gobernance contract found at address ${this.gobernanceAddress}`);   
        }

        console.log('   ✅ Basic validations completed');
        // const  EIP2535AccessControlFactory = await this.hre.ethers.getContractFactory('EIP2535AccessControl') as EIP2535AccessControl__factory;
        // const isbeFactory:EIP2535AccessControl  = await EIP2535AccessControlFactory.attach(this.gobernanceAddress) as EIP2535AccessControl;
        const dummySigner:Signer = (await this.hre.ethers.getSigners())[0];
        console.log("Factpry address: " + this.gobernanceAddress);
        console.log("Signer address: " + await dummySigner.getAddress());
        const isbeFactory:IIsbeFactory = await getIsbeFactory(this.gobernanceAddress, dummySigner);
        console.log("Factory address: " + await isbeFactory.getAddress());
        console.log("Type: " + typeof isbeFactory);

        const businessLogics:string[] = await isbeFactory.getBusinessLogics();
        console.log(`   ℹ️  Found ${businessLogics.length} business logics in governance contract.`);
    }
}


