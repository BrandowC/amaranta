import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ORDER_REPOSITORY_PORT, OrderRepositoryPort } from '../domain/ports/out/order-repository.port';
import { MarkOrderAsPaidCommand, MarkOrderAsPaidUseCasePort } from '../domain/ports/in/mark-order-as-paid.port';
import { CheckoutResult } from '../domain/ports/in/checkout.port';
import { toCheckoutResult } from './order.presenter';

@Injectable()
export class MarkOrderAsPaidUseCase implements MarkOrderAsPaidUseCasePort {
  constructor(@Inject(ORDER_REPOSITORY_PORT) private readonly orderRepository: OrderRepositoryPort) {}

  async execute(command: MarkOrderAsPaidCommand): Promise<CheckoutResult> {
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) throw new NotFoundException(`Order "${command.orderId}" was not found`);

    order.markAsPaid();
    await this.orderRepository.save(order);

    return toCheckoutResult(order);
  }
}
