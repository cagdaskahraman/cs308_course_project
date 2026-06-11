import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Invoice } from '../invoices/entities/invoice.entity';
import { OrderItemStatus } from '../orders/entities/order-item-status.enum';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { User, UserRole } from './entities/user.entity';

type StaffUserSeed = {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  taxId: string;
  homeAddress: string;
};

type DemoCustomerSeed = {
  email: string;
  password: string;
  fullName: string;
  taxId: string;
  homeAddress: string;
};

type DemoProductSeed = {
  key: 'A' | 'B' | 'C' | 'E' | 'F' | 'G' | 'H';
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  category: string;
  imageUrl: string;
  listPrice: number;
  stockQuantity: number;
  warrantyStatus: string;
  distributorInfo: string;
  popularity: number;
};

type DemoPurchaseSeed = {
  productKey: DemoProductSeed['key'];
  status: OrderStatus;
  itemStatus: OrderItemStatus;
  daysAgo: number;
};

@Injectable()
export class UsersDevSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersDevSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isProd = process.env.NODE_ENV === 'production';
    const seedUsersEnabled = process.env.AUTO_SEED_USERS !== 'false';
    if (isProd && !seedUsersEnabled) {
      return;
    }

    await this.demoteLegacyAdminAccounts();

    const staffUsers: StaffUserSeed[] = [
      {
        email:
          process.env.DEMO_PRODUCT_MANAGER_EMAIL ?? 'pm@electrostore.local',
        password: process.env.DEMO_PRODUCT_MANAGER_PASSWORD ?? 'Manager123!',
        role: UserRole.PRODUCT_MANAGER,
        fullName: 'Catalog Operations',
        taxId: 'PM-0001',
        homeAddress: 'Istanbul, Besiktas',
      },
      {
        email:
          process.env.DEMO_SALES_MANAGER_EMAIL ?? 'sm@electrostore.local',
        password: process.env.DEMO_SALES_MANAGER_PASSWORD ?? 'Sales123!',
        role: UserRole.SALES_MANAGER,
        fullName: 'Sales Operations',
        taxId: 'SM-0001',
        homeAddress: 'Istanbul, Kadikoy',
      },
    ];

    for (const staffUser of staffUsers) {
      await this.ensureStaffUser(staffUser);
    }

    if (process.env.AUTO_SEED_DEMO_SCENARIO !== 'false') {
      await this.ensureDemoScenario();
    }
  }

  private async demoteLegacyAdminAccounts(): Promise<void> {
    const demoted = await this.usersRepository.update(
      { role: UserRole.ADMIN },
      { role: UserRole.PRODUCT_MANAGER },
    );
    if (demoted.affected && demoted.affected > 0) {
      this.logger.log(
        `Demoted ${demoted.affected} legacy admin account(s) to product_manager.`,
      );
    }
  }

  private async ensureDemoScenario(): Promise<void> {
    const customer = await this.ensureDemoCustomer({
      email: process.env.DEMO_CUSTOMER_EMAIL ?? 'customer@electrostore.local',
      password: process.env.DEMO_CUSTOMER_PASSWORD ?? 'Customer123!',
      fullName: 'Demo Customer',
      taxId: 'CUST-0001',
      homeAddress: 'Istanbul, Sariyer Demo Residence',
    });

    const products = new Map<DemoProductSeed['key'], Product>();
    for (const seed of UsersDevSeedService.demoProducts()) {
      products.set(seed.key, await this.ensureDemoProduct(seed));
    }

    for (const purchase of UsersDevSeedService.demoPurchases()) {
      const product = products.get(purchase.productKey);
      if (!product) {
        continue;
      }
      await this.ensureDemoOrder(customer, product, purchase);
    }

    this.logger.log(
      `Seeded demo customer purchase scenario for ${customer.email}.`,
    );
  }

  private async ensureDemoCustomer(seed: DemoCustomerSeed): Promise<User> {
    const email = seed.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(seed.password, 10);
    const existing = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'fullName',
        'taxId',
        'homeAddress',
        'passwordHash',
        'role',
      ],
    });

    if (!existing) {
      const saved = await this.usersRepository.save(
        this.usersRepository.create({
          email,
          fullName: seed.fullName,
          taxId: seed.taxId,
          homeAddress: seed.homeAddress,
          passwordHash,
          role: UserRole.CUSTOMER,
        }),
      );
      this.logger.log(`Seeded demo customer account ${email}.`);
      return saved;
    }

    existing.fullName = seed.fullName;
    existing.taxId = seed.taxId;
    existing.homeAddress = seed.homeAddress;
    existing.passwordHash = passwordHash;
    existing.role = UserRole.CUSTOMER;
    return this.usersRepository.save(existing);
  }

  private async ensureDemoProduct(seed: DemoProductSeed): Promise<Product> {
    const existing = await this.productsRepository.findOne({
      where: { serialNumber: seed.serialNumber },
    });
    const values: Partial<Product> = {
      name: seed.name,
      model: seed.model,
      serialNumber: seed.serialNumber,
      description: seed.description,
      category: seed.category,
      imageUrl: seed.imageUrl,
      price: seed.listPrice,
      listPrice: seed.listPrice,
      discountRate: 0,
      stockQuantity: seed.stockQuantity,
      warrantyStatus: seed.warrantyStatus,
      distributorInfo: seed.distributorInfo,
      popularity: seed.popularity,
    };

    if (!existing) {
      const saved = await this.productsRepository.save(
        this.productsRepository.create(values),
      );
      this.logger.log(`Seeded demo product ${seed.name}.`);
      return saved;
    }

    Object.assign(existing, values);
    return this.productsRepository.save(existing);
  }

  private async ensureDemoOrder(
    customer: User,
    product: Product,
    seed: DemoPurchaseSeed,
  ): Promise<void> {
    const purchasedAt = UsersDevSeedService.daysAgo(seed.daysAgo);
    const existingOrders = await this.ordersRepository.find({
      where: { userId: customer.id },
      relations: { items: { product: true } },
      order: { orderDate: 'DESC' },
    });
    const existing = existingOrders.find((order) =>
      order.items.some(
        (item) => item.product.serialNumber === product.serialNumber,
      ),
    );

    if (existing) {
      existing.status = seed.status;
      existing.deliveryAddress = customer.homeAddress;
      existing.totalPrice = product.price;
      await this.ordersRepository.save(existing);
      await this.ordersRepository.update(existing.id, { orderDate: purchasedAt });
      for (const item of existing.items) {
        if (item.product.serialNumber === product.serialNumber) {
          item.status = seed.itemStatus;
          item.priceAtPurchase = product.price;
          item.quantity = 1;
          await this.orderItemsRepository.save(item);
        }
      }
      await this.ensureDemoInvoice(existing, customer, product, purchasedAt);
      return;
    }

    const order = this.ordersRepository.create({
      userId: customer.id,
      status: seed.status,
      deliveryAddress: customer.homeAddress,
      totalPrice: product.price,
      items: [
        this.orderItemsRepository.create({
          product,
          quantity: 1,
          priceAtPurchase: product.price,
          status: seed.itemStatus,
        }),
      ],
    });
    const saved = await this.ordersRepository.save(order);
    await this.ordersRepository.update(saved.id, { orderDate: purchasedAt });
    const reloaded = await this.ordersRepository.findOneOrFail({
      where: { id: saved.id },
      relations: { items: { product: true } },
    });
    await this.ensureDemoInvoice(reloaded, customer, product, purchasedAt);
  }

  private async ensureDemoInvoice(
    order: Order,
    customer: User,
    product: Product,
    issuedAt: Date,
  ): Promise<void> {
    const invoiceNumber = `DEMO-${product.serialNumber}`;
    const existing = await this.invoicesRepository.findOne({
      where: { invoiceNumber },
      relations: { order: true },
    });
    const values: Partial<Invoice> = {
      invoiceNumber,
      billingEmail: customer.email,
      billingName: customer.fullName ?? 'Demo Customer',
      taxId: customer.taxId,
      billingAddress: customer.homeAddress ?? 'Demo delivery address',
      cardLast4: '4242',
      authorizationReference: `AUTH-DEMO-${product.serialNumber}`,
      subtotal: product.price,
      total: product.price,
      order,
    };

    if (!existing) {
      const saved = await this.invoicesRepository.save(
        this.invoicesRepository.create(values),
      );
      await this.invoicesRepository.update(saved.id, { issuedAt });
      return;
    }

    Object.assign(existing, values);
    await this.invoicesRepository.save(existing);
    await this.invoicesRepository.update(existing.id, { issuedAt });
  }

  private static demoProducts(): DemoProductSeed[] {
    return [
      {
        key: 'A',
        name: 'Demo Product A - Sold Out Earbuds',
        model: 'DEMO-A-EARBUDS',
        serialNumber: 'DEMO-PRODUCT-A',
        description: 'Out-of-stock demo item; add-to-cart should be disabled.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        listPrice: 1299,
        stockQuantity: 0,
        warrantyStatus: '1 year',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 96,
      },
      {
        key: 'B',
        name: 'Demo Product B - Last Unit Keyboard',
        model: 'DEMO-B-KEYBOARD',
        serialNumber: 'DEMO-PRODUCT-B',
        description: 'Only one unit in stock for low-stock checkout demo.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        listPrice: 1899,
        stockQuantity: 1,
        warrantyStatus: '2 years',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 94,
      },
      {
        key: 'C',
        name: 'Demo Product C - Stocked Power Bank',
        model: 'DEMO-C-POWER',
        serialNumber: 'DEMO-PRODUCT-C',
        description: 'Multiple units in stock for normal add-to-cart demo.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
        listPrice: 899,
        stockQuantity: 8,
        warrantyStatus: '1 year',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 90,
      },
      {
        key: 'E',
        name: 'Demo Product E - Retro Console',
        model: 'DEMO-E-RETRO',
        serialNumber: 'DEMO-PRODUCT-E',
        description: 'Delivered more than one month ago for return-window demo.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        listPrice: 3499,
        stockQuantity: 9,
        warrantyStatus: '2 years',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 92,
      },
      {
        key: 'F',
        name: 'Demo Product F - Smart Speaker',
        model: 'DEMO-F-SPEAKER',
        serialNumber: 'DEMO-PRODUCT-F',
        description: 'Delivered less than one month ago for eligible return demo.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        listPrice: 2199,
        stockQuantity: 9,
        warrantyStatus: '2 years',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 88,
      },
      {
        key: 'G',
        name: 'Demo Product G - Portable Monitor',
        model: 'DEMO-G-MONITOR',
        serialNumber: 'DEMO-PRODUCT-G',
        description: 'Recently purchased and still processing.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        listPrice: 5899,
        stockQuantity: 9,
        warrantyStatus: '2 years',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 84,
      },
      {
        key: 'H',
        name: 'Demo Product H - Travel Router',
        model: 'DEMO-H-ROUTER',
        serialNumber: 'DEMO-PRODUCT-H',
        description: 'Recently purchased and currently in transit.',
        category: 'Demo',
        imageUrl:
          'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=800&q=80',
        listPrice: 1599,
        stockQuantity: 9,
        warrantyStatus: '1 year',
        distributorInfo: 'ElectroStore Demo Distribution',
        popularity: 80,
      },
    ];
  }

  private static demoPurchases(): DemoPurchaseSeed[] {
    return [
      {
        productKey: 'E',
        status: OrderStatus.Delivered,
        itemStatus: OrderItemStatus.Delivered,
        daysAgo: 45,
      },
      {
        productKey: 'F',
        status: OrderStatus.Delivered,
        itemStatus: OrderItemStatus.Delivered,
        daysAgo: 10,
      },
      {
        productKey: 'G',
        status: OrderStatus.Processing,
        itemStatus: OrderItemStatus.Processing,
        daysAgo: 1,
      },
      {
        productKey: 'H',
        status: OrderStatus.InTransit,
        itemStatus: OrderItemStatus.InTransit,
        daysAgo: 2,
      },
    ];
  }

  private static daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private async ensureStaffUser(seed: StaffUserSeed): Promise<void> {
    const email = seed.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'role'],
    });

    const passwordHash = await bcrypt.hash(seed.password, 10);

    if (!existing) {
      await this.usersRepository.save(
        this.usersRepository.create({
          email,
          fullName: seed.fullName,
          taxId: seed.taxId,
          homeAddress: seed.homeAddress,
          passwordHash,
          role: seed.role,
        }),
      );
      this.logger.log(`Seeded staff account ${email} (${seed.role}).`);
      return;
    }

    const updates: Partial<User> = { passwordHash };
    if (existing.role !== seed.role) {
      updates.role = seed.role;
    }
    await this.usersRepository.update({ id: existing.id }, updates);
    if (existing.role !== seed.role) {
      this.logger.log(
        `Updated role for staff account ${email}: ${existing.role} -> ${seed.role}.`,
      );
    }
  }
}
