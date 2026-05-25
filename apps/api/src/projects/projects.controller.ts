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
import { CreateFormulaTryDto } from './dto/create-formula-try.dto';
import { CreateProductFromTryDto } from './dto/create-product-from-try.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateFormulaTryDto } from './dto/update-formula-try.dto';
import { UpdateProjectMetadataDto } from './dto/update-project-metadata.dto';
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

  @Get(':id')
  findProjectById(@Param('id') id: string) {
    return this.projectsService.findProjectById(id);
  }

  @Patch(':id/metadata')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  updateProjectMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateProjectMetadataDto,
  ) {
    return this.projectsService.updateProjectMetadata(id, dto);
  }

  @Post(':projectId/tries')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createFormulaTry(
    @Param('projectId') projectId: string,
    @Body() dto: CreateFormulaTryDto,
  ) {
    return this.projectsService.createFormulaTry(projectId, dto);
  }

  @Patch('tries/:tryId')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  updateFormulaTry(
    @Param('tryId') tryId: string,
    @Body() dto: UpdateFormulaTryDto,
  ) {
    return this.projectsService.updateFormulaTry(tryId, dto);
  }

  @Patch('tries/:tryId/star')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  toggleTryStar(@Param('tryId') tryId: string) {
    return this.projectsService.toggleTryStar(tryId);
  }

  @Post('tries/:tryId/product')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createProductFromTry(
    @Param('tryId') tryId: string,
    @Body() dto: CreateProductFromTryDto,
  ) {
    return this.projectsService.createProductFromTry(tryId, dto);
  }

  @Delete('tries/:tryId')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  deleteFormulaTry(@Param('tryId') tryId: string) {
    return this.projectsService.deleteFormulaTry(tryId);
  }
}
