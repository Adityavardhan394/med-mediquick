# Security Configuration Guide

## Environment Variables
1. Create a `.env` file based on `.env.example`
2. Generate a strong JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. Set restrictive CORS origins
4. Store the Firebase service account key securely

## Google Maps API Key Restrictions
1. Go to Google Cloud Console
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Edit your API key and add these restrictions:
   - Application restrictions:
     - HTTP referrers (web sites)
     - Add your domain(s)
   - API restrictions:
     - Maps JavaScript API
     - Geocoding API
     - Places API

## Firebase Configuration
1. Firebase Console > Project Settings > General
   - Add your domain to Authorized Domains
2. Authentication:
   - Enable required providers
   - Set authorized domains
3. Cloud Messaging:
   - Generate new Web Push certificates
4. Service Account:
   - Use dedicated service account
   - Grant minimum required permissions
   - Store key securely
   - Rotate regularly

## Production Security Checklist
- [ ] Use HTTPS only
- [ ] Set secure HTTP headers (already configured with helmet)
- [ ] Enable rate limiting (configured)
- [ ] Implement input validation (configured with express-validator)
- [ ] Set up logging (configured with winston)
- [ ] Configure error handling (implemented)
- [ ] Enable compression (use compression middleware)
- [ ] Set up monitoring
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Secure Headers (Already Configured)
```javascript
helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
})
```

## Rate Limiting Configuration
- Window: 15 minutes
- Max requests: 100 per IP
- Customize in .env file

## Error Logging
- Production logs in combined.log
- Error logs in error.log
- Log rotation recommended
- Use log aggregation service in production

## Regular Maintenance
1. Run security audits:
   ```bash
   npm audit
   ```
2. Update dependencies:
   ```bash
   npm update
   ```
3. Check for vulnerabilities:
   ```bash
   npm audit fix
   ```
4. Monitor logs for suspicious activity
5. Rotate API keys and credentials regularly

## Additional Recommendations
1. Use a Web Application Firewall (WAF)
2. Implement DDoS protection
3. Set up automated security scanning
4. Configure automated backups
5. Implement request size limits
6. Use secure session management
7. Implement API versioning
8. Set up health checks and monitoring 