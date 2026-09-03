import { Global, Module } from '@nestjs/common';
import { EVENT_PUBLISHER_PORT } from './domain/ports/event-publisher.port';
import { InProcessEventPublisher } from './infrastructure/messaging/in-process-event-publisher';

/**
 * Cross-cutting infrastructure shared by every bounded-context module in the
 * monolith (today: the in-process event publisher). Marked @Global so any
 * module can inject EVENT_PUBLISHER_PORT without importing this module
 * explicitly — mirrors how a shared "platform" library would be consumed
 * once contexts become separate services.
 */
@Global()
@Module({
  providers: [{ provide: EVENT_PUBLISHER_PORT, useClass: InProcessEventPublisher }],
  exports: [EVENT_PUBLISHER_PORT],
})
export class SharedModule {}
