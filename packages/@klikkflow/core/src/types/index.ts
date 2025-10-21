export interface Pagination {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export type Filter<T> = Partial<T> & {
  [key: string]: any;
};

export type Sort<T> = Partial<Record<keyof T, 1 | -1 | 'asc' | 'desc'>> & {
  [key: string]: 1 | -1 | 'asc' | 'desc';
};
