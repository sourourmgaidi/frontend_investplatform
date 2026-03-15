import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Role } from '../../shared/models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: Role[] = route.data?.['roles'] || [];
  const userRole = authService.getUserRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  if (authService.isLoggedIn()) {
    router.navigate(['/access-denied']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};