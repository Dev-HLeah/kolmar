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
import { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductMetadataDto } from './dto/update-product-metadata.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Get()
  findProducts() {
    return this.productsService.findProducts();
  }

  @Get(':id/similar-formulas')
  findSimilarFormulas(@Param('id') id: string) {
    return this.productsService.findSimilarFormulas(id);
  }

  @Get(':id/formulation-guidance')
  findFormulationGuidance(@Param('id') id: string) {
    return this.productsService.findFormulationGuidance(id);
  }

  @Get(':id')
  findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Patch(':id')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  updateProductMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateProductMetadataDto,
  ) {
    return this.productsService.updateProductMetadata(id, dto);
  }

  @Delete(':id')
  @RequireRoles(UserRole.Admin, UserRole.Researcher)
  softDeleteProduct(@Param('id') id: string) {
    return this.productsService.softDeleteProduct(id);
  }
}
