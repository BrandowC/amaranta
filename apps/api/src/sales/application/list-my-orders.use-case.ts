import { Inject, Injectable } from '@nestjs/common';
import { ListMyOrdersQuery, ListMyOrdersUseCasePort, OrderSummary } from '../domain/ports/in/list-my-orders.port';
import { ORDER_REPOSITORY_PORT, OrderRepositoryPort } from '../domain/ports/out/order-repository.port';
import { toCheckoutResult } from './order.presenter';

@Injectable()
export class ListMyOrdersUseCase implements ListMyOrdersUseCasePort {
  constructor(@Inject(ORDER_REPOSITORY_PORT) private readonly orderRepository: OrderRepositoryPort) {}

  async execute(query: ListMyOrdersQuery): Promise<OrderSummary[]> {
    const orders = await this.orderRepository.findByCustomer(query.customerId);
    return orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((order) => toCheckoutResult(order));
  }
}
