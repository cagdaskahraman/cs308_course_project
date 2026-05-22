import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrderItem } from '../orders/entities/order-item.entity';
import { CreateCategoryDto, RenameCategoryDto } from './dto/admin-category.dto';
import {
  AdminProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStockDto,
} from './dto/admin-product.dto';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';

export type ProductWithReviewStats = Product & {
  averageRating: number;
  reviewCount: number;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async findAll(options?: {
    search?: string;
    category?: string;
    sortBy?: 'price' | 'popularity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductWithReviewStats[]> {
    const qb = this.productsRepository.createQueryBuilder('p');
    qb.leftJoin(
      'reviews',
      'r',
      'r.product_id = p.id AND r.status = :approvedStatus',
      { approvedStatus: 'approved' },
    );

    if (options?.search?.trim()) {
      const term = `%${options.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.name) LIKE :term OR LOWER(p.description) LIKE :term)',
        { term },
      );
    }

    if (options?.category?.trim()) {
      qb.andWhere('LOWER(p.category) = LOWER(:category)', {
        category: options.category.trim(),
      });
    }

    qb.addSelect('COALESCE(AVG(r.rating), 0)', 'average_rating');
    qb.addSelect('COUNT(r.id)', 'review_count');
    qb.groupBy('p.id');

    if (options?.sortBy) {
      const dir = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
      if (options.sortBy === 'popularity') {
        // Popularity is strictly review count based.
        qb.orderBy('COUNT(r.id)', 'DESC').addOrderBy('p.name', 'ASC');
      } else {
        qb.orderBy('p.price', dir);
      }
    }

    const { entities, raw } = await qb.getRawAndEntities();
    return entities.map((entity, idx) => ({
      ...entity,
      averageRating: Number(raw[idx]?.average_rating ?? 0),
      reviewCount: Number(raw[idx]?.review_count ?? 0),
    }));
  }

  async getCategories(): Promise<string[]> {
    const productRows = await this.productsRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();

    const managedCategories = await this.categoriesRepository.find({
      order: { name: 'ASC' },
    });

    return ProductsService.mergeCategoryNames([
      ...managedCategories.map((c) => c.name),
      ...productRows.map((r) => r.category),
    ]);
  }

  async findOne(id: string): Promise<ProductWithReviewStats> {
    const qb = this.productsRepository.createQueryBuilder('p');
    qb.leftJoin(
      'reviews',
      'r',
      'r.product_id = p.id AND r.status = :approvedStatus',
      { approvedStatus: 'approved' },
    );
    qb.where('p.id = :id', { id });
    qb.addSelect('COALESCE(AVG(r.rating), 0)', 'average_rating');
    qb.addSelect('COUNT(r.id)', 'review_count');
    qb.groupBy('p.id');

    const { entities, raw } = await qb.getRawAndEntities();
    const product = entities[0];
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return {
      ...product,
      averageRating: Number(raw[0]?.average_rating ?? 0),
      reviewCount: Number(raw[0]?.review_count ?? 0),
    };
  }

  async findAllForAdmin(query?: AdminProductsQueryDto): Promise<Product[]> {
    const qb = this.productsRepository.createQueryBuilder('p');

    if (query?.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(p.name) LIKE :term OR
          LOWER(p.model) LIKE :term OR
          LOWER(p.serial_number) LIKE :term OR
          LOWER(p.description) LIKE :term
        )`,
        { term },
      );
    }

    if (query?.category?.trim()) {
      qb.andWhere('LOWER(p.category) = LOWER(:category)', {
        category: query.category.trim(),
      });
    }

    return qb.orderBy('p.name', 'ASC').getMany();
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const normalized = ProductsService.normalizeProductInput(dto);
    await this.ensureSerialNumberAvailable(normalized.serialNumber);
    await this.ensureCategoryExists(normalized.category);

    const product = this.productsRepository.create(normalized);
    return this.productsRepository.save(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    const normalized = ProductsService.normalizeProductInput(dto);
    if (
      normalized.serialNumber &&
      normalized.serialNumber.toLowerCase() !== product.serialNumber?.toLowerCase()
    ) {
      await this.ensureSerialNumberAvailable(normalized.serialNumber, id);
    }
    if (normalized.category) {
      await this.ensureCategoryExists(normalized.category);
    }

    Object.assign(product, normalized);
    return this.productsRepository.save(product);
  }

  async updateStock(id: string, dto: UpdateProductStockDto): Promise<Product> {
    return this.updateProduct(id, { stockQuantity: dto.stockQuantity });
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    const orderItemCount = await this.orderItemsRepository.count({
      where: { product: { id } },
    });
    if (orderItemCount > 0) {
      throw new ConflictException(
        'Product is referenced by existing orders and cannot be deleted.',
      );
    }

    await this.productsRepository.remove(product);
  }

  async createCategory(dto: CreateCategoryDto): Promise<ProductCategory> {
    const name = ProductsService.normalizeText(dto.name, 'Category name');
    if (await this.categoryNameExists(name)) {
      throw new ConflictException(`Category '${name}' already exists`);
    }
    const category = this.categoriesRepository.create({ name });
    return this.categoriesRepository.save(category);
  }

  async deleteCategory(name: string): Promise<void> {
    const normalized = ProductsService.normalizeText(name, 'Category name');
    const productCount = await this.productsRepository
      .createQueryBuilder('p')
      .where('LOWER(p.category) = LOWER(:category)', { category: normalized })
      .getCount();
    if (productCount > 0) {
      throw new ConflictException(
        `Category '${normalized}' is still used by ${productCount} product(s).`,
      );
    }

    const category = await this.categoriesRepository
      .createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:name)', { name: normalized })
      .getOne();
    if (!category) {
      throw new NotFoundException(`Category '${normalized}' not found`);
    }
    await this.categoriesRepository.remove(category);
  }

  async renameCategory(dto: RenameCategoryDto): Promise<string[]> {
    const oldName = ProductsService.normalizeText(dto.oldName, 'Old category name');
    const newName = ProductsService.normalizeText(dto.newName, 'New category name');
    if (oldName.toLowerCase() !== newName.toLowerCase()) {
      if (await this.categoryNameExists(newName)) {
        throw new ConflictException(`Category '${newName}' already exists`);
      }
    }

    await this.ensureCategoryExists(oldName);
    await this.productsRepository
      .createQueryBuilder()
      .update(Product)
      .set({ category: newName })
      .where('LOWER(category) = LOWER(:oldName)', { oldName })
      .execute();

    const category = await this.categoriesRepository
      .createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:oldName)', { oldName })
      .getOne();
    if (category) {
      category.name = newName;
      await this.categoriesRepository.save(category);
    } else {
      await this.ensureCategoryExists(newName);
    }

    return this.getCategories();
  }

  private async ensureSerialNumberAvailable(
    serialNumber: string,
    excludingProductId?: string,
  ): Promise<void> {
    const qb = this.productsRepository
      .createQueryBuilder('p')
      .where('LOWER(p.serial_number) = LOWER(:serialNumber)', { serialNumber });
    if (excludingProductId) {
      qb.andWhere('p.id != :excludingProductId', { excludingProductId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException(`Serial number '${serialNumber}' already exists`);
    }
  }

  private async ensureCategoryExists(name: string): Promise<void> {
    if (await this.categoryNameExists(name)) {
      return;
    }
    await this.categoriesRepository.save(
      this.categoriesRepository.create({
        name: ProductsService.normalizeText(name, 'Category name'),
      }),
    );
  }

  private async categoryNameExists(name: string): Promise<boolean> {
    const count = await this.categoriesRepository
      .createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:name)', { name })
      .getCount();
    if (count > 0) {
      return true;
    }

    const productCount = await this.productsRepository
      .createQueryBuilder('p')
      .where('LOWER(p.category) = LOWER(:name)', { name })
      .getCount();
    return productCount > 0;
  }

  private static normalizeProductInput<T extends Partial<CreateProductDto>>(
    dto: T,
  ): T {
    const normalized = { ...dto };
    const keys: Array<keyof CreateProductDto> = [
      'name',
      'model',
      'serialNumber',
      'description',
      'category',
      'imageUrl',
      'warrantyStatus',
      'distributorInfo',
    ];

    for (const key of keys) {
      const value = normalized[key];
      if (typeof value === 'string') {
        normalized[key] = ProductsService.normalizeText(value, String(key)) as never;
      }
    }

    return normalized;
  }

  private static normalizeText(value: string, label: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException(`${label} cannot be empty`);
    }
    return trimmed;
  }

  private static mergeCategoryNames(names: string[]): string[] {
    const byLower = new Map<string, string>();
    for (const name of names) {
      const trimmed = name?.trim();
      if (trimmed && !byLower.has(trimmed.toLowerCase())) {
        byLower.set(trimmed.toLowerCase(), trimmed);
      }
    }
    return [...byLower.values()].sort((a, b) => a.localeCompare(b));
  }
}
