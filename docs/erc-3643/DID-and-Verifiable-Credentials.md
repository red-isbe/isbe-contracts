# DOC-002 · DID (W3C) + Verifiable Credentials

1. Resumen ejecutivo  
   1.1 Objetivo y alcance  
   1.2 Qué aporta (5 bullets)  
   1.3 Qué NO cubre  

2. Fundamentos y estándares base  
   2.1 W3C DID Core — DID, DID URL, DID Document  
   2.2 DID Resolution — resolvers y drivers por método  
   2.3 W3C Verifiable Credentials — modelo y pruebas  
   2.4 Relaciones en el DID Document (authentication, assertionMethod…)  

3. Arquitectura lógica  
   3.1 Componentes (DID Document, Verification Methods, Controllers, Services, Resolver)  
   3.2 Fronteras de confianza y flujo de datos  
   3.3 Diagrama de alto nivel (placeholder)  

4. Modelo de datos  
   4.1 Verification Methods: tipo de clave, codificación, estados  
   4.2 VCs: `issuer`, `credentialSubject`, `proof`, `status/expiration`  
   4.3 Mecanismos de estatus/revocación (status lists/registries)  

5. Operaciones y flujos  
   5.1 Creación/rotación de métodos de verificación  
   5.2 Autenticación (challenge–response con DID)  
   5.3 Emisión/presentación/verificación de VCs  
   5.4 Actualización de estatus/expiración de VCs  

6. Roles y gobernanza  
   6.1 Issuers (políticas de firma y revocación)  
   6.2 Holders (control de claves, wallets)  
   6.3 Verifiers (políticas de aceptación)  
   6.4 Gobernanza de métodos DID / trust frameworks  

7. Privacidad y cumplimiento  
   7.1 Minimización y pairwise DIDs  
   7.2 Divulgación selectiva y gestión de estatus sin PII  
   7.3 Consideraciones regulatorias (KYC/AML, GDPR, eIDAS – alto nivel)  

8. Seguridad y riesgos  
   8.1 Amenazas (compromiso de claves, correlación, dependencias del método)  
   8.2 Controles (rotación, status lists, buenas prácticas operativas)  

9. Interoperabilidad y compatibilidad  
   9.1 Métodos DID (web/key/ethr/ion…): pros/cons y portabilidad  
   9.2 Compatibilidad con wallets/libs del ecosistema W3C  
   9.3 Anclajes opcionales on-chain (visión general)  

10. Eventos y trazabilidad  
    10.1 Orígenes de eventos (off-chain/on-chain según método)  
    10.2 Auditoría y registro de verificaciones  

11. Glosario  

12. Referencias técnicas  
