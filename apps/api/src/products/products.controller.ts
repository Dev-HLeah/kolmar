import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Get()
  findProducts() {
    return this.productsService.findProducts();
  }

  @Get(':id')
  findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }
}
