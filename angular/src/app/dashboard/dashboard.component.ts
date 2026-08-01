import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../services/expense.service';
import { Expense } from '../models/expense.model';
import { UtilitiesService } from '../shared/utilities.service';

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatToolbarModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  expenses: Expense[] = [];
  isLoading = false;
  totalSpent = 0;
  allTimeTotal = 0;
  expenseCount = 0;
  selectedMonth = this.getDefaultMonthValue();
  selectedMonthLabel = '';
  categoryBreakdown: CategorySummary[] = [];
  recentExpenses: Expense[] = [];
  maxCategoryTotal = 0;

  constructor(
    private expenseService: ExpenseService, 
    private utilitiesService: UtilitiesService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadExpenses();
  }

  async loadExpenses(): Promise<void> {
    this.isLoading = true;
    try {
      const result = await firstValueFrom(this.expenseService.listExpenses());
      this.expenses = result;
      this.computeSummary();
    } catch (error) {
      console.error('Unable to load expenses for dashboard', error);
    } finally {
      this.isLoading = false;
    }
  }

  getBarWidth(total: number): number {
    if (!this.maxCategoryTotal) {
      return 0;
    }

    return Math.max(10, (total / this.maxCategoryTotal) * 100);
  }

  onMonthChange(value: string): void {
    this.selectedMonth = value;
    this.computeSummary();
  }

  shiftMonth(offset: number): void {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month - 1 + offset, 1);
    this.selectedMonth = this.toMonthValue(nextDate);
    this.computeSummary();
  }

  private computeSummary(): void {
    const [selectedYear, selectedMonth] = this.selectedMonth.split('-').map(Number);
    const selectedMonthIndex = selectedMonth - 1;

    this.allTimeTotal = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const filteredExpenses = this.expenses.filter((expense) => {
      return this.utilitiesService.isInSelectedMonth(expense.date, selectedYear, selectedMonth);
    });

    this.totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    this.expenseCount = filteredExpenses.length;
    this.selectedMonthLabel = new Date(selectedYear, selectedMonthIndex).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const breakdownMap = new Map<string, { total: number; count: number }>();
    filteredExpenses.forEach((expense) => {
      const current = breakdownMap.get(expense.category) ?? { total: 0, count: 0 };
      current.total += expense.amount;
      current.count += 1;
      breakdownMap.set(expense.category, current);
    });

    this.categoryBreakdown = Array.from(breakdownMap.entries())
      .map(([category, values]) => ({ category, total: values.total, count: values.count }))
      .sort((left, right) => right.total - left.total);

    this.maxCategoryTotal = this.categoryBreakdown.reduce((max, item) => Math.max(max, item.total), 0);

    this.recentExpenses = [...filteredExpenses]
      .sort((left, right) => this.utilitiesService.getLocalDate(right.date).getTime() - this.utilitiesService.getLocalDate(left.date).getTime())
      .slice(0, 5);
  }

  private getDefaultMonthValue(): string {
    const now = new Date();
    return this.toMonthValue(now);
  }

  private toMonthValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
