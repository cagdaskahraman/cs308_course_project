import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Products API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /products — returns product array', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('stockQuantity');
      expect(response.body[0]).toHaveProperty('category');
    }
  });

  it('GET /products/:id — returns product by UUID', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    if (listRes.body.length === 0) return;

    const product = listRes.body[0];
    const response = await request(app.getHttpServer())
      .get(`/products/${product.id}`)
      .expect(200);

    expect(response.body.id).toBe(product.id);
    expect(response.body.name).toBe(product.name);
  });

  it('GET /products/:id — 400 for non-UUID id', () => {
    return request(app.getHttpServer()).get('/products/123').expect(400);
  });

  it('GET /products/:id — 404 for non-existent UUID', () => {
    return request(app.getHttpServer())
      .get('/products/00000000-0000-4000-a000-000000000000')
      .expect(404);
  });

  it('GET /products?search=<term> — filters by name/description', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    if (listRes.body.length === 0) return;

    const sampleName: string = listRes.body[0].name;
    const keyword = sampleName.split(' ')[0];

    const response = await request(app.getHttpServer())
      .get(`/products?search=${encodeURIComponent(keyword)}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body[0].name.toLowerCase(),
    ).toContain(keyword.toLowerCase());
  });

  it('GET /products/categories — returns string array', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/categories')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    for (const cat of response.body) {
      expect(typeof cat).toBe('string');
    }
  });

  it('GET /products?category=<cat> — filters by category', async () => {
    const catRes = await request(app.getHttpServer())
      .get('/products/categories')
      .expect(200);

    if (catRes.body.length === 0) return;

    const category = catRes.body[0];
    const response = await request(app.getHttpServer())
      .get(`/products?category=${encodeURIComponent(category)}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every(
        (item: { category: string }) => item.category === category,
      ),
    ).toBe(true);
  });
});
