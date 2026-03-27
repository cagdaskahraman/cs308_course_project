import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.type';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    {
      id: 1,
      name: 'Apple iPhone 15',
      model: 'A3090',
      serialNumber: 'APL-IP15-128-0001',
      description: '128GB smartphone with OLED display and dual camera.',
      category: 'Phone',
      quantityInStock: 12,
      price: 54999,
      currency: 'TRY',
      warrantyStatus: '2 years official warranty',
      distributorInfo: 'Apple Turkey Distributor',
      popularity: 98,
      imageUrl:
        'https://images.unsplash.com/photo-1592286667927-6fbc5f6f8c6d?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      name: 'Samsung Galaxy S24',
      model: 'SM-S921B',
      serialNumber: 'SMS-S24-256-0102',
      description: '256GB flagship Android phone with AI features.',
      category: 'Phone',
      quantityInStock: 8,
      price: 49999,
      currency: 'TRY',
      warrantyStatus: '2 years official warranty',
      distributorInfo: 'Samsung Turkey Distributor',
      popularity: 92,
      imageUrl:
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      name: 'Lenovo Legion 5 Pro',
      model: '16IRX9',
      serialNumber: 'LNV-LEG5P-0303',
      description: 'Gaming laptop with high refresh display.',
      category: 'Laptop',
      quantityInStock: 5,
      price: 62999,
      currency: 'TRY',
      warrantyStatus: '2 years official warranty',
      distributorInfo: 'Lenovo Turkey Distributor',
      popularity: 85,
      imageUrl:
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      name: 'Sony WH-1000XM5',
      model: 'WH1000XM5B',
      serialNumber: 'SNY-XM5-0404',
      description: 'Premium noise cancelling over-ear headphones.',
      category: 'Headphone',
      quantityInStock: 0,
      price: 12999,
      currency: 'TRY',
      warrantyStatus: '2 years official warranty',
      distributorInfo: 'Sony Eurasia',
      popularity: 90,
      imageUrl:
        'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 5,
      name: 'Logitech MX Master 3S',
      model: '910-006559',
      serialNumber: 'LOG-MX3S-0505',
      description: 'Wireless productivity mouse for professionals.',
      category: 'Accessory',
      quantityInStock: 20,
      price: 4299,
      currency: 'TRY',
      warrantyStatus: '2 years official warranty',
      distributorInfo: 'Logitech Turkey',
      popularity: 88,
      imageUrl:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    },
  ];

  findAll(options?: {
    search?: string;
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

  findOne(id: number): Product {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }
}
