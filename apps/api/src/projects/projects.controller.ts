import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateExperimentGroupDto } from './dto/create-experiment-group.dto';
import { CreateFormulaTryDto } from './dto/create-formula-try.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
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

  @Post(':projectId/groups')
  createExperimentGroup(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExperimentGroupDto,
  ) {
    return this.projectsService.createExperimentGroup(projectId, dto);
  }

  @Post('groups/:groupId/tries')
  createFormulaTry(
    @Param('groupId') groupId: string,
    @Body() dto: CreateFormulaTryDto,
  ) {
    return this.projectsService.createFormulaTry(groupId, dto);
  }
}
