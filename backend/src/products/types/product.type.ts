export type Product = {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  category: string;
  quantityInStock: number;
  price: number;
  currency: 'TRY';
  warrantyStatus: string;
  distributorInfo: string;
  popularity: number;
  imageUrl: string;
};
