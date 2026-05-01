const axios = require('axios');

const COMPONENTS = [
    { id: 'DB_CLUSTER_01', type: 'RDBMS' },
    { id: 'CACHE_NODE_A', type: 'CACHE' },
    { id: 'API_GATEWAY', type: 'API' },
    { id: 'QUEUE_WORKER_01', type: 'ASYNC_QUEUE' },
    { id: 'NOSQL_STORE_01', type: 'NOSQL' }
];

const SIGNAL_TYPES = ['ERROR', 'LATENCY_SPIKE', 'MEMORY_HIGH', 'DISK_FULL'];

async function sendSignal() {
    const component = COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];
    const type = SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)];
    
    try {
        await axios.post('http://localhost:3001/ingest', {
            componentId: component.id,
            type: type,
            payload: {
                message: `${type} detected on ${component.id}`,
                value: Math.random() * 100,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        // Silent error for throughput testing
    }
}

// Function to simulate high throughput
async function loadTest(durationSec, signalsPerSec) {
    console.log(`Starting load test: ${signalsPerSec} signals/sec for ${durationSec}s`);
    const interval = 1000 / signalsPerSec;
    const start = Date.now();
    
    const timer = setInterval(() => {
        if (Date.now() - start > durationSec * 1000) {
            clearInterval(timer);
            console.log("Load test complete.");
            return;
        }
        sendSignal();
    }, interval);
}

// Default run: Simulate a burst of signals for debouncing test
async function runDemo() {
    console.log("Simulating 100 signals for DB_CLUSTER_01 in 2 seconds...");
    for (let i = 0; i < 100; i++) {
        axios.post('http://localhost:3001/ingest', {
            componentId: 'DB_CLUSTER_01',
            type: 'ERROR',
            payload: { error: 'Connection Timeout' }
        }).catch(() => {});
    }
    console.log("Signals sent. Check dashboard for a single Work Item.");
}

if (process.argv[2] === '--load') {
    loadTest(60, 1000); // 1k signals/sec for 60s
} else {
    runDemo();
}
