# PDR — Protocolo de Auditoría y Despliegue de Facetas Personalizadas

**Estado:** Propuesta  
**Fecha:** 20/11/2025  
**Stakeholders:** Equipo de Administración ISBE, Seguridad, Clientes

---

## 1) Contexto y problema

ISBE permite a los clientes extender la funcionalidad de sus proxies mediante facetas personalizadas. Sin embargo, dado que estas facetas se ejecutan en el contexto del proxy del cliente (compartiendo almacenamiento y permisos) y se registran en el ecosistema oficial de ISBE, existe un riesgo significativo si no se controlan adecuadamente.

**Riesgos principales:**
*   **Corrupción de Storage:** Una faceta mal diseñada podría sobrescribir datos críticos de otros módulos (ej: balances ERC20) si no usa slots de almacenamiento aislados correctamente.
*   **Bloqueo del Proxy:** Una implementación incorrecta de selectores podría hacer que el proxy deje de responder o que ciertas funciones sean inaccesibles.
*   **Vulnerabilidades de Seguridad:** Código malicioso o con bugs podría comprometer los activos del cliente.

Actualmente, no existe un proceso formal estandarizado para validar, desplegar y registrar estas extensiones de terceros.

---

## 2) Objetivo

Establecer un **protocolo estricto y estandarizado** para la recepción, auditoría técnica, despliegue y registro de facetas personalizadas.

El protocolo debe garantizar:
1.  **Integridad de la Red:** Que ninguna faceta personalizada pueda afectar negativamente a otros usuarios o al sistema global.
2.  **Seguridad del Cliente:** Que el código desplegado cumple con los estándares de seguridad de ISBE.
3.  **Trazabilidad:** Que cada extensión esté correctamente versionada y registrada en el `BusinessLogicRegistry`.

---

## 3) Alcance (v1)

### Incluye

- Definición del **Checklist de Auditoría Técnica** obligatorio.
- Procedimiento de **Despliegue Seguro** por parte de la administración de ISBE.
- Proceso de **Registro y Versionado** en `BusinessLogicRegistry`.
- Estrategia de integración en el **Portal No-Code** para facilitar la adopción.

### Excluye

- Auditoría de lógica de negocio específica del cliente (ej: si su fórmula de royalties es financieramente correcta). La auditoría se centra en seguridad y arquitectura.
- Automatización completa del proceso de auditoría (inicialmente será manual asistido por herramientas).

---

## 4) Decisión

Se implementará un flujo de trabajo de **"Custodia de Despliegue"**. Aunque el cliente desarrolla el código, **ISBE es el único actor autorizado para desplegar y registrar la faceta** en la red oficial.

Esto asegura que el código auditado es *exactamente* el código que se ejecuta en la red, eliminando el riesgo de que un cliente despliegue una versión modificada post-auditoría.

El proceso se divide en 3 fases críticas:
1.  **Auditoría de Arquitectura:** Verificación estática del cumplimiento del patrón Diamond y Storage.
2.  **Despliegue Oficial:** ISBE despliega el contrato y genera el `Custom-ID`.
3.  **Entrega y Activación:** ISBE entrega los datos al cliente (o al Portal) para que el cliente ejecute la integración final (`diamondCut`).

---

## 5) Procedimiento Detallado

### Fase 1: Recepción y Auditoría Técnica

El equipo de ISBE debe validar los siguientes puntos críticos antes de aprobar cualquier código:

#### 1.1 Aislamiento de Storage (Crítico)
*   **Verificación:** Inspeccionar `*Internal.sol`.
*   **Requisito:** Debe usar `keccak256` con un namespace único (ej: `cliente.empresa.modulo`).
*   **Prohibido:** Uso de slots numéricos secuenciales (`slot 0`, `slot 1`) o reutilización de constantes de ISBE.

#### 1.2 Cumplimiento EIP-2535
*   **Verificación:** Inspeccionar `*Facet.sol`.
*   **Requisito:** Implementar `IEIP2535Introspection`.
*   **Validación:** `selectorsIntrospection()` debe retornar *todos* y *solo* los selectores públicos expuestos.
*   **Validación:** `businessIdIntrospection()` debe retornar un ID único consistente.

#### 1.3 Seguridad Operativa
*   **Inicializadores:** Uso correcto de `_disableInitializers` en el constructor para prevenir ataques al contrato de lógica.
*   **Dependencias:** Ausencia de librerías externas enlazadas (external linked libraries) que rompan el `delegatecall`.

