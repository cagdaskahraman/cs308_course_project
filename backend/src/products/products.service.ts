import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.type';
import { productsSeed, validateProductsSeed } from './products.seed';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = productsSeed;

  constructor() {
    validateProductsSeed(this.products);
  }

  findAll(options?: {
    search?: string;
    category?: string;
    sortBy?: 'price' | 'popularity';
    sortOrder?: 'asc' | 'desc';
  }): Product[] {
    let result = [...this.products];

    if (options?.search) {
      const normalized = options.search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.description.toLowerCase().includes(normalized),
      );
    }

    if (options?.category) {
      const normalizedCategory = options.category.trim().toLowerCase();
      result = result.filter((item) => item.category.toLowerCase() === normalizedCategory);
    }

    if (options?.sortBy) {
      const sortOrder = options.sortOrder ?? 'asc';
      result.sort((a, b) => {
        const left = a[options.sortBy!];
        const right = b[options.sortBy!];
        return sortOrder === 'asc' ? left - right : right - left;
      });
    }

    return result;
  }

  getCategories(): string[] {
    return [...new Set(this.products.map((product) => product.category))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  findOne(id: number): Product {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }
}