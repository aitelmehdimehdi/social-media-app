import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Reel } from './reel.entity';

@Entity('saved_reels')
@Unique(['userId', 'reelId'])
export class SavedReel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Reel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reelId' })
  reel: Reel;

  @Column()
  reelId: string;

  @CreateDateColumn()
  createdAt: Date;
}
