import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { SessionExpiredDialogComponent } from '../../shared/components/session-expired-dialog/session-expired-dialog';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 302) {
        dialog.open(SessionExpiredDialogComponent, {
          disableClose: true, // User must click the button to close
          width: '400px'
        });
      }
      return throwError(() => error);
    })
  );
};
