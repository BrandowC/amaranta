FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml README.md ./
COPY src ./src

RUN pip install --no-cache-dir ".[mongo]"

ENV CATALOG_HOST=0.0.0.0
ENV CATALOG_PORT=8081
ENV CATALOG_MONGO_DATABASE=catalog

EXPOSE 8081

CMD ["python", "-m", "src.catalog_service"]
