# Catalog Service — HU-CAT-001

Servicio NestJS independiente de consulta, con PostgreSQL propio, migración TypeORM
versionada y contrato [OpenAPI v1](contracts/openapi.json). No importa código de apps/api.
Mantiene la proyección pública de HU-CAT-001 (precio COP, activos y stock visible).
La paginación inválida devuelve 400; máximo 50 resultados por página.

## Alcance de esta entrega

Este bloque permite iniciar y verificar Catalog sin el monolito. Todavía no recibe
reservas ni administra productos. No se ha transferido el tráfico de la tienda:
checkout/administración siguen utilizando el catálogo heredado. Los dos catálogos
**no están sincronizados**. El nuevo se inicia vacío, sin datos ficticios en producción.
HU-CAT-002 deberá transferir UUID y escrituras, implementar reserva/release durable
y retirar el acceso heredado antes de conectar la tienda al nuevo stock.

## Docker (desde la raíz del repositorio)

```powershell
docker compose -f docker-compose.catalog.yml up --build -d --wait catalog
Invoke-RestMethod http://localhost:8081/health/live
Invoke-RestMethod http://localhost:8081/health/ready
Invoke-RestMethod http://localhost:8081/v1/products
```

Solo inicia Catalog y catalog-db; no requiere claves JWT, Identity ni Sales.
DB: localhost:55432/catalog_db; credenciales de **desarrollo** en Compose.
El volumen catalog_pgdata es independiente del volumen legacy amaranta_pgdata.
No utilizar `down -v` sobre datos que se quieran conservar.

El Compose raíz incorpora las mismas definiciones por `extends`; para el stack completo
continúan siendo necesarias las claves RS256 heredadas y liberar/configurar el puerto
legacy 5432. No se modificó la configuración del otro proyecto que lo utiliza.

## Local con DB Docker

```powershell
docker compose -f docker-compose.catalog.yml up -d --wait catalog-db
cd apps/catalog
npm ci
npm run build
node --env-file=.env.dev.example dist/main.js
```

Ejemplos `.env.dev.example`, `.env.qa.example`, `.env.prod.example` documentan APP_ENV,
PORT, DATABASE_URL y CORS_ORIGIN. El proceso no carga `.env` implícitamente: usar
`node --env-file` en Node 20 o inyectar variables desde el entorno. QA/prod rechazan
placeholders/clave de dev, DB heredada y falta de origen CORS.

Para Compose en qa/prod suministrar **todos**: CATALOG_APP_ENV,
CATALOG_DB_PASSWORD, CATALOG_DATABASE_URL (con la misma clave debidamente URL-encoded),
CATALOG_CORS_ORIGIN. Puertos configurables: CATALOG_PORT y CATALOG_DB_PORT.
Los ejemplos no son un despliegue productivo. En producción provisionar rol dedicado,
conexión TLS según proveedor y secretos externos. Nunca versionar claves reales.

## Persistencia

`CatalogProducts1791331200000` crea schema catalog y products, conservando columnas
y restricciones del catálogo original. TypeORM registra la migración en `migrations`;
`synchronize=false`. El segundo inicio no recrea tablas ni borra datos.
Para este bloque de una réplica, las migraciones corren al iniciar; antes de escalar
separar el job de migración para evitar carreras. Rollback destructivo está deshabilitado.
No se importan automáticamente tablas ni datos de amaranta.

## Verificación reproducible

```powershell
# En la raíz; base de tests efímera y separada, puerto 55433.
docker compose -f docker-compose.catalog.yml --profile test up -d --wait catalog-test-db
cd apps/catalog
npm ci
npm run format:check
npm run lint
npm run build
npm test
$env:CATALOG_TEST_DATABASE_URL = 'postgresql://catalog_test:catalog_test_password@localhost:55433/catalog_db'
npm run test:integration
```

La integración exige usuario catalog_test, crea fixtures con IDs únicos y elimina
solo esos IDs. Requiere la base de tests vacía aparte de su migración; nunca usar una
base compartida. Verifica HTTP real, filtrado/paginación, restricciones SQL, migración
repetible, aislamiento de schemas, contrato provider y readiness sin DB.
El contrato de Sales consumidor todavía no existe: esta suite no lo reemplaza.

## Fallo reproducible del bloque

Con Catalog ya iniciado:

```powershell
docker compose -f docker-compose.catalog.yml stop catalog-db
curl.exe -i http://localhost:8081/health/ready
curl.exe -i http://localhost:8081/health/live
docker compose -f docker-compose.catalog.yml start catalog-db
```

Se espera ready 503 con timeout de conexión acotado, live 200 y recuperación de ready
al volver PostgreSQL. Esto demuestra salud/dependencia, **no Saga ni compensación**.
Cada respuesta lleva x-correlation-id; los logs HTTP incluyen ID, ruta, estado y duración,
sin cuerpo ni credenciales.
