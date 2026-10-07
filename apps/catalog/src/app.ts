import 'reflect-metadata';
import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { CatalogConfig } from './config';
import { ListProducts } from './application/list-products';
import { CatalogController } from './infrastructure/catalog.controller';
import { createDatabase } from './infrastructure/database';
import { ProductRepository } from './infrastructure/product.repository';

export async function createApp(config: CatalogConfig, logging = true) {
  const db = await createDatabase(config).initialize();
  @Module({
    controllers: [CatalogController],
    providers: [
      { provide: DataSource, useValue: db },
      { provide: ListProducts, useValue: new ListProducts(new ProductRepository(db)) },
      { provide: 'DATABASE_LIFECYCLE', useValue: { onApplicationShutdown: () => db.destroy() } },
    ],
  })
  class CatalogModule {}

  try {
    const app = await NestFactory.create(CatalogModule, { logger: logging ? undefined : false });
    app.enableCors({ origin: config.corsOrigin, exposedHeaders: ['x-correlation-id'] });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    const logger = new Logger('catalog.http');
    app.use((req: Request, res: Response, next: NextFunction) => {
      const incoming = req.get('x-correlation-id');
      const correlationId =
        incoming && /^[a-zA-Z0-9._-]{1,100}$/.test(incoming) ? incoming : randomUUID();
      res.setHeader('x-correlation-id', correlationId);
      const start = Date.now();
      res.on('finish', () => {
        if (logging)
          logger.log(
            JSON.stringify({
              correlationId,
              method: req.method,
              path: req.path,
              status: res.statusCode,
              durationMs: Date.now() - start,
            }),
          );
      });
      next();
    });
    app.enableShutdownHooks();
    return app;
  } catch (error) {
    if (db.isInitialized) await db.destroy();
    throw error;
  }
}
