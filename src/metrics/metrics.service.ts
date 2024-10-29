// src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  async increment(metric: string): Promise<void> {
    // Logic to increment the metric, e.g., store in a database or external service
    console.log(`Metric incremented: ${metric}`);
  }

  async decrement(metric: string): Promise<void> {
    // Logic to decrement the metric
    console.log(`Metric decremented: ${metric}`);
  }
}
