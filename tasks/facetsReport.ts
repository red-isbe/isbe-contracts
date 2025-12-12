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
import { validateFacests } from '../scripts/genesisGenerator'
import { task } from 'hardhat/config'

task('facets:report', 'Generates a report of facets in a diamond contract')
    .addParam(
        'governancediamond',
        'The address of the governance diamond contract'
    )
    .setAction(async (taskArgs, hre) => {
        const { governancediamond } = taskArgs

        console.log(
            `Generating facets report for diamond at address: ${governancediamond}`
        )
        await validateFacests(hre, governancediamond)
    })
