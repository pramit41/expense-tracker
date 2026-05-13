import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../auth/auth.service';
import { ExpenseService } from './expense.service';
import { Expense, ExpenseCreatePayload } from './expense.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Expense Tracker</span>
      <span class="spacer"></span>
      <span class="user-email">{{ auth.currentUser()?.email }}</span>
      <button mat-stroked-button (click)="auth.logout()">Sign out</button>
    </mat-toolbar>

    <div class="page">
      <mat-card class="panel">
        <h2>Upload receipt image</h2>
        <p>Select a receipt image, then upload it to S3.
          After upload, the receipt key will be attached when you save an expense.</p>

        <input type="file" accept="image/*" (change)="onFileSelected($event)" />
        <button mat-flat-button color="primary" (click)="uploadReceipt()" [disabled]="!selectedFile || isSubmitting">
          Upload receipt
        </button>

        <p class="message" *ngIf="uploadMessage">{{ uploadMessage }}</p>
        <p *ngIf="receiptKey">Uploaded receipt key: <code>{{ receiptKey }}</code></p>
      </mat-card>

      <mat-card class="panel">
        <h2>Add manual expense</h2>
        <form (ngSubmit)="createExpense()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Merchant</mat-label>
            <input matInput name="merchant" required [(ngModel)]="newExpense.merchant" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Amount</mat-label>
            <input matInput type="number" name="amount" required [(ngModel)]="newExpense.amount" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Currency</mat-label>
            <mat-select name="currency" required [(ngModel)]="newExpense.currency">
              <mat-option value="USD">USD</mat-option>
              <mat-option value="EUR">EUR</mat-option>
              <mat-option value="GBP">GBP</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date</mat-label>
            <input matInput type="date" name="date" required [(ngModel)]="newExpense.date" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category</mat-label>
            <mat-select name="category" required [(ngModel)]="newExpense.category">
              <mat-option *ngFor="let option of categories" [value]="option">{{ option }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="isSubmitting || !newExpense.merchant || !newExpense.amount || !newExpense.date || !newExpense.category">
            Save expense
          </button>
        </form>
      </mat-card>

      <mat-card class="panel">
        <h2>Your expenses</h2>
        <p *ngIf="isLoading">Loading expenses...</p>
        <p *ngIf="!isLoading && !expenses.length">You don't have any expenses yet.</p>

        <table class="expenses-table" *ngIf="expenses.length">
          <thead>
            <tr>
              <th>Merchant</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Category</th>
              <th>Receipt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let expense of expenses">
              <td>{{ expense.merchant }}</td>
              <td>{{ expense.amount | number:'1.2-2' }} {{ expense.currency }}</td>
              <td>{{ expense.date }}</td>
              <td>{{ expense.category }}</td>
              <td>{{ expense.receiptS3Key ? 'Uploaded' : 'None' }}</td>
              <td>
                <button mat-stroked-button color="warn" (click)="deleteExpense(expense.expenseId)" [disabled]="isSubmitting">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .spacer { flex: 1 1 auto; }
      .user-email { font-size: 0.9rem; margin-right: 1rem; opacity: 0.85; }
      .page { max-width: 960px; margin: 2rem auto; display: grid; gap: 1.5rem; }
      .panel { padding: 1.5rem; }
      .full-width { width: 100%; }
      .expenses-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      .expenses-table th,
      .expenses-table td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e0e0e0; }
      .message { margin-top: 1rem; color: #444; }
    `,
  ],
})
export class ExpensesComponent {
  categories = ['Food', 'Travel', 'Utilities', 'Office', 'Other'];
  expenses: Expense[] = [];
  isLoading = false;
  isSubmitting = false;
  uploadMessage = '';
  selectedFile: File | null = null;
  receiptKey: string | null = null;
  newExpense: Partial<ExpenseCreatePayload> = {
    merchant: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().slice(0, 10),
    category: 'Food',
    receiptS3Key: null,
  };

  constructor(public auth: AuthService, private expenseService: ExpenseService) {
    this.loadExpenses();
  }

  async loadExpenses(): Promise<void> {
    this.isLoading = true;
    try {
      const result = await firstValueFrom(this.expenseService.listExpenses());
      this.expenses = result;
    } catch (error) {
      console.error('Unable to load expenses', error);
    } finally {
      this.isLoading = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.uploadMessage = this.selectedFile ? `Selected ${this.selectedFile.name}` : '';
  }

  async uploadReceipt(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file first.';
      return;
    }

    this.isSubmitting = true;
    this.uploadMessage = 'Preparing upload...';

    try {
      const presigned = await firstValueFrom(
        this.expenseService.getPresignedUploadUrl(this.selectedFile.name, this.selectedFile.type || 'application/octet-stream')
      );

      const response = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        body: this.selectedFile,
        headers: {
          'Content-Type': this.selectedFile.type || 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      this.receiptKey = presigned.key;
      this.uploadMessage = 'Receipt uploaded. Save an expense to attach this receipt.';
    } catch (error) {
      console.error('Receipt upload failed', error);
      this.uploadMessage = 'Receipt upload failed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async createExpense(): Promise<void> {
    if (!this.newExpense.merchant || !this.newExpense.amount || !this.newExpense.date || !this.newExpense.category) {
      return;
    }

    this.isSubmitting = true;
    try {
      const payload: ExpenseCreatePayload = {
        merchant: this.newExpense.merchant,
        amount: Number(this.newExpense.amount),
        currency: this.newExpense.currency || 'USD',
        date: this.newExpense.date,
        category: this.newExpense.category,
        receiptS3Key: this.receiptKey ?? null,
      };

      await firstValueFrom(this.expenseService.createExpense(payload));
      this.newExpense = {
        merchant: '',
        amount: 0,
        currency: 'USD',
        date: new Date().toISOString().slice(0, 10),
        category: 'Food',
        receiptS3Key: null,
      };
      this.selectedFile = null;
      this.receiptKey = null;
      this.uploadMessage = 'Expense saved successfully.';
      await this.loadExpenses();
    } catch (error) {
      console.error('Could not save expense', error);
      this.uploadMessage = 'Could not save the expense. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    this.isSubmitting = true;
    try {
      await firstValueFrom(this.expenseService.deleteExpense(expenseId));
      this.expenses = this.expenses.filter((expense) => expense.expenseId !== expenseId);
    } catch (error) {
      console.error('Could not delete expense', error);
    } finally {
      this.isSubmitting = false;
    }
  }
}
