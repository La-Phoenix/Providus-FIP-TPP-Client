export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface Customer {
  id: string;
  providusCustomerId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  nationality: string;
  residentCountry?: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  customerId: string;
  accountNumber: string;
  accountName: string;
  balanceInKobo: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface CustomerDetail {
  customer: Customer;
  account: Account;
  cards: CardDto[];
  totalCardBalanceInKobo: number;
  totalAccountBalanceInKobo: number;
  combinedBalanceInKobo: number;
}

export interface OnboardCustomerRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email?: string;
  address?: string;
  nationality: string;
  residentCountry?: string;
  countryCode: string;
}

export interface OnboardCustomerResponse {
  id: string;
  providusCustomerId: string;
  existingCustomer: boolean;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface Card {
  id: string;
  customerId: string;
  providusCardId: string;
  maskedPan: string;
  nameOnCard: string;
  expiryDate: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardDto {
  localCardId?: string;
  customerId?: string;
  providusCardId: string;
  maskedPan: string;
  nameOnCard: string;
  expiryDate: string;
  balanceInKobo: number;
  balanceInNaira: number;
  status: string;
}

export interface CardSyncResultDto {
  totalRetrieved: number;
  synchronizedCount: number;
  updatedCount: number;
  createdCount: number;
  unlinkedCount: number;
  cards: CardDto[];
}

export interface OptionItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface CardProfilesResponse {
  profiles: OptionItem[];
  cardProfiles: OptionItem[];
}

export interface CardRequestPayload {
  customerId?: string;
  profileId: string;
  cardProfileId: string;
  nameOnCard?: string;
  nameOnCards?: string[];
  instantQty?: number;
}

export interface FundCardPayload {
  cardId: string;
  amount: number; // Major unit (Naira) for API request DTO
  transactionRef?: string;
}

export interface LoadCardResponse {
  successful: boolean;
  requestNo?: string;
  code?: string;
  message?: string;
  providusCardId?: string;
  newBalance?: number;
}

export interface CardTransaction {
  transactionDate?: string;
  maskedPan?: string;
  cardholder?: string;
  amount?: number;
  amountInKobo?: number;
  currency?: string;
  impactType?: string;
  tranType?: string;
  status?: number;
  terminalId?: string;
  merchantNameLoc?: string;
  merchantId?: string;
  rrn?: string;
}

export interface FundingTransaction {
  transactionDate?: string;
  maskedPan?: string;
  cardholder?: string;
  amount?: number;
  amountInKobo?: number;
  currency?: string;
  impactType?: string;
  tranType?: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
  result: string;
  correlationId?: string;
}

export interface FipRequest {
  id: string;
  operation: string;
  correlationId: string;
  providusRequestNo?: string;
  httpStatusCode: number;
  success: boolean;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  totalCards: number;
  activeCards: number;
  blockedCards: number;
  totalCardBalanceKobo: number;
  totalCardBalanceNaira: number;
  fundingVolume24hLoadKobo: number;
  fundingVolume24hLoadNaira: number;
  fundingVolume24hUnloadKobo: number;
  fundingVolume24hUnloadNaira: number;
}
