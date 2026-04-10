import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Application routes (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/hello (GET)', () => {
    return request(app.getHttpServer())
      .get('/hello')
      .expect(200)
      .expect('Hello World');
  });

  it('/products (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(40);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('price');
  });

  it('/products/:id (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/products/1').expect(200);
    expect(response.body.id).toBe(1);
    expect(response.body.name).toBe('Apple iPhone 15');
  });

  it('/products/:id (GET) - not found', () => {
    return request(app.getHttpServer()).get('/products/999').expect(404);
  });

  it('/products?search=iphone (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/products?search=iphone').expect(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].name.toLowerCase()).toContain('iphone');
  });

  it('/products/categories (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/products/categories').expect(200);
    expect(response.body).toEqual(expect.arrayContaining(['Phone', 'Laptop', 'Headphone']));
  });

  it('/products?category=Phone (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/products?category=Phone').expect(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((item: { category: string }) => item.category === 'Phone')).toBe(
      true,
    );
  });
});
