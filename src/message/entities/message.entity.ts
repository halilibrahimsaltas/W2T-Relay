import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column()
    sender: string;

    @Column()
    convertedContent: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    
}

