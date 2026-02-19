// SPDX-License-Identifier: Apache-2.0

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
pragma solidity ^0.8.28;

import {ICompliance} from './compliance/ICompliance.sol';
import {IERC3643} from './token/IERC3643.sol';
import {
    IBasicWhitelist
} from '../../access/whitelist/basic/IBasicWhitelist.sol';

/**
 * @title IToken3643
 * @notice Interfaz principal para tokens ERC-3643 con soporte de cumplimiento regulatorio.
 * @dev Este interfaz unifica los módulos de ERC-3643 y de cumplimiento (compliance),
 *      extendiendo la funcionalidad estándar ERC-20 con capacidades regulatorias y de identidad.
 *
 * El interfaz hereda de:
 * - IERC3643: funcionalidades modulares de ERC-3643 (identidad, recuperación, congelación,
 * pausa, operaciones por lotes, metadatos extendidos, etc.)
 * - ICompliance: reglas y lógica de cumplimiento regulatorio.
 *
 * Este interfaz debe ser implementado por tokens de seguridad que requieran cumplimiento
 * normativo y gestión avanzada de identidad.
 */

// solhint-disable-next-line no-empty-blocks
interface IToken3643 is IERC3643, ICompliance, IBasicWhitelist {}
