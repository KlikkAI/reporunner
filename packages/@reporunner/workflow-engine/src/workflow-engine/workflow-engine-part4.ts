this.emit('worker:started', { workerId });
})

this.workerManager.on('worker:stopped', (workerId: string) =>
{
  this.emit('worker:stopped', { workerId });
}
)
}

  /**
   * Emit workflow event
   */
  private async emitWorkflowEvent(
    event: WorkflowEvent,
    data: Partial<WorkflowEventData>
  ): Promise<void>
{
  const eventData: WorkflowEventData = {
    event,
    timestamp: new Date(),
    ...data,
  } as WorkflowEventData;

  this.eventBus.emit('workflow:event', eventData);
  this.emit('workflow:event', eventData);
}
}
