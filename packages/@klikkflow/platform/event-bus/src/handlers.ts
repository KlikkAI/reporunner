import type { Event, EventHandler } from './index';

export class WorkflowEventHandler implements EventHandler {
  async handle(_event: Event): Promise<void> {
    // TODO: Implement workflow event handling
  }
}

export class ExecutionEventHandler implements EventHandler {
  async handle(_event: Event): Promise<void> {
    // TODO: Implement execution event handling
  }
}

export class UserEventHandler implements EventHandler {
  async handle(_event: Event): Promise<void> {
    // TODO: Implement user event handling
  }
}

export class AuditEventHandler implements EventHandler {
  async handle(_event: Event): Promise<void> {
    // TODO: Implement audit event handling
  }
}
