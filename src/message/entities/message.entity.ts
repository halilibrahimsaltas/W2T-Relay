import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ProductInfo } from './product-info.interface';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'simple-json', nullable: true })
    content: ProductInfo;

    @Column()
    sender: string;

    @Column({ type: 'simple-json', nullable: true })
    convertedContent: ProductInfo;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
