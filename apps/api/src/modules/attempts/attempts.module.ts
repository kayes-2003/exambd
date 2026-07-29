import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { ShuffleService } from './services/shuffle.service';
import { ScoringService } from './services/scoring.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, ShuffleService, ScoringService],
  exports: [ScoringService],
})
export class AttemptsModule {}
