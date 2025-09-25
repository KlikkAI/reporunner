import { generateId } from '../../shared/utils/generateId';
import { SessionFullError } from '../errors/SessionErrors';
import type { SessionConfig } from '../value-objects/SessionConfig.vo';
import type { Participant } from './Participant.entity';

/**
 * Session entity representing a collaboration session
 * Contains business logic for managing participants and session state
 */
export class Session {
  private readonly _id: string;
  private _workflowId: string;
  private _participants: Participant[] = [];
  private _config: SessionConfig;
  private _version = 0;
  private _isActive = true;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id?: string;
    workflowId: string;
    config: SessionConfig;
    participants?: Participant[];
    version?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id ?? generateId('session');
    this._workflowId = props.workflowId;
    this._config = props.config;
    this._participants = props.participants ?? [];
    this._version = props.version ?? 0;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get workflowId(): string {
    return this._workflowId;
  }

  get participants(): readonly Participant[] {
    return [...this._participants];
  }

  get config(): SessionConfig {
    return this._config;
  }

  get version(): number {
    return this._version;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get participantCount(): number {
    return this._participants.length;
  }

  // Business methods
  addParticipant(participant: Participant): void {
    if (this.isFull()) {
      throw new SessionFullError(this._config.maxParticipants);
    }

    const existing = this._participants.find((p) => p.userId === participant.userId);
    if (existing) {
      this.updateParticipant(participant);
      return;
    }

    this._participants.push(participant);
    this.incrementVersion();
  }

  removeParticipant(socketId: string): void {
    this._participants = this._participants.filter((p) => p.socketId !== socketId);
    this.incrementVersion();
  }

  updateParticipant(participant: Participant): void {
    const index = this._participants.findIndex((p) => p.userId === participant.userId);
    if (index >= 0) {
      this._participants[index] = participant;
      this.incrementVersion();
    }
  }

  endSession(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  private isFull(): boolean {
    return this._participants.length >= this._config.maxParticipants;
  }

  private incrementVersion(): void {
    this._version++;
    this._updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      workflowId: this._workflowId,
      participants: this._participants.map((p) => p.toJSON()),
      config: this._config.toJSON(),
      version: this._version,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static create(props: {
    workflowId: string;
    config: SessionConfig;
    creator: Participant;
  }): Session {
    const session = new Session({
      workflowId: props.workflowId,
      config: props.config,
    });

    session.addParticipant(props.creator);
    return session;
  }
}
