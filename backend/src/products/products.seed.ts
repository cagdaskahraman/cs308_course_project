import { Product } from './product.type';

type Category = 'Phone' | 'Laptop' | 'Headphone' | 'Accessory' | 'Tablet';

type ProductSeedInput = {
  name: string;
  model: string;
  category: Category;
  price: number;
  quantityInStock: number;
  popularity: number;
  distributorInfo: string;
  imageUrl: string;
  description: string;
};

const productSeedInput: ProductSeedInput[] = [
  { name: 'Apple iPhone 15', model: 'A3090', category: 'Phone', price: 54999, quantityInStock: 12, popularity: 98, distributorInfo: 'Apple Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1592286667927-6fbc5f6f8c6d?auto=format&fit=crop&w=800&q=80', description: '128GB smartphone with OLED display and dual camera.' },
  { name: 'Samsung Galaxy S24', model: 'SM-S921B', category: 'Phone', price: 49999, quantityInStock: 8, popularity: 92, distributorInfo: 'Samsung Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80', description: '256GB flagship Android phone with AI features.' },
  { name: 'Google Pixel 9', model: 'GX7AS', category: 'Phone', price: 46999, quantityInStock: 7, popularity: 89, distributorInfo: 'Google Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', description: 'Pure Android experience with advanced camera software.' },
  { name: 'Xiaomi 14', model: '23127PN0CG', category: 'Phone', price: 38999, quantityInStock: 9, popularity: 84, distributorInfo: 'Xiaomi Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=800&q=80', description: 'High-performance phone with fast charging support.' },
  { name: 'OnePlus 12', model: 'CPH2581', category: 'Phone', price: 42999, quantityInStock: 6, popularity: 86, distributorInfo: 'OnePlus Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=800&q=80', description: 'Smooth display and flagship-level performance.' },
  { name: 'Nothing Phone 2', model: 'A065', category: 'Phone', price: 27999, quantityInStock: 10, popularity: 80, distributorInfo: 'Nothing Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80', description: 'Unique design with glyph interface and clean software.' },
  { name: 'Huawei P60 Pro', model: 'MNA-LX9', category: 'Phone', price: 35999, quantityInStock: 0, popularity: 77, distributorInfo: 'Huawei Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', description: 'Premium camera phone with elegant design.' },
  { name: 'Oppo Reno 11', model: 'CPH2607', category: 'Phone', price: 22999, quantityInStock: 11, popularity: 75, distributorInfo: 'Oppo Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80', description: 'Balanced smartphone for daily productivity and media.' },
  { name: 'Lenovo Legion 5 Pro', model: '16IRX9', category: 'Laptop', price: 62999, quantityInStock: 5, popularity: 85, distributorInfo: 'Lenovo Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80', description: 'Gaming laptop with high refresh display.' },
  { name: 'Apple MacBook Air 13', model: 'M3-13', category: 'Laptop', price: 55999, quantityInStock: 4, popularity: 96, distributorInfo: 'Apple Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80', description: 'Lightweight laptop with all-day battery life.' },
  { name: 'Dell XPS 13', model: '9340', category: 'Laptop', price: 58999, quantityInStock: 3, popularity: 90, distributorInfo: 'Dell Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', description: 'Compact premium ultrabook with sharp display.' },
  { name: 'HP Spectre x360', model: '14-eu0001nt', category: 'Laptop', price: 57999, quantityInStock: 2, popularity: 82, distributorInfo: 'HP Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1587614382346-acf64f864f8c?auto=format&fit=crop&w=800&q=80', description: 'Convertible laptop with touch and pen support.' },
  { name: 'Asus ROG Zephyrus G14', model: 'GA403', category: 'Laptop', price: 69999, quantityInStock: 0, popularity: 91, distributorInfo: 'Asus Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80', description: 'Portable gaming laptop with strong graphics.' },
  { name: 'Acer Swift Go 14', model: 'SFG14-73', category: 'Laptop', price: 40999, quantityInStock: 9, popularity: 78, distributorInfo: 'Acer Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1593642634524-b40b5baae6bb?auto=format&fit=crop&w=800&q=80', description: 'Daily use ultrabook with OLED display.' },
  { name: 'MSI Creator M16', model: 'B13VF', category: 'Laptop', price: 51999, quantityInStock: 6, popularity: 76, distributorInfo: 'MSI Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80', description: 'Content creation focused laptop with strong CPU.' },
  { name: 'Huawei MateBook D16', model: 'RLEF-X', category: 'Laptop', price: 32999, quantityInStock: 8, popularity: 73, distributorInfo: 'Huawei Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', description: 'Affordable large-screen productivity laptop.' },
  { name: 'Sony WH-1000XM5', model: 'WH1000XM5B', category: 'Headphone', price: 12999, quantityInStock: 0, popularity: 90, distributorInfo: 'Sony Eurasia', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80', description: 'Premium noise cancelling over-ear headphones.' },
  { name: 'Bose QuietComfort Ultra', model: 'QCULTRA', category: 'Headphone', price: 13999, quantityInStock: 5, popularity: 87, distributorInfo: 'Bose Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80', description: 'Comfort-first ANC headset with rich sound.' },
  { name: 'Sennheiser Momentum 4', model: 'M4AEBT', category: 'Headphone', price: 10999, quantityInStock: 7, popularity: 83, distributorInfo: 'Sennheiser Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80', description: 'Long battery life and balanced sound profile.' },
  { name: 'Apple AirPods Pro 2', model: 'A3048', category: 'Headphone', price: 8999, quantityInStock: 13, popularity: 95, distributorInfo: 'Apple Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&w=800&q=80', description: 'True wireless earbuds with adaptive transparency.' },
  { name: 'Samsung Galaxy Buds2 Pro', model: 'SM-R510', category: 'Headphone', price: 5499, quantityInStock: 14, popularity: 79, distributorInfo: 'Samsung Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80', description: 'Compact earbuds with active noise cancellation.' },
  { name: 'JBL Tune 770NC', model: 'T770NC', category: 'Headphone', price: 3999, quantityInStock: 16, popularity: 74, distributorInfo: 'JBL Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', description: 'Value focused wireless ANC headphones.' },
  { name: 'Anker Soundcore Q45', model: 'A3040', category: 'Headphone', price: 4599, quantityInStock: 10, popularity: 72, distributorInfo: 'Anker Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=800&q=80', description: 'Strong noise cancellation at mid-range price.' },
  { name: 'Beats Studio Pro', model: 'MQTP3', category: 'Headphone', price: 9999, quantityInStock: 0, popularity: 70, distributorInfo: 'Apple Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80', description: 'Stylish over-ear headset with immersive audio.' },
  { name: 'Logitech MX Master 3S', model: '910-006559', category: 'Accessory', price: 4299, quantityInStock: 20, popularity: 88, distributorInfo: 'Logitech Turkey', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', description: 'Wireless productivity mouse for professionals.' },
  { name: 'Logitech MX Keys S', model: '920-011589', category: 'Accessory', price: 4799, quantityInStock: 15, popularity: 86, distributorInfo: 'Logitech Turkey', imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80', description: 'Backlit keyboard for multi-device workflow.' },
  { name: 'Razer DeathAdder V3', model: 'RZ01-0464', category: 'Accessory', price: 3199, quantityInStock: 12, popularity: 81, distributorInfo: 'Razer Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', description: 'Ergonomic gaming mouse with high precision sensor.' },
  { name: 'SteelSeries Apex 7', model: '64734', category: 'Accessory', price: 5999, quantityInStock: 6, popularity: 77, distributorInfo: 'SteelSeries Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=800&q=80', description: 'Mechanical keyboard with OLED smart display.' },
  { name: 'Kingston XS1000 SSD 1TB', model: 'SXS1000-1000G', category: 'Accessory', price: 3299, quantityInStock: 18, popularity: 75, distributorInfo: 'Kingston Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80', description: 'Portable external SSD for fast backups.' },
  { name: 'UGREEN 100W GaN Charger', model: 'CD226', category: 'Accessory', price: 1999, quantityInStock: 0, popularity: 71, distributorInfo: 'UGREEN Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?auto=format&fit=crop&w=800&q=80', description: 'Fast multi-port charger for phone and laptop.' },
  { name: 'Anker USB-C Hub 8-in-1', model: 'A8383', category: 'Accessory', price: 2499, quantityInStock: 9, popularity: 73, distributorInfo: 'Anker Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80', description: 'USB-C hub with HDMI, ethernet and card reader.' },
  { name: 'TP-Link Archer AX55', model: 'AX3000', category: 'Accessory', price: 2899, quantityInStock: 8, popularity: 69, distributorInfo: 'TP-Link Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1624969862644-791f3dc98927?auto=format&fit=crop&w=800&q=80', description: 'Wi-Fi 6 router for home and small office use.' },
  { name: 'Apple iPad Air 11', model: 'M2-11', category: 'Tablet', price: 32999, quantityInStock: 7, popularity: 93, distributorInfo: 'Apple Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80', description: 'Thin tablet with powerful chip and pencil support.' },
  { name: 'Samsung Galaxy Tab S9', model: 'SM-X710', category: 'Tablet', price: 28999, quantityInStock: 5, popularity: 85, distributorInfo: 'Samsung Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80', description: 'AMOLED tablet suited for media and note-taking.' },
  { name: 'Lenovo Tab P12', model: 'TB370FU', category: 'Tablet', price: 14999, quantityInStock: 12, popularity: 72, distributorInfo: 'Lenovo Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1589739900243-4b52cd9dd9d1?auto=format&fit=crop&w=800&q=80', description: 'Large-screen tablet for study and entertainment.' },
  { name: 'Xiaomi Pad 6', model: '23043RP34G', category: 'Tablet', price: 13999, quantityInStock: 10, popularity: 76, distributorInfo: 'Xiaomi Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=800&q=80', description: 'Value-focused tablet with smooth display.' },
  { name: 'Huawei MatePad 11.5', model: 'BTK-W09', category: 'Tablet', price: 11999, quantityInStock: 0, popularity: 68, distributorInfo: 'Huawei Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=800&q=80', description: 'Portable tablet for students and remote work.' },
  { name: 'Microsoft Surface Pro 10', model: '2038', category: 'Tablet', price: 45999, quantityInStock: 4, popularity: 82, distributorInfo: 'Microsoft Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?auto=format&fit=crop&w=800&q=80', description: '2-in-1 tablet-laptop device for professionals.' },
  { name: 'Honor Pad 9', model: 'HEY2-W09', category: 'Tablet', price: 10999, quantityInStock: 11, popularity: 66, distributorInfo: 'Honor Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80', description: 'Affordable tablet with quad speakers and big battery.' },
  { name: 'Amazon Fire Max 11', model: 'K3R6AT', category: 'Tablet', price: 8999, quantityInStock: 13, popularity: 64, distributorInfo: 'Amazon Turkey Distributor', imageUrl: 'https://images.unsplash.com/photo-1573894996493-16b4f3ad2fbb?auto=format&fit=crop&w=800&q=80', description: 'Entry-level tablet suitable for basic media use.' },
];

const PRODUCT_CURRENCY: Product['currency'] = 'TRY';
const PRODUCT_WARRANTY = '2 years official warranty';

export const productsSeed: Product[] = productSeedInput.map((item, index) => ({
  id: index + 1,
  name: item.name,
  model: item.model,
  serialNumber: `SN-${String(index + 1).padStart(4, '0')}-${item.model}`,
  description: item.description,
  category: item.category,
  quantityInStock: item.quantityInStock,
  price: item.price,
  currency: PRODUCT_CURRENCY,
  warrantyStatus: PRODUCT_WARRANTY,
  distributorInfo: item.distributorInfo,
  popularity: item.popularity,
  imageUrl: item.imageUrl,
}));

export function validateProductsSeed(products: Product[]): void {
  const serials = new Set<string>();

  products.forEach((product) => {
    if (!product.name.trim()) {
      throw new Error(`Product ${product.id} has empty name`);
    }
    if (!product.model.trim()) {
      throw new Error(`Product ${product.id} has empty model`);
    }
    if (!product.serialNumber.trim()) {
      throw new Error(`Product ${product.id} has empty serial number`);
    }
    if (serials.has(product.serialNumber)) {
      throw new Error(`Duplicate serial number detected: ${product.serialNumber}`);
    }
    serials.add(product.serialNumber);

    if (product.price <= 0) {
      throw new Error(`Product ${product.id} has invalid price`);
    }
    if (product.quantityInStock < 0) {
      throw new Error(`Product ${product.id} has invalid stock quantity`);
    }
  });
}
