import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/out/order-repository.port';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderMapper } from './order.mapper';

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repo: Repository<OrderOrmEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    const exists = await this.repo.exist({ where: { id: order.id } });
    if (exists) {
      // Items are write-once at checkout — no domain method ever mutates them afterwards —
      // so a re-save only needs to persist the mutable scalar columns (e.g. status from
      // markAsPaid()). Re-running the full cascade insert here would try to re-insert the
      // already-persisted items and collide with their unique constraints.
      await this.repo.update(order.id, { status: order.status });
      return;
    }
    await this.repo.save(OrderMapper.toPersistence(order));
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? OrderMapper.toDomain(row) : null;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    const rows = await this.repo.find({ where: { customerId } });
    return rows.map(OrderMapper.toDomain);
  }
}
