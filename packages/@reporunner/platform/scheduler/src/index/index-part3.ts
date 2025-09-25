return this.executeWorkflow(schedule);
}

  getSchedule(id: string): ScheduleDefinition | undefined
{
  return this.schedules.get(id);
}

getSchedules(organizationId?: string)
: ScheduleDefinition[]
{
  const schedules = Array.from(this.schedules.values());

  if (organizationId) {
    return schedules.filter((s) => s.organizationId === organizationId);
  }

  return schedules;
}

getExecution(id: string)
: ScheduleExecution | undefined
{
  return this.executions.get(id);
}

getExecutions(scheduleId?: string)
: ScheduleExecution[]
{
  const executions = Array.from(this.executions.values());

  if (scheduleId) {
    return executions.filter((e) => e.scheduleId === scheduleId);
  }

  return executions;
}

private
async;
startSchedule(scheduleId: string)
: Promise<void>
{
  const schedule = this.schedules.get(scheduleId);
  if (!schedule || !schedule.enabled) return;

  // Clear existing interval if any
  await this.stopSchedule(scheduleId);

  switch (schedule.type) {
    case 'cron':
      this.startCronSchedule(schedule);
      break;
    case 'interval':
      this.startIntervalSchedule(schedule);
      break;
    case 'once':
      this.startOnceSchedule(schedule);
      break;
    // webhook schedules are triggered externally
  }
}

private
async;
stopSchedule(scheduleId: string)
: Promise<void>
{
  const interval = this.intervals.get(scheduleId);
  if (interval) {
    clearInterval(interval);
    this.intervals.delete(scheduleId);
  }
}

private
startCronSchedule(schedule: ScheduleDefinition)
: void
{
  if (!schedule.schedule.cron) return;

  // TODO: Use node-cron for proper cron scheduling
  // For now, simulate with a simple interval
  const interval = setInterval(async () => {
    if (this.shouldExecute(schedule)) {
      await this.executeWorkflow(schedule);
    }
  }, 60000); // Check every minute

  this.intervals.set(schedule.id, interval);
}

private
startIntervalSchedule(schedule: ScheduleDefinition)
: void
{
  if (!schedule.schedule.interval) return;

  const interval = setInterval(async () => {
    if (this.shouldExecute(schedule)) {
      await this.executeWorkflow(schedule);
    }
  }, schedule.schedule.interval);

  this.intervals.set(schedule.id, interval);
}

private
startOnceSchedule(schedule: ScheduleDefinition)
: void
{
    if (!schedule.schedule.runAt) return;

    const delay = schedule.schedule.runAt.getTime() - Date.now();

    if (delay > 0) {
      const timeout = setTimeout(async () => {
        if (this.shouldExecute(schedule)) {
          await this.executeWorkflow(schedule);
        }
      }, delay);

      this.intervals.set(schedule.id, timeout);
    }
