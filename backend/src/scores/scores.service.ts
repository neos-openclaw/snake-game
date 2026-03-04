import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './score.entity';
import { SubmitScoreDto } from './score.dto';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
  ) {}

  async submitScore(userId: number, submitScoreDto: SubmitScoreDto): Promise<{ message: string }> {
    const { score } = submitScoreDto;

    await this.scoreRepository.save({
      userId,
      score,
    });

    return { message: '分数提交成功' };
  }

  async getLeaderboard(): Promise<any[]> {
    const scores = await this.scoreRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.user', 'user')
      .select(['score.id', 'score.score', 'score.createdAt', 'user.username'])
      .orderBy('score.score', 'DESC')
      .limit(10)
      .getMany();

    return scores.map((score, index) => ({
      rank: index + 1,
      username: score.user.username,
      score: score.score,
      createdAt: score.createdAt,
    }));
  }

  async getMyScores(userId: number): Promise<Score[]> {
    return await this.scoreRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
