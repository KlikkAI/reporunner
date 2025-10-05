// PostgreSQL transaction management reusing patterns from core
export interface TransactionManager {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isInTransaction(): boolean;
}

export class PostgreSQLTransactionManager implements TransactionManager {
  private inTransaction = false;
  private client: any = null;

  constructor(client: any) {
    this.client = client;
  }

  async begin(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }

    await this.client.query('BEGIN');
    this.inTransaction = true;
  }

  async commit(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }

    await this.client.query('COMMIT');
    this.inTransaction = false;
  }

  async rollback(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }

    await this.client.query('ROLLBACK');
    this.inTransaction = false;
  }

  isInTransaction(): boolean {
    return this.inTransaction;
  }

  async executeInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.begin();

    try {
      const result = await operation();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
