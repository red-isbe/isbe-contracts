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
import { expect } from 'chai'
import { DeploymentConfig } from '../tasks/deployment/config/DeploymentConfig'
import { UTILITY_USE_CASE_CONFIGS } from '../tasks/deployment/constants/utility'

describe('Deployment profiles (hash timestamp use cases)', () => {
    const V1 = UTILITY_USE_CASE_CONFIGS.HASH_TIMESTAMP.description
    const V2 = UTILITY_USE_CASE_CONFIGS.HASH_TIMESTAMP_V2.description

    function profile(name: string): string[] {
        return DeploymentConfig.load(name).useCases.map(
            (useCase) => useCase.description
        )
    }

    it('GIVEN the minimal profile WHEN loading it THEN neither hash timestamp version is deployed', () => {
        const useCases = profile('minimal')

        expect(useCases).to.not.include(V1)
        expect(useCases).to.not.include(V2)
    })

    it('GIVEN the essentials profile WHEN loading it THEN both hash timestamp versions are deployed', () => {
        const useCases = profile('essentials')

        expect(useCases).to.include(V1)
        expect(useCases).to.include(V2)
    })

    it('GIVEN the default configuration WHEN loading it THEN both hash timestamp versions are deployed', () => {
        const useCases = DeploymentConfig.getDefaultConfig().useCases.map(
            (useCase) => useCase.description
        )

        expect(useCases).to.include(V1)
        expect(useCases).to.include(V2)
    })
})
