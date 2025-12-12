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
import {
    CleanBusinessLogicDeployer,
    CleanUseCaseDeployer,
    DeployedBusinessLogic,
    DeployedUseCase,
    DeploymentConfig,
    ISignatureProvider,
    SignatureProviderFactory,
} from '../../tasks/index'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export class BootstrapIsbenetwork {
    signatureProvider: ISignatureProvider
    config: DeploymentConfig
    governanceResult: DeployedBusinessLogic[] | null = null

    constructor(
        private hre: HardhatRuntimeEnvironment,
        private governanceAddress: string
    ) {
        this.signatureProvider = SignatureProviderFactory.create(hre)
        this.config = DeploymentConfig.getDefaultConfig()
    }

    async facetBootstrap(): Promise<DeployedBusinessLogic[]> {
        console.log(
            '------------------ Bootstrapping Isbe Network ------------------'
        )

        const businessLogicDeployer = new CleanBusinessLogicDeployer(
            this.hre,
            this.signatureProvider
        )

        this.governanceResult = await businessLogicDeployer.deployAll(
            this.config.businessLogics,
            this.governanceAddress
        )
        console.log(
            `✅ Business logics deployed successfully.   Total: ${this.governanceResult.length}----------------------------------------------------------`
        )

        return this.governanceResult
    }

    async usecaseBootstrap(): Promise<DeployedUseCase[]> {
        if (!this.governanceResult) {
            console.info('******   Need to generate facets before usecases')
            this.governanceResult = await this.facetBootstrap()
        }

        console.log(
            '------------------ Bootstrapping Isbe Network Usecases ------------------'
        )
        // Implement usecase bootstrapping logic here
        const useCaseDeployer = new CleanUseCaseDeployer(
            this.hre,
            this.signatureProvider
        )

        const useCases: DeployedUseCase[] = await useCaseDeployer.deployAll(
            this.config.useCases,
            this.governanceAddress,
            this.governanceResult
        )

        return useCases
    }
}
