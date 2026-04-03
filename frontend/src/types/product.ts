export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl: string;
  model?: string;
  serialNumber?: string;
  warrantyStatus?: string;
  distributorInfo?: string;
  currency?: string;
  popularity?: number;
};
