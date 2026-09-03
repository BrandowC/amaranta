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
