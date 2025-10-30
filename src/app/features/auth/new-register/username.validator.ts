import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap, first } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

export function usernameAvailabilityValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.errors) {
      return of(null);
    }

    return of(control.value).pipe(
      debounceTime(500),
      switchMap((value) =>
        authService.checkUsernameAvailability(value).pipe(
          map(response => {
            return response.data ? null : { notAvailable: 'Username is not available.' };
          }),
          catchError(() => of({ apiError: 'Could not verify username. Please try again.' }))
        )
      ),
      first()
    );
  };
}