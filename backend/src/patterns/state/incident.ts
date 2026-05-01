import { IncidentStatus, WorkItem } from "../../models/entities";

export interface IncidentState {
    next(workItem: WorkItem): void;
    status: IncidentStatus;
}

export class OpenState implements IncidentState {
    status = IncidentStatus.OPEN;
    next(workItem: WorkItem) {
        workItem.status = IncidentStatus.INVESTIGATING;
    }
}

export class InvestigatingState implements IncidentState {
    status = IncidentStatus.INVESTIGATING;
    next(workItem: WorkItem) {
        workItem.status = IncidentStatus.RESOLVED;
    }
}

export class ResolvedState implements IncidentState {
    status = IncidentStatus.RESOLVED;
    next(workItem: WorkItem) {
        if (!workItem.rca) {
            throw new Error("RCA is mandatory before closing the incident.");
        }
        workItem.status = IncidentStatus.CLOSED;
        
        // Calculate MTTR
        const start = new Date(workItem.createdAt).getTime();
        const end = new Date(workItem.rca.endTime).getTime();
        workItem.mttr = Math.round((end - start) / (1000 * 60)); // MTTR in minutes
    }
}

export class ClosedState implements IncidentState {
    status = IncidentStatus.CLOSED;
    next(workItem: WorkItem) {
        throw new Error("Incident is already closed.");
    }
}

export class IncidentContext {
    private state: IncidentState;

    constructor(status: IncidentStatus) {
        this.state = this.getState(status);
    }

    private getState(status: IncidentStatus): IncidentState {
        switch (status) {
            case IncidentStatus.OPEN: return new OpenState();
            case IncidentStatus.INVESTIGATING: return new InvestigatingState();
            case IncidentStatus.RESOLVED: return new ResolvedState();
            case IncidentStatus.CLOSED: return new ClosedState();
            default: return new OpenState();
        }
    }

    transition(workItem: WorkItem) {
        this.state.next(workItem);
        this.state = this.getState(workItem.status);
    }
}
