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
-------------------------------------------------------------- */
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { SignatureProviderFactory } from '../tasks/deployment/providers/SignatureProviderFactory'
import type { ISignatureProvider } from '../tasks/deployment/providers/ISignatureProvider'

export async function getSignatureProvider(
    hre: HardhatRuntimeEnvironment
): Promise<ISignatureProvider> {
    return SignatureProviderFactory.create(hre)
}
