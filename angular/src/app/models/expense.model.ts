export interface Expense {
  expenseId: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  receiptS3Key?: string | null;
  createdAt: string;
}

export interface ExpenseCreatePayload {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  receiptS3Key?: string | null;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
}
