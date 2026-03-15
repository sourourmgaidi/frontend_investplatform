import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Ne pas ajouter le token pour les requêtes vers Keycloak (login/logout)
  const isKeycloakRequest = req.url.includes('localhost:9090');

  const token = localStorage.getItem('auth_token');

  if (token && !isKeycloakRequest) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};