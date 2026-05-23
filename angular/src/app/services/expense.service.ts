import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Expense, ExpenseCreatePayload, PresignedUploadResponse } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = environment.apiUrl.replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  listExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`);
  }

  createExpense(payload: ExpenseCreatePayload): Observable<{ expense: Expense }> {
    return this.http.post<{ expense: Expense }>(`${this.apiUrl}/expenses`, payload);
  }

  deleteExpense(expenseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/expenses/${expenseId}`);
  }

  getPresignedUploadUrl(filename: string, contentType: string): Observable<PresignedUploadResponse> {
    return this.http.post<PresignedUploadResponse>(`${this.apiUrl}/uploads/presigned-url`, {
      filename,
      contentType,
    });
  }

  getPresignedViewUrl(s3Key: string): Observable<{ viewUrl: string }> {
    return this.http.post<{ viewUrl: string }>(`${this.apiUrl}/uploads/presigned-view`, {
      s3Key,
    });
  }
}
