# amaranta-shop-catalog-api

Servicio nuevo de Catalog construido desde la especificación de comportamiento del
monolito, no como una copia literal de `apps/catalog`.

## Decisiones del corte

- Python 3.11 o superior.
- TDD con `unittest` para no acoplar las pruebas a una base local.
- MongoDB como persistencia de producción mediante un adaptador reemplazable.
- API HTTP versionada con `/v1/products`, `/v1/stock/reservations` y
  `/v1/stock/releases`.
- El repositorio actual `apps/catalog` queda como referencia funcional y no se
  conecta directamente con este servicio.

## Ejecutar las pruebas

Desde esta carpeta:

```powershell
python -m unittest discover -s tests -v
```

## Ejecutar el servicio

```powershell
python -m src.catalog_service
```

Variables opcionales:

- `CATALOG_HOST` (por defecto `127.0.0.1`)
- `CATALOG_PORT` (por defecto `8081`)
- `CATALOG_MONGO_URI` y `CATALOG_MONGO_DATABASE` para activar el adaptador MongoDB

Sin `CATALOG_MONGO_URI`, el proceso usa un repositorio en memoria únicamente para
desarrollo local. No se debe usar ese modo en QA o producción.

## Ejecutar el microservicio real con MongoDB

Desde la raíz del repositorio:

```powershell
docker compose -f docker-compose.distributed.yml up --build -d --wait catalog-mongo catalog-api
Invoke-RestMethod http://localhost:8082/health/live
Invoke-RestMethod http://localhost:8082/health/ready
Invoke-RestMethod http://localhost:8082/v1/products
```

Este perfil inicia el proceso Python como contenedor separado y le obliga a usar
MongoDB. La respuesta vacía de productos es correcta mientras no exista una carga
de datos aprobada; no se deben introducir fixtures ficticios en producción.
