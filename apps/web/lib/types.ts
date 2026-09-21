export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceFormatted: string;
  stockQuantity: number;
  inStock: boolean;
  imageUrl: string;
}

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
}

export interface OrderLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export interface Order {
  orderId: string;
  status: string;
  channel: string;
  total: number;
  totalFormatted: string;
  items: OrderLine[];
  createdAt: string;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string | null;
}

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress?: string;
}

export interface ApiErrorBody {
  statusCode: number;
  code?: string;
  message: string;
}

export type Species = 'DOG' | 'CAT' | 'OTHER';

export interface Pet {
  petId: string;
  ownerId: string;
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  weightKg?: number;
  photoUrl?: string;
}

export interface RegisterPetPayload {
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  weightKg?: number;
}

export interface MedicalRecord {
  medicalRecordId: string;
  petId: string;
  appointmentId: string;
  veterinarianId: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
  createdAt: string;
}

export type ServiceType = 'MEDICAL_CONSULT' | 'VACCINATION' | 'GROOMING' | 'SURGERY' | 'EMERGENCY';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  appointmentId: string;
  petId: string;
  ownerId: string;
  professionalId: string;
  serviceType: ServiceType;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface ScheduleAppointmentPayload {
  petId: string;
  professionalId: string;
  serviceType: ServiceType;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}

export type StaffRole = 'VETERINARIAN' | 'GROOMER';

export interface StaffMember {
  userId: string;
  fullName: string;
  role: StaffRole;
}

export interface CustomerLookup {
  userId: string;
  fullName: string;
  email: string;
}

export interface WalkInCustomerPayload {
  fullName: string;
  email: string;
  phone?: string;
}

export type ProductCategory = 'FOOD' | 'ACCESSORIES' | 'HYGIENE' | 'MEDICATION' | 'TOYS';

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  priceFormatted: string;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
}

export interface AdminProductListResponse {
  items: AdminProduct[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stockQuantity: number;
  imageUrl: string;
}

export interface InStoreCheckoutPayload extends CheckoutPayload {
  customerId: string;
}

export interface AddMedicalRecordPayload {
  appointmentId: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
}
