import Fastify from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { pushToStream } from './utils/redis';
import redis from './utils/redis';
import { initDBs, AppDataSource } from './utils/db';
import { WorkItem, RCA } from './models/entities';
import Signal from './models/signal.mongo';
import { IncidentContext } from './patterns/state/incident';

const fastify = Fastify({ logger: true });

// Throughput metrics
let signalsReceived = 0;
setInterval(() => {
    console.log(`[METRICS] Throughput: ${signalsReceived / 5} signals/sec`);
    signalsReceived = 0;
}, 5000);

const start = async () => {
    try {
        await initDBs();
        
        await fastify.register(helmet, {
            contentSecurityPolicy: false, // Disable for easier local dev
        });

        await fastify.register(cors, {
            origin: true, // Allow all origins in dev
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        });

        await fastify.register(fastifyRateLimit, {
            max: 5000,
            timeWindow: '1 minute'
        });

        fastify.get('/health', async (request, reply) => {
            return { status: 'OK', uptime: process.uptime() };
        });

        fastify.post('/ingest', async (request, reply) => {
            const signal = request.body as any;
            if (!signal.componentId || !signal.type) {
                return reply.status(400).send({ error: 'Invalid signal format' });
            }
            
            signalsReceived++;
            await pushToStream(signal);
            return { status: 'ACCEPTED' };
        });

        // Dashboard API (Hot-Path)
        fastify.get('/incidents', async (request, reply) => {
            const cached = await redis.get('dashboard:incidents');
            if (cached) return JSON.parse(cached);
            
            const workItemRepo = AppDataSource.getRepository(WorkItem);
            return await workItemRepo.find({ order: { severity: 'ASC', createdAt: 'DESC' } });
        });

        // Incident Details
        fastify.get('/incidents/:id', async (request, reply) => {
            const { id } = request.params as any;
            const workItemRepo = AppDataSource.getRepository(WorkItem);
            const workItem = await workItemRepo.findOne({ where: { id }, relations: ['rca'] });
            
            if (!workItem) return reply.status(404).send({ error: 'Not found' });
            
            const signals = await Signal.find({ workItemId: id }).sort({ timestamp: -1 }).limit(100);
            return { workItem, signals };
        });

        // Status Transition (State Pattern)
        fastify.patch('/incidents/:id/status', async (request, reply) => {
            const { id } = request.params as any;
            console.log(`[DEBUG] Transition requested for incident: ${id}`);
            
            const workItemRepo = AppDataSource.getRepository(WorkItem);
            const workItem = await workItemRepo.findOne({ where: { id }, relations: ['rca'] });
            
            if (!workItem) return reply.status(404).send({ error: 'Not found' });
            
            const context = new IncidentContext(workItem.status);
            try {
                context.transition(workItem);
                await workItemRepo.save(workItem);
                return workItem;
            } catch (err: any) {
                return reply.status(400).send({ error: err.message });
            }
        });

        // Submit RCA
        fastify.post('/incidents/:id/rca', async (request, reply) => {
            const { id } = request.params as any;
            const rcaData = request.body as any;
            
            const workItemRepo = AppDataSource.getRepository(WorkItem);
            const workItem = await workItemRepo.findOne({ where: { id } });
            
            if (!workItem) return reply.status(404).send({ error: 'Not found' });
            
            const rca = new RCA();
            rca.startTime = new Date(rcaData.startTime);
            rca.endTime = new Date(rcaData.endTime);
            rca.category = rcaData.category;
            rca.fixApplied = rcaData.fixApplied;
            rca.preventionSteps = rcaData.preventionSteps;
            
            workItem.rca = rca;
            await workItemRepo.save(workItem);
            return workItem;
        });

        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Server listening on http://localhost:3001');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
