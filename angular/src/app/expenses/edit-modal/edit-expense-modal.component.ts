// This component is to display a modal to edit an existing expense. 

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Expense } from '../../models/expense.model';
import { EXPENSE_CATEGORIES } from 'src/app/models/constants';

@Component({
    selector: 'app-edit-expense-modal',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDialogModule
    ],
    templateUrl: './edit-expense-modal.component.html',
    styleUrls: ['./edit-expense-modal.component.scss']
})
export class EditExpenseModalComponent {
    categories = EXPENSE_CATEGORIES;
    editData: Partial<Expense>;
    
    constructor(
        public dialogRef: MatDialogRef<EditExpenseModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Expense
    ) {
        // Initialize editData with a copy of the expense data
        this.editData = { ...data };
    }

    saveChanges(): void {
        // Close dialog and return the updated expense data
        this.dialogRef.close(this.editData);
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }
}