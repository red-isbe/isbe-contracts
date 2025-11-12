// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICompliance} from './compliance/ICompliance.sol';
import {IERC3643} from './token/IERC3643.sol';

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
interface IToken3643 is IERC3643, ICompliance {}
