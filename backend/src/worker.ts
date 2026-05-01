import redis, { STREAM_NAME } from './utils/redis';
import { initDBs, AppDataSource } from './utils/db';
import Signal from './models/signal.mongo';
import { WorkItem, IncidentStatus } from './models/entities';
import { AlertContext, DatabaseAlertingStrategy, CacheAlertingStrategy, DefaultAlertingStrategy } from './patterns/strategy/alerting';
import { withRetry } from './utils/resilience';

async function processStream() {
    console.log("Worker started...");
    await initDBs();
    const workItemRepo = AppDataSource.getRepository(WorkItem);

    while (true) {
        try {
            // Read from stream
            const results = await redis.xread('BLOCK', 0, 'STREAMS', STREAM_NAME, '$');
            if (!results) continue;

            for (const [stream, messages] of results) {
                for (const [id, fields] of messages) {
                    const signalData = JSON.parse(fields[1]);
                    const { componentId, type, payload } = signalData;

                    // 1. Always save to Data Lake (MongoDB)
                    const signal = new Signal({ componentId, type, payload });
                    
                    // 2. Debouncing Logic
                    const debounceKey = `debounce:${componentId}`;
                    let workItemId = await redis.get(debounceKey);

                    if (!workItemId) {
                        // Create New Work Item
                        console.log(`[WORKER] New Incident for ${componentId}`);
                        
                        // Select Strategy
                        let strategy;
                        if (componentId.includes('DB')) strategy = new DatabaseAlertingStrategy();
                        else if (componentId.includes('CACHE')) strategy = new CacheAlertingStrategy();
                        else strategy = new DefaultAlertingStrategy();

                        const alertContext = new AlertContext(strategy);
                        const severity = await alertContext.execute(componentId, type);

                        const workItem = new WorkItem();
                        workItem.componentId = componentId;
                        workItem.severity = severity;
                        workItem.status = IncidentStatus.OPEN;
                        
                        const savedWorkItem = await withRetry(() => workItemRepo.save(workItem));
                        workItemId = savedWorkItem.id;

                        // Set Debounce Lock (10s window as per requirement)
                        await redis.set(debounceKey, workItemId, 'EX', 10);
                    }

                    signal.workItemId = workItemId;
                    await withRetry(() => signal.save());

                    // 3. Update Hot-Path (Redis Dashboard State)
                    const dashboardState = await workItemRepo.find({
                        order: { severity: 'ASC', createdAt: 'DESC' },
                        take: 20
                    });
                    await withRetry(() => redis.set('dashboard:incidents', JSON.stringify(dashboardState)));
                }
            }
        } catch (err) {

            console.error("Worker error:", err);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

processStream();
