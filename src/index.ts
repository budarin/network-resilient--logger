type LogEntry = {
    timestamp: string;
    message: string;
};

class LoggerService {
    private cache: LogEntry[];
    private maxBatchSize: number;
    private retryIntervals: number[];
    private currentIntervalIndex: number;
    private attemptingToSend: boolean;
    private retryTimer: number | null;

    constructor(maxBatchSize: number, retryIntervals: number[] = [2000, 5000, 10000]) {
        this.cache = [];
        this.maxBatchSize = maxBatchSize;
        this.retryIntervals = retryIntervals;
        this.currentIntervalIndex = 0;
        this.attemptingToSend = false;
        this.retryTimer = null;

        globalThis.addEventListener('online', this.onNetworkOnline.bind(this));
        globalThis.addEventListener('offline', this.onNetworkOffline.bind(this));
    }

    public log(message: string): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            message: message,
        };

        this.cache.push(logEntry);
        this.handleLogs();
    }

    private handleLogs(): void {
        if (!this.attemptingToSend && navigator.onLine) {
            this.attemptToSendLogs();
        }
    }

    private attemptToSendLogs(): void {
        if (this.cache.length > 0) {
            this.attemptingToSend = true;
            const batch = this.cache.slice(0, this.maxBatchSize);

            this.sendLogs(batch)
                .then(() => {
                    this.cache.splice(0, batch.length);
                    this.currentIntervalIndex = 0;
                    this.attemptingToSend = false;
                    this.handleLogs();
                })
                .catch(() => {
                    this.attemptingToSend = false;
                    this.scheduleRetry();
                });
        }
    }

    private sendLogs(batch: LogEntry[]): Promise<void> {
        console.log('Sending logs:', batch);
        return Promise.resolve();
    }

    private scheduleRetry(): void {
        if (this.retryTimer !== null) {
            clearTimeout(this.retryTimer);
        }

        const interval = this.retryIntervals[this.currentIntervalIndex];

        this.retryTimer = globalThis.setTimeout(() => {
            this.handleLogs();
        }, interval);

        this.currentIntervalIndex = Math.min(this.currentIntervalIndex + 1, this.retryIntervals.length - 1);
    }

    private onNetworkOnline(): void {
        console.log('Network is back online. Attempting to send logs.');
        this.handleLogs();
    }

    private onNetworkOffline(): void {
        console.log('Network is offline. Pausing log sending.');

        if (this.retryTimer !== null) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }
}
