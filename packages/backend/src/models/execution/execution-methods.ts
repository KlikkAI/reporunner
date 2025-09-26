successfulExecutions: 0, failedExecutions;
: 0,
      averageDuration: 0,
    }
  )
}

export const Execution = mongoose.model<IExecution>('Execution', executionSchema);
