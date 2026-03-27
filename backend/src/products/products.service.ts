import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.type';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    {
      id: 1,
      name: 'Apple iPhone 15 128GB',
      category: 'Phone',
      price: 54999,
      currency: 'TRY',
      imageUrl:
        'https://images.unsplash.com/photo-1592286667927-6fbc5f6f8c6d?auto=format&fit=crop&w=800&q=80',
      inStock: true,
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Samsung Galaxy S24 256GB',
      category: 'Phone',
      price: 49999,
      currency: 'TRY',
      imageUrl:
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      inStock: true,
      rating: 4.7,
    },
    {
      id: 3,
      name: 'Lenovo Legion 5 Pro',
      category: 'Laptop',
      price: 62999,
      currency: 'TRY',
      imageUrl:
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
      inStock: true,
      rating: 4.6,
    },
    {
      id: 4,
      name: 'Sony WH-1000XM5',
      category: 'Headphone',
      price: 12999,
      currency: 'TRY',
      imageUrl:
        'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
      inStock: false,
      rating: 4.9,
    },
    {
      id: 5,
      name: 'Logitech MX Master 3S',
      category: 'Accessory',
      price: 4299,
      currency: 'TRY',
      imageUrl:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      inStock: true,
      rating: 4.8,
    },
    {
      id: 6,
      name: 'Xiaomi Redmi Watch 4',
      category: 'Wearable',
      price: 3499,
      currency: 'TRY',
      imageUrl:
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
      inStock: true,
      rating: 4.4,
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }
}
