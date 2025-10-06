# DOC-003 · Comparativa técnica y normativa · OnchainID vs DID

1. Resumen ejecutivo
   1.1 Objetivo y alcance  
   1.2 Conclusiones rápidas (bullets)  
   1.3 Limitaciones y supuestos del análisis

2. Metodología de comparación
   2.1 Modelos comparados (A: OnchainID · ERC-725/734/735; B: DID Core; C: DID + VC)  
   2.2 Criterios de evaluación (trazabilidad, privacidad, cumplimiento, interoperabilidad, recuperación, gobernanza, compatibilidad con smart contracts, etc.)  
   2.3 Escala y ponderación (cómo se puntúa cada criterio)

3. Alineación de capas (marco conceptual)
   3.1 Identidad y claves  
   3.2 Afirmaciones/atributos  
   3.3 Notas sobre on-chain vs off-chain

4. Comparativa técnica por criterio
   4.1 Identificador y gestión de claves (A ↔ B)  
   4.2 Atributos/verificaciones: claims vs VCs (A ↔ C)  
   4.3 Revocación y estado (on-chain vs status lists/registries)  
   4.4 Trazabilidad y eventos (auditoría, evidencias)  
   4.5 Privacidad (minimización, correlación, exposición de PII)  
   4.6 Cumplimiento normativo (KYC/AML, GDPR, eIDAS – visión comparada)  
   4.7 Interoperabilidad (ecosistema EVM vs W3C/métodos DID)  
   4.8 Recuperación y continuidad (rotación de claves, pérdida/compromiso)  
   4.9 Gobernanza y marcos de confianza (issuers, registries, trust frameworks)  
   4.10 Compatibilidad con smart contracts (lecturas deterministas, gas, integraciones)

5. Matriz comparativa consolidada
   5.1 Tabla A/B/C por criterio (puntuación + pros/cons)  
   5.2 Sensibilidad a ponderaciones (qué cambia si priorizamos privacidad vs trazabilidad)

6. Recomendación preliminar para ISBE
   6.1 Escenarios de uso (solo on-chain, híbrido, W3C-first)  
   6.2 Elección sugerida por escenario (con justificación)  
   6.3 Roadmap de adopción (pasos graduales)

7. Riesgos y mitigaciones
   7.1 Riesgos técnicos/operativos por modelo  
   7.2 Controles y salvaguardas recomendadas

8. Implicaciones para la integración (puente a DOC-004)
   8.1 Requisitos para `IdentityRegistry`/lecturas deterministas  
   8.2 Opciones de puente: espejo de claims, attestation registry, adapter  
   8.3 Consideraciones de mantenimiento y auditoría

9. Glosario

10. Referencias técnicas y normativas

11. Anexos
   11.1 Plantillas de matriz de puntuación (editable)  
   11.2 Ejemplos de políticas de confianza (issuer allowlist / status sources)
