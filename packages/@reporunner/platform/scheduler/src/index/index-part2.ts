async;
createSchedule(
    schedule: Omit<ScheduleDefinition, 'id' | 'currentRuns' | 'createdAt' | 'updatedAt'>
  )
: Promise<string>
{
  const newSchedule: ScheduleDefinition = {
    ...schedule,
    id: this.generateId(),
    currentRuns: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Validate cron expression if provided
  if (newSchedule.type === 'cron' && newSchedule.schedule.cron) {
    try {
      // TODO: Use cron-parser to validate
      this.validateCronExpression(newSchedule.schedule.cron);
    } catch (_error) {
      throw new Error(`Invalid cron expression: ${newSchedule.schedule.cron}`);
    }
  }

  // Calculate next run time
  newSchedule.nextRun = this.calculateNextRun(newSchedule);

  this.schedules.set(newSchedule.id, newSchedule);

  // Start the schedule if enabled and scheduler is running
  if (newSchedule.enabled && this.running) {
    await this.startSchedule(newSchedule.id);
  }

  return newSchedule.id;
}

async;
updateSchedule(id: string, updates: Partial<ScheduleDefinition>)
: Promise<boolean>
{
  const schedule = this.schedules.get(id);
  if (!schedule) return false;

  // Stop current schedule
  await this.stopSchedule(id);

  // Update schedule
  const updatedSchedule = {
    ...schedule,
    ...updates,
    updatedAt: new Date(),
  };

  // Recalculate next run if schedule changed
  if (updates.schedule || updates.type) {
    updatedSchedule.nextRun = this.calculateNextRun(updatedSchedule);
  }

  this.schedules.set(id, updatedSchedule);

  // Restart if enabled
  if (updatedSchedule.enabled && this.running) {
    await this.startSchedule(id);
  }

  return true;
}

async;
deleteSchedule(id: string)
: Promise<boolean>
{
  await this.stopSchedule(id);
  return this.schedules.delete(id);
}

async;
enableSchedule(id: string)
: Promise<boolean>
{
  const schedule = this.schedules.get(id);
  if (!schedule) return false;

  schedule.enabled = true;
  schedule.updatedAt = new Date();

  if (this.running) {
    await this.startSchedule(id);
  }

  return true;
}

async;
disableSchedule(id: string)
: Promise<boolean>
{
  const schedule = this.schedules.get(id);
  if (!schedule) return false;

  schedule.enabled = false;
  schedule.updatedAt = new Date();
  await this.stopSchedule(id);

  return true;
}

async;
triggerSchedule(id: string)
: Promise<string>
{
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }
