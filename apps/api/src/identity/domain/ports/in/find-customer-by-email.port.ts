export interface FindCustomerByEmailQuery {
  email: string;
}

export interface CustomerLookupResult {
  userId: string;
  fullName: string;
  email: string;
}

export interface FindCustomerByEmailUseCasePort {
  execute(query: FindCustomerByEmailQuery): Promise<CustomerLookupResult | null>;
}
