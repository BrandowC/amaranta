import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentScheduledEvent } from '../../domain/events/appointment-scheduled.event';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';

/**
 * Stand-in for `notification-service` (see 02-domain/domain-events.md) — same simulated-log
 * pattern as sales/infrastructure/messaging/order-created.listener.ts.
 */
@Injectable()
export class AppointmentNotificationListener {
  private readonly logger = new Logger('notification-service (simulated)');

  @OnEvent('AppointmentScheduled')
  handleScheduled(event: AppointmentScheduledEvent): void {
    this.logger.log(
      `📧 Confirmation email sent for appointment ${event.aggregateId} — ${event.payload.serviceType} at ${event.payload.scheduledAt}`,
    );
  }

  @OnEvent('AppointmentCancelled')
  handleCancelled(event: AppointmentCancelledEvent): void {
    this.logger.log(`📧 Cancellation email sent for appointment ${event.aggregateId}`);
  }
}
