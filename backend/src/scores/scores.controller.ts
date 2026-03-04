import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScoresService } from './scores.service';
import { SubmitScoreDto } from './score.dto';

@Controller('api/scores')
@UseGuards(AuthGuard('jwt'))
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  async submitScore(@Request() req, @Body() submitScoreDto: SubmitScoreDto) {
    return await this.scoresService.submitScore(req.user.id, submitScoreDto);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return await this.scoresService.getLeaderboard();
  }

  @Get('history')
  async getMyScores(@Request() req) {
    return await this.scoresService.getMyScores(req.user.id);
  }
}
