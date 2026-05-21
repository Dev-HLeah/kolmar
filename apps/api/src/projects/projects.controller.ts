import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequireRoles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role';
import { CreateExperimentGroupDto } from './dto/create-experiment-group.dto';
import { CreateFormulaTryDto } from './dto/create-formula-try.dto';
import { CreateProductFromTryDto } from './dto/create-product-from-try.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { CreateTryMarkDto } from './dto/create-try-mark.dto';
import { UpdateFormulaTryDto } from './dto/update-formula-try.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get()
  findProjects() {
    return this.projectsService.findProjects();
  }

  @Get(':projectId/tries/marked')
  findMarkedTriesByProject(@Param('projectId') projectId: string) {
    return this.projectsService.findMarkedTriesByProject(projectId);
  }

  @Get(':id')
  findProjectById(@Param('id') id: string) {
    return this.projectsService.findProjectById(id);
  }

  @Post(':projectId/groups')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createExperimentGroup(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExperimentGroupDto,
  ) {
    return this.projectsService.createExperimentGroup(projectId, dto);
  }

  @Post('groups/:groupId/tries')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createFormulaTry(
    @Param('groupId') groupId: string,
    @Body() dto: CreateFormulaTryDto,
  ) {
    return this.projectsService.createFormulaTry(groupId, dto);
  }

  @Patch('tries/:tryId')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  updateFormulaTry(
    @Param('tryId') tryId: string,
    @Body() dto: UpdateFormulaTryDto,
  ) {
    return this.projectsService.updateFormulaTry(tryId, dto);
  }

  @Post('tries/:tryId/test-results')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createTryTestResult(
    @Param('tryId') tryId: string,
    @Body() dto: CreateTestResultDto,
  ) {
    return this.projectsService.createTryTestResult(tryId, dto);
  }

  @Post('tries/:tryId/marks')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createTryMark(@Param('tryId') tryId: string, @Body() dto: CreateTryMarkDto) {
    return this.projectsService.createTryMark(tryId, dto);
  }

  @Post('tries/:tryId/product')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createProductFromTry(
    @Param('tryId') tryId: string,
    @Body() dto: CreateProductFromTryDto,
  ) {
    return this.projectsService.createProductFromTry(tryId, dto);
  }

  @Delete('tries/:tryId/marks')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  deleteTryMarks(@Param('tryId') tryId: string) {
    return this.projectsService.deleteTryMarks(tryId);
  }

  @Delete('tries/:tryId')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  deleteFormulaTry(@Param('tryId') tryId: string) {
    return this.projectsService.deleteFormulaTry(tryId);
  }
}
