// PostgreSQL query operations reusing patterns from core repository methods
import type { QueryOptions } from '../../types/query-types';

export interface QueryBuilder {
  select(fields?: string[]): QueryBuilder;
  where(conditions: Record<string, any>): QueryBuilder;
  orderBy(field: string, direction?: 'ASC' | 'DESC'): QueryBuilder;
  limit(count: number): QueryBuilder;
  offset(count: number): QueryBuilder;
  build(): { sql: string; params: any[] };
}

export class PostgreSQLQueryBuilder implements QueryBuilder {
  private selectFields: string[] = ['*'];
  private whereConditions: Record<string, any> = {};
  private orderByClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';

  select(fields?: string[]): QueryBuilder {
    if (fields && fields.length > 0) {
      this.selectFields = fields;
    }
    return this;
  }

  where(conditions: Record<string, any>): QueryBuilder {
    this.whereConditions = { ...this.whereConditions, ...conditions };
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByClause = `ORDER BY ${field} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  build(): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = `SELECT ${this.selectFields.join(', ')} FROM `;

    // Add WHERE clause
    const whereKeys = Object.keys(this.whereConditions);
    if (whereKeys.length > 0) {
      const whereClauses = whereKeys.map((key, index) => {
        params.push(this.whereConditions[key]);
        return `${key} = $${index + 1}`;
      });
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Add other clauses
    if (this.orderByClause) sql += ` ${this.orderByClause}`;
    if (this.limitClause) sql += ` ${this.limitClause}`;
    if (this.offsetClause) sql += ` ${this.offsetClause}`;

    return { sql, params };
  }
}

export class PostgreSQLQueryOperations {
  static buildSelectQuery(
    table: string,
    options?: QueryOptions
  ): { sql: string; params: any[] } {
    const builder = new PostgreSQLQueryBuilder();

    if (options?.filter) {
      builder.where(options.filter);
    }

    if (options?.limit) {
      builder.limit(options.limit);
    }

    if (options?.offset) {
      builder.offset(options.offset);
    }

    const query = builder.build();
    return {
      sql: `SELECT * FROM ${table}${query.sql.replace('SELECT * FROM ', '')}`,
      params: query.params
    };
  }

  static buildInsertQuery(
    table: string,
    data: Record<string, any>
  ): { sql: string; params: any[] } {
    const keys = Object.keys(data);
    const params = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

    return {
      sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      params
    };
  }

  static buildUpdateQuery(
    table: string,
    id: string,
    data: Record<string, any>
  ): { sql: string; params: any[] } {
    const keys = Object.keys(data);
    const params = Object.values(data);
    const setClauses = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    params.push(id);

    return {
      sql: `UPDATE ${table} SET ${setClauses} WHERE id = $${params.length} RETURNING *`,
      params
    };
  }

  static buildDeleteQuery(table: string, id: string): { sql: string; params: any[] } {
    return {
      sql: `DELETE FROM ${table} WHERE id = $1`,
      params: [id]
    };
  }
}