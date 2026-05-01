export interface AlertingStrategy {
    getSeverity(componentType: string): string;
    sendAlert(componentId: string, severity: string): Promise<void>;
}

export class DatabaseAlertingStrategy implements AlertingStrategy {
    getSeverity(componentType: string): string {
        return 'P0'; // Critical for RDBMS
    }
    async sendAlert(componentId: string, severity: string): Promise<void> {
        console.log(`[ALERT] ${severity}: Database failure on ${componentId}. Paging on-call.`);
    }
}

export class CacheAlertingStrategy implements AlertingStrategy {
    getSeverity(componentType: string): string {
        return 'P2'; // Less critical for Cache
    }
    async sendAlert(componentId: string, severity: string): Promise<void> {
        console.log(`[ALERT] ${severity}: Cache latency spike on ${componentId}. Warning notification sent.`);
    }
}

export class DefaultAlertingStrategy implements AlertingStrategy {
    getSeverity(componentType: string): string {
        return 'P1';
    }
    async sendAlert(componentId: string, severity: string): Promise<void> {
        console.log(`[ALERT] ${severity}: Issue detected on ${componentId}.`);
    }
}

export class AlertContext {
    private strategy: AlertingStrategy;

    constructor(strategy: AlertingStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: AlertingStrategy) {
        this.strategy = strategy;
    }

    async execute(componentId: string, componentType: string) {
        const severity = this.strategy.getSeverity(componentType);
        await this.strategy.sendAlert(componentId, severity);
        return severity;
    }
}
