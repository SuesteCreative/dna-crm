export interface Booking {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  activityDate: string;
  activityTime: string | null;
  pax: number;
  status: string;
  source: string;
  shopifyId?: string | null;
  orderNumber?: string | null;
  serviceId?: string | null;
  totalPrice: number | null;
  quantity?: number | null;
  notes?: string | null;
  activityType?: string | null;
  showedUp?: boolean | null;
  isEdited?: boolean | null;
  originalActivityType?: string | null;
  originalPax?: number | null;
  originalQuantity?: number | null;
  originalTotalPrice?: number | null;
  originalActivityDate?: string | null;
  originalActivityTime?: string | null;
  partnerId?: string | null;
  country?: string | null;
  bookingFee?: number | null;
  activities?: BookingActivity[];
}

export interface BookingActivity {
  id: string;
  bookingId: string;
  serviceId?: string | null;
  activityType?: string | null;
  activityDate: string;
  activityTime: string | null;
  pax: number;
  quantity?: number | null;
  totalPrice?: number | null;
}

export interface Service {
  id: string;
  name: string;
  variant: string | null;
  sku: string | null;
  price: number | null;
  category: string | null;
  durationMinutes: number | null;
  minPax: number | null;
  maxPax: number | null;
  unitCapacity?: number | null;
  capacityGroup?: string | null;
}

export interface Partner {
  id: string;
  name: string;
  commission: number;
}

export interface SlotInfo {
  time: string;
  available: number;
  capacity: number;
  blocked: boolean;
  past?: boolean;
}
