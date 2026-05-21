import { Body, Controller, Post } from '@nestjs/common';
import { RequireRoles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role';
import { CreateDraftTriesDto } from './dto/create-draft-tries.dto';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post('draft-tries')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createDraftTries(@Body() dto: CreateDraftTriesDto) {
    return this.recommendationService.createDraftTries(dto);
  }
}
