import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';

export enum IncidentStatus {
    OPEN = 'OPEN',
    INVESTIGATING = 'INVESTIGATING',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED'
}

@Entity()
export class RCA {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'timestamp' })
    startTime!: Date;

    @Column({ type: 'timestamp' })
    endTime!: Date;

    @Column()
    category!: string;

    @Column('text')
    fixApplied!: string;

    @Column('text')
    preventionSteps!: string;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity()
export class WorkItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    componentId!: string;

    @Column({
        type: 'enum',
        enum: IncidentStatus,
        default: IncidentStatus.OPEN
    })
    status!: IncidentStatus;

    @Column()
    severity!: string; // P0, P1, P2

    @Column({ type: 'float', nullable: true })
    mttr!: number; // Mean Time To Repair in minutes

    @OneToOne(() => RCA, { nullable: true, cascade: true })
    @JoinColumn()
    rca!: RCA;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
