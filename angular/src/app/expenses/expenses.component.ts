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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ExpenseService } from '../services/expense.service';
import { Expense, ExpenseCreatePayload } from '../models/expense.model';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-expenses',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCardModule,
        MatDialogModule,
        MatIconModule,
    ],
    templateUrl: './expenses.component.html',
    styleUrls: [
        './expenses.component.scss',
    ]
})
export class ExpensesComponent {
  categories = ['Dining', 'Grocery', 'Travel', 'Utilities', 'Office', 'Other'];
  expenses: Expense[] = [];
  isLoading = false;
  isSubmitting = false;
  uploadMessage = '';
  selectedFile: File | null = null;
  receiptKey: string | null = null;
  expandedExpenseId: string | null = null;
  receiptUrls: Map<string, string> = new Map();
  newExpense: Partial<ExpenseCreatePayload> = {
    merchant: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().slice(0, 10),
    category: 'Dining',
    receiptS3Key: null,
  };

  constructor(public auth: AuthService, private expenseService: ExpenseService, private dialog: MatDialog) {
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
        category: 'Dining',
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

  async deleteExpense(expenseId: string, merchantName: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { merchant: merchantName },
      width: '400px',
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) {
      return;
    }

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

  async editExpense(expense: Expense): Promise<void> {
    // For simplicity, we'll just log the expense to be edited.
    // In a real application, you would open a dialog similar to the create expense form,
    // pre-populate it with the existing expense data, and allow the user to make changes.
    console.log('Edit expense', expense);
  }

  toggleExpand(expenseId: string, receiptS3Key: string | null): void {
    if (this.expandedExpenseId === expenseId) {
      this.expandedExpenseId = null;
    } else {
      this.expandedExpenseId = expenseId;
      if (receiptS3Key && !this.receiptUrls.has(receiptS3Key)) {
        this.loadReceiptUrl(receiptS3Key);
      }
    }
  }

  private async loadReceiptUrl(s3Key: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.expenseService.getPresignedViewUrl(s3Key));
      this.receiptUrls.set(s3Key, response.viewUrl);
    } catch (error) {
      console.error('Could not load receipt URL', error);
    }
  }
}
