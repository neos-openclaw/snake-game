import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('scores')
export class Score {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.scores)
  user: User;

  @Column()
  score: number;

  @CreateDateColumn()
  createdAt: Date;
}
