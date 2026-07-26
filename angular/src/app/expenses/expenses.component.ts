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
import { EditExpenseModalComponent } from './edit-modal/edit-expense-modal.component';
import { EXPENSE_CATEGORIES } from '../models/constants';

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
  categories = EXPENSE_CATEGORIES;
  allExpenses: Expense[] = [];
  expenses: Expense[] = [];
  isLoading = false;
  isSubmitting = false;
  uploadMessage = '';
  selectedFile: File | null = null;
  receiptKey: string | null = null;
  expandedExpenseId: string | null = null;
  receiptUrls: Map<string, string> = new Map();
  selectedMonth = this.getDefaultMonthValue();
  selectedMonthLabel = '';
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
      this.allExpenses = result;
      this.applyMonthFilter();
    } catch (error) {
      console.error('Unable to load expenses', error);
    } finally {
      this.isLoading = false;
    }
  }

  onMonthChange(value: string): void {
    this.selectedMonth = value;
    this.applyMonthFilter();
  }

  shiftMonth(offset: number): void {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + offset, 1);
    this.selectedMonth = this.toMonthValue(nextDate);
    this.applyMonthFilter();
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
      this.uploadMessage = 'Receipt uploaded. Processing with AI...';

      // Load initial expense count
      await this.loadExpenses();
      const initialCount = this.expenses.length;

      // Poll for new expense (up to 30 seconds)
      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        await this.loadExpenses();
        
        if (this.expenses.length > initialCount) {
          this.uploadMessage = 'Receipt processed and expense created!';
          this.selectedFile = null;
          this.receiptKey = null;
          return;
        }
      }

      // Timeout — polling didn't find new expense
      this.uploadMessage = 'Receipt uploaded. Processing may take longer. Check back soon.';
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
    const dialogRef = this.dialog.open(EditExpenseModalComponent, {
      data: expense,
      width: '400px',
    });

    const updatedExpense = await firstValueFrom(dialogRef.afterClosed());
    if (!updatedExpense) {
      return;
    }

    this.isSubmitting = true;
    try {
      await firstValueFrom(this.expenseService.updateExpense(expense.expenseId, updatedExpense));
      await this.loadExpenses();
    } catch (error) {
      console.error('Could not update expense', error);
    } finally {
      this.isSubmitting = false;
    }
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

  private applyMonthFilter(): void {
    const [selectedYear, selectedMonth] = this.selectedMonth.split('-').map(Number);
    const selectedMonthIndex = selectedMonth - 1;

    this.expenses = this.allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === selectedYear && expenseDate.getMonth() === selectedMonthIndex;
    });

    this.selectedMonthLabel = new Date(selectedYear, selectedMonthIndex).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  private getDefaultMonthValue(): string {
    return this.toMonthValue(new Date());
  }

  private toMonthValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
