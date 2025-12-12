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
import { EllipticType } from './identity'

export const Stage = {
    NONE: 0,
    DEV: 1,
    PRE: 2,
    PROD: 3,
} as const
export type Stage = (typeof Stage)[keyof typeof Stage]

export interface Resource {
    resourceId: string
    resource: string
}

// Define specific types for your event structure
export interface NetworkData {
    chainId: bigint
    name: string
    algorithm: EllipticType
    symbol: string
    stage: Stage
    resources: Resource[]
}

export interface UpdateNetworkData {
    chainId: bigint
    name: string
    algorithm: EllipticType
    symbol: string
    stage: Stage
}
