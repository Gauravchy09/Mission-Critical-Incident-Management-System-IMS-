# Development Log: Incident Management System (IMS)

This document satisfies the requirement for "Prompts/Spec/Plans" by documenting the system design and build process.

## 1. Requirement Analysis & Planning
The goal was to build a resilient, high-throughput system. I identified the following critical components:
- **Ingestion**: Must handle 10k signals/sec. Chose **Redis Streams** for backpressure.
- **Processing**: Needs to be async and handle debouncing. Implemented a Background Worker with a 10s debounce window.
- **Storage**: Correct separation of data. Chose **PostgreSQL** for transactional items, **MongoDB** for high-volume logs, and **Redis** for the hot-path dashboard.
- **Architecture**: Applied **Strategy Pattern** for alerting and **State Pattern** for workflow management.

## 2. Technical Decisions
- **Framework**: Fastify for the API due to its low overhead and built-in support for schema-based validation.
- **Resilience**: Added a `withRetry` utility with exponential backoff for database writes to prevent data loss during transient failures.
- **UI**: React with Glassmorphism CSS for a premium "Mission Control" feel.

## 3. Build Strategy (Prompt Engineering)
The system was built in phases to ensure each layer was robust:
- **Phase 1**: Ingestion API & Redis Stream setup.
- **Phase 2**: Background Worker with MongoDB audit log and debouncing.
- **Phase 3**: Workflow Engine (State/Strategy patterns) with PostgreSQL.
- **Phase 4**: Frontend integration and polishing.

## 4. Key Design Patterns
- **Strategy Pattern**: Decouples the logic of "how to alert" from the worker. Adding a new alert type (e.g., Slack or PagerDuty) only requires a new strategy implementation.
- **State Pattern**: Enforces the incident lifecycle. Crucially, it makes the code "Closed for modification, open for extension" regarding new states or transition rules (like the mandatory RCA check).

## 5. Verification
- **Unit Tests**: Built for the State Pattern to ensure RCA validation and MTTR calculations are accurate.
- **Simulations**: Used `mock-signals.js` to simulate high-load scenarios and verify backpressure handling.
