import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Reel } from './reel.entity';

@Entity('reel_likes')
@Unique(['userId', 'reelId'])
export class LikeReel {
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
}
