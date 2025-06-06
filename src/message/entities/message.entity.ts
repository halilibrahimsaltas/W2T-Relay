import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    price: string;

    @Column({ type: 'text', nullable: true })
    imageUrl: string;

    @Column({ type: 'text', nullable: true })
    pageUrl: string;

    @Column({ type: 'text', nullable: true })
    sender: string;

    @CreateDateColumn()
    createdAt: Date;
}

