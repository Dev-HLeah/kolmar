import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DosageFormsController } from './dosage-forms.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, DosageFormsController],
  providers: [ProductsService],
})
export class ProductsModule {}
