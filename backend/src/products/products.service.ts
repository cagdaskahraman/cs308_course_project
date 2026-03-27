import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.type';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    {
      id: '1',
      name: 'UltraBook Pro 15',
      description:
        '15 inç 4K ekran, Intel i7, 16 GB RAM, 512 GB SSD — günlük ve profesyonel kullanım için dizüstü bilgisayar.',
      category: 'Laptop',
      price: 42999.99,
      stockQuantity: 12,
      imageUrl: '/assets/products/laptop-ultrabook-pro-15.png',
    },
    {
      id: '2',
      name: 'NovaPhone X',
      description:
        'AMOLED ekran, 5G, 256 GB depolama, çift SIM — güçlü kamera ve uzun pil ömrü ile akıllı telefon.',
      category: 'Smartphone',
      price: 18999.5,
      stockQuantity: 40,
      imageUrl: '/assets/products/smartphone-novaphone-x.jpg',
    },
    {
      id: '3',
      name: 'SoundWave ANC 700',
      description:
        'Aktif gürültü engelleme, 30 saat pil, Bluetooth 5.3 — kablosuz kulak üstü kulaklık.',
      category: 'Headphones',
      price: 3499.0,
      stockQuantity: 85,
      imageUrl: '/assets/products/headphones-soundwave-anc-700.png',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: string): Product {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return product;
  }

  create(payload: CreateProductDto): Product {
    const newProduct: Product = {
      id: String(this.products.length + 1),
      ...payload,
    };
    this.products.push(newProduct);
    return newProduct;
  }
}

