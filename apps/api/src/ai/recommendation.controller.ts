import { Body, Controller, Post } from '@nestjs/common';
import { CreateDraftTriesDto } from './dto/create-draft-tries.dto';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post('draft-tries')
  createDraftTries(@Body() dto: CreateDraftTriesDto) {
    return this.recommendationService.createDraftTries(dto);
  }
}