### Fase 2: Despliegue y Registro (Admin)

Una vez aprobado el código:

1.  **Despliegue:** ISBE despliega `MiFuncionalidadFacet.sol` a la red.
2.  **Generación de ID:** Se calcula el `Custom-ID` (hash del identificador de negocio).
3.  **Registro:** Se ejecuta la tarea de registro en `BusinessLogicRegistry`:
    ```bash
    npx hardhat register-logic --business-id <Custom-ID> --facet-address <Address> --version 1
    ```

### Fase 3: Integración (Portal / Cliente)

Para cerrar el ciclo, la faceta debe vincularse al proxy del cliente mediante `diamondCut`. La entidad responsable de firmar esta transacción depende del modelo de gobernanza del proxy:

#### Escenario A: Proxy Gestionado (Managed Service)
Si el cliente utiliza un servicio gestionado donde ISBE custodia las llaves o tiene roles de administración delegados:
1.  El cliente solicita la activación (ej: vía Portal).
2.  **ISBE ejecuta la transacción `diamondCut`** en nombre del cliente.

#### Escenario B: Proxy Soberano (Self-Sovereign)
Si el cliente custodia sus propias llaves y es el único administrador de su proxy:
1.  ISBE entrega al cliente el `Custom-ID` y la dirección del contrato desplegado.
2.  **El cliente firma y ejecuta la transacción `diamondCut`** siguiendo la *Guía de Desarrollador*.

#### Vía Portal No-Code (Híbrida)
El Portal puede facilitar la construcción de la transacción (`calldata`) para que el cliente solo tenga que firmarla (Escenario B) o enviarla al backend para su ejecución (Escenario A).

---

## 6) Gestión de Ciclo de Vida

*   **Actualizaciones:** Para v2, se repite el proceso. ISBE registra la nueva dirección bajo el mismo `Custom-ID` con `version 2`. El cliente debe ejecutar un `diamondCut` con acción `Replace`.
*   **Revocación:** En caso de vulnerabilidad crítica descubierta post-despliegue, ISBE puede marcar la versión como "Deprecated" en el registro, alertando a los clientes (aunque no puede forzar la desinstalación en proxies ya desplegados sin permisos de administración en dichos proxies).

---

## 7) Implementación de Tareas (Roadmap)

Para operacionalizar este protocolo, se podría realizar las siguientes tareas de Hardhat en el repositorio.

### Tarea 1: `audit-facet`
Automatiza el checklist de seguridad estática antes del despliegue.

*   **Input:** Path al archivo del contrato (ej: `contracts/client/MyFacet.sol`).
*   **Acciones:**
    1.  Compilar el contrato.
    2.  **Check Storage:** Verificar que el slot de almacenamiento (`keccak256`) no colisiona con los namespaces reservados de ISBE.
    3.  **Check Introspection:** Instanciar el contrato en una red local (fork), llamar a `selectorsIntrospection()` y comparar con los selectores reales del bytecode.
    4.  **Check Dependencies:** Analizar el bytecode para detectar opcodes `DELEGATECALL` no seguros o enlaces a librerías externas no permitidas.
*   **Output:** Reporte de aprobación/rechazo.

### Tarea 2: `register-client-facet`
Abstrae la complejidad de desplegar y registrar en un solo comando, asegurando que el ID sea consistente.

*   **Input:** 
    *   `--source`: Path al archivo fuente.
    *   `--network`: Red de destino.
*   **Acciones:**
    1.  Compilar el contrato.
    2.  Extraer el `businessId` llamando a `businessIdIntrospection()` en local.
    3.  Verificar si ese ID ya existe en el `BusinessLogicFactory`.
    4.  Ejecutar `BusinessLogicFactory.deploy(businessId, bytecode)`.
*   **Nota:** Esta tarea reemplaza el uso manual de `deployBusinessLogic` para clientes, automatizando la extracción del ID y la validación de versiones.

### Tarea 3: `verify-facet-setup`
Herramienta de diagnóstico para post-despliegue.

*   **Input:** `--proxy <Address>` y `--custom-id <ID>`.
*   **Acciones:**
    1.  Resolver la dirección de la faceta en el Factory.
    2.  Verificar si esa dirección está presente en el Diamond del proxy (`facetAddress(selector)`).
    3.  Confirmar que los selectores registrados coinciden con la versión esperada.
