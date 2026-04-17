export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl: string;
  model?: string | null;
  serialNumber?: string | null;
  warrantyStatus?: string | null;
  distributorInfo?: string | null;
};
