import { CheckoutResult } from './checkout.port';

export interface MarkOrderAsPaidCommand {
  orderId: string;
}

export interface MarkOrderAsPaidUseCasePort {
  execute(command: MarkOrderAsPaidCommand): Promise<CheckoutResult>;
}
