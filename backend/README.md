# Backend - Course Project Scope

This service provides product data for the CS308 online store project using NestJS.

## Run

```bash
npm install
npm run start:dev
```

## Endpoints

- `GET /products`
  - Supports `search` query on product name/description.
  - Supports category filtering with `category`.
  - Supports sorting with `sortBy=price|popularity` and `sortOrder=asc|desc`.
- `GET /products/categories`
- `GET /products/:id`

## Product fields (course requirement #9 aligned)

Each product includes:

- `id`
- `name`
- `model`
- `serialNumber`
- `description`
- `category`
- `stockQuantity`
- `price`
- `warrantyStatus`
- `distributorInfo`
- `popularity`

Out-of-stock products remain visible/searchable through the API and can be handled at cart step on frontend.

## Seed dataset and validation

- Dataset includes **40 products** across **5 categories** (`Phone`, `Laptop`, `Headphone`, `Accessory`, `Tablet`).
- At least 5 products are out-of-stock (`stockQuantity = 0`) for UI/cart edge-case testing.
- Validation rules are enforced at startup:
  - `name`, `model`, `serialNumber` must be non-empty
  - `serialNumber` must be unique
  - `price > 0`
  - `stockQuantity >= 0`

Seed database with canonical catalog:

```bash
npm run seed:products
```

`seed:products` uses the same canonical dataset as API and tests.
