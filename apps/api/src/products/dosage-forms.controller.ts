import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dosage-forms')
export class DosageFormsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.dosageForm.findMany({ orderBy: { name: 'asc' } });
  }
}
