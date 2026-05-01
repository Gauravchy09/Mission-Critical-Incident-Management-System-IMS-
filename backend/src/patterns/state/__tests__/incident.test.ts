import { describe, expect, test, beforeEach } from '@jest/globals';
import { IncidentContext, ResolvedState } from "../incident";
import { IncidentStatus, WorkItem, RCA } from "../../../models/entities";

describe("Incident State Pattern & RCA Validation", () => {
    let workItem: WorkItem;

    beforeEach(() => {
        workItem = new WorkItem();
        workItem.id = "test-id";
        workItem.status = IncidentStatus.OPEN;
        workItem.createdAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    });

    test("should transition from OPEN to INVESTIGATING", () => {
        const context = new IncidentContext(IncidentStatus.OPEN);
        context.transition(workItem);
        expect(workItem.status).toBe(IncidentStatus.INVESTIGATING);
    });

    test("should transition from INVESTIGATING to RESOLVED", () => {
        const context = new IncidentContext(IncidentStatus.INVESTIGATING);
        context.transition(workItem);
        expect(workItem.status).toBe(IncidentStatus.RESOLVED);
    });

    test("should throw error when transitioning from RESOLVED to CLOSED without RCA", () => {
        const context = new IncidentContext(IncidentStatus.RESOLVED);
        expect(() => context.transition(workItem)).toThrow("RCA is mandatory before closing the incident.");
    });

    test("should transition to CLOSED and calculate MTTR when RCA is present", () => {
        const context = new IncidentContext(IncidentStatus.RESOLVED);
        
        const rca = new RCA();
        rca.endTime = new Date(); // Now
        workItem.rca = rca;

        context.transition(workItem);
        
        expect(workItem.status).toBe(IncidentStatus.CLOSED);
        expect(workItem.mttr).toBeDefined();
        expect(workItem.mttr).toBe(60); // 1 hour = 60 minutes
    });

    test("should throw error when transitioning from CLOSED", () => {
        const context = new IncidentContext(IncidentStatus.CLOSED);
        expect(() => context.transition(workItem)).toThrow("Incident is already closed.");
    });
});
