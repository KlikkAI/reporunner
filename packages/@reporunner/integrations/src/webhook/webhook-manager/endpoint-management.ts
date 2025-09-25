return id;
}

  /**
   * Setup webhook route
   */
  private setupWebhookRoute(registration: WebhookRegistration): void
{
  this.router.post(registration.config.path, async (req: Request, res: Response) => {
    try {
      // Create webhook event
      const event: WebhookEvent = {
        id: this.generateEventId(),
        webhookId: registration.id,
        headers: req.headers as Record<string, string>,
        body: req.body,
        query: req.query as Record<string, string>,
        timestamp: new Date(),
        verified: false,
        processed: false,
      };

      // Verify signature if required
      if (registration.config.validateSignature && registration.config.secret) {
        const signature = req.headers[
          registration.config.signatureHeader || 'x-signature'
        ] as string;
        event.signature = signature;
        event.verified = this.verifySignature(
          (req as any).rawBody,
          signature,
          registration.config.secret,
          registration.config.signatureAlgorithm
        );

        if (!event.verified) {
          this.emit('webhook:verification_failed', {
            webhookId: registration.id,
            event,
          });
          return res.status(401).json({ error: 'Invalid signature' });
        }
      } else {
        event.verified = true;
      }

      // Update registration stats
      registration.lastTriggered = new Date();
      registration.triggerCount++;

      // Add to queue for processing
      this.queueEvent(event);

      // Send immediate response
      res.status(200).json({ received: true, eventId: event.id });

      this.emit('webhook:received', { webhookId: registration.id, event });
    } catch (error: any) {
      registration.status = 'error';
      registration.error = error.message;

      this.emit('webhook:error', { webhookId: registration.id, error });

      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

/**
 * Verify webhook signature
 */
private
verifySignature(
    payload: Buffer,
    signature: string,
    secret: string,
    algorithm: 'sha1' | 'sha256' | 'sha512' = 'sha256'
  )
: boolean
{
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto.createHmac(algorithm, secret).update(payload).digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Queue event for processing
 */
private
queueEvent(event: WebhookEvent)
: void
{
  if (this.eventQueue.length >= this.maxQueueSize) {
    // Remove oldest event if queue is full
    const removed = this.eventQueue.shift();
    this.emit('webhook:queue_overflow', { removedEvent: removed });
  }

  this.eventQueue.push(event);
}

/**
