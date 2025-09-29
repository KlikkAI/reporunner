import { injectable } from 'inversify';

/**
 * Unified Service Base Class
 * Eliminates service pattern duplication across domains
 */

@injectable()
export abstract class UnifiedServiceBase<T, K = string> {
  protected serviceName: string;
  protected repository: any;

  constructor(serviceName: string, repository: any) {
    this.serviceName = serviceName;
    this.repository = repository;
  }

  async create(data: Partial<T>): Promise<T> {
    const enrichedData = this.enrichData(data);
    return this.repository.create(enrichedData);
  }

  async findById(id: K): Promise<T | null> {
    return this.repository.findById(id);
  }

  async findAll(filters?: Partial<T>): Promise<T[]> {
    return this.repository.find(filters || {});
  }

  async update(id: K, data: Partial<T>): Promise<T | null> {
    const enrichedData = this.enrichData(data, true);
    return this.repository.update(id, enrichedData);
  }

  async delete(id: K): Promise<boolean> {
    return this.repository.delete(id);
  }

  protected enrichData(data: Partial<T>, isUpdate = false): Partial<T> {
    const timestamp = new Date();

    return {
      ...data,
      ...(isUpdate ? { updatedAt: timestamp } : { createdAt: timestamp }),
      service: this.serviceName
    };
  }

  abstract validateData(data: Partial<T>): Promise<boolean>;
  abstract transformData(data: Partial<T>): Promise<Partial<T>>;
}

export abstract class UnifiedControllerBase<T, K = string> {
  protected service: UnifiedServiceBase<T, K>;

  constructor(service: UnifiedServiceBase<T, K>) {
    this.service = service;
  }

  async handleCreate(req: any, res: any): Promise<void> {
    try {
      const data = await this.service.transformData(req.body);
      const isValid = await this.service.validateData(data);

      if (!isValid) {
        res.status(400).json({ error: 'Invalid data' });
        return;
      }

      const result = await this.service.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  async handleGetById(req: any, res: any): Promise<void> {
    try {
      const result = await this.service.findById(req.params.id);
      if (!result) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  async handleUpdate(req: any, res: any): Promise<void> {
    try {
      const data = await this.service.transformData(req.body);
      const result = await this.service.update(req.params.id, data);
      if (!result) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  async handleDelete(req: any, res: any): Promise<void> {
    try {
      const result = await this.service.delete(req.params.id);
      if (!result) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}
