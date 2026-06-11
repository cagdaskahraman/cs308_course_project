import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { InvoiceMailerService } from '../invoices/invoice-mailer.service';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { ApplyDiscountDto, UpdateProductPricingDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailer: InvoiceMailerService,
  ) {}

  static computeEffectivePrice(listPrice: number, discountRate: number): number {
    const rate = Math.min(100, Math.max(0, discountRate));
    const effective = listPrice * (1 - rate / 100);
    return Math.round(effective * 100) / 100;
  }

  async listProductsForPricing(): Promise<Product[]> {
    return this.productsRepository.find({ order: { name: 'ASC' } });
  }

  async updateProductPricing(
    productId: string,
    dto: UpdateProductPricingDto,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with id '${productId}' not found`);
    }

    const discountRate = dto.discountRate ?? product.discountRate ?? 0;
    product.listPrice = dto.listPrice;
    product.discountRate = discountRate;
    product.price = PricingService.computeEffectivePrice(dto.listPrice, discountRate);
    return this.productsRepository.save(product);
  }

  async applyDiscount(dto: ApplyDiscountDto): Promise<Product[]> {
    const products = await this.productsRepository.find({
      where: { id: In(dto.productIds) },
    });
    if (products.length !== dto.productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    const updated: Product[] = [];
    for (const product of products) {
      if (product.listPrice <= 0) {
        this.logger.warn(
          `Skipping discount for ${product.id} because list price is not set`,
        );
        continue;
      }
      product.discountRate = dto.discountRate;
      product.price = PricingService.computeEffectivePrice(
        product.listPrice,
        dto.discountRate,
      );
      updated.push(await this.productsRepository.save(product));
    }

    await this.notifyWishlistUsers(updated, dto.discountRate);
    return updated;
  }

  private async notifyWishlistUsers(
    products: Product[],
    discountRate: number,
  ): Promise<void> {
    if (products.length === 0) {
      return;
    }

    const priceByProductId = new Map(products.map((p) => [p.id, p.price]));
    const productIds = products.map((p) => p.id);
    const wishlistRows = await this.wishlistRepository.find({
      where: { product: { id: In(productIds) } },
      relations: { user: true, product: true },
    });

    for (const row of wishlistRows) {
      await this.mailer.sendDiscountAlert({
        to: row.user.email,
        productName: row.product.name,
        discountRate,
        newPrice: priceByProductId.get(row.product.id) ?? row.product.price,
      });
    }
  }
}
