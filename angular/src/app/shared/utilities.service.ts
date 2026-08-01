// This is a utility service that provides helper functions for the application.
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilitiesService {
    constructor() {}
    // Converts a date string in ISO format to a Date object in local time.
    getLocalDate(dateValue: string): Date {
        const [datePart] = dateValue.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    
    // Checks if a given date string falls within the selected year and month.
    isInSelectedMonth(dateValue: string, selectedYear: number, selectedMonth: number): boolean {
        const expenseDate = this.getLocalDate(dateValue);
        return expenseDate.getFullYear() === selectedYear && expenseDate.getMonth() === selectedMonth - 1;
    }
}