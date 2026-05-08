import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  overlays: any[] | null;

  @Column({ type: 'text', nullable: true })
  filter: string | null;

  @Column({ type: 'text', nullable: true })
  audioUrl: string | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
