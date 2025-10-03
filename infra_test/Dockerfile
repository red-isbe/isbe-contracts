# Dockerfile
FROM hyperledger/besu:24.12.2 AS builder
WORKDIR /w
# Copia tu config de operador (la que mostraste)
COPY qbftConfigFile.json /w/qbftConfigFile.json

# Genera genesis.json en /w/out (fallará si hay errores en el JSON)
RUN mkdir -p /w/out && \
    besu operator generate-blockchain-config \
      --config-file=/w/qbftConfigFile.json \
      --to=/w/out \
      --genesis-file-name=genesis.json

# Imagen final minimal con el genesis embebido
FROM hyperledger/besu:24.12.2
WORKDIR /app
COPY --from=builder /w/out/genesis.json /app/genesis.json

# Arranque: datadir efímero, sin P2P, RPC abierto para inspección
# Nota: no fijamos clave; Besu generará una al vuelo que NO estará en el set de validadores,
# por lo que en QBFT no se sellarán bloques y la cadena se quedará en el génesis.
ENTRYPOINT ["/bin/sh","-lc"]
CMD ["exec besu \
  --data-path=/tmp/data \
  --genesis-file=/app/genesis.json \
  --p2p-enabled=false \
  --discovery-enabled=false \
  --rpc-http-enabled=true \
  --rpc-http-host=0.0.0.0 \
  --host-allowlist=* \
  --rpc-http-api=ETH,NET,WEB3,DEBUG,TRACE,ADMIN \
  --rpc-http-cors-origins=* \
  --min-gas-price=0 \
  --logging=INFO"]