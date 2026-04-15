# Changelog

## v1.0.0 — 2024-01-01

### Initial Release
- Manual biometric data fetch from eTimeOffice API
- Automatic scheduled sync (hourly, 2h, 4h, 6h, 12h, daily, custom cron)
- First punch = IN, last punch = OUT logic
- Single-punch days handled as IN only
- Machine ID (mcid) stored on each Employee Checkin record
- Duplicate prevention — won't create duplicate records
- Full sync audit log via Biometric Sync Log DocType
- Biometric Settings DocType for API credentials and scheduler config
- Biometric Data Fetch page — manual fetch, scheduler control, sync history
- System Manager role-based access control
- Compatible with ERPNext v15 and v16
