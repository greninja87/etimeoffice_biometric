# Etimeoffice Biometric

Fetch biometric punch data from the **eTimeOffice API** and automatically create ERPNext **Employee Checkin** records.

> A Frappe/ERPNext app by [Yash Chaurasia](mailto:chaurasiayash351@gmail.com)

## Features

- Manual fetch by employee / date range from the eTimeOffice API
- Automatic scheduled sync (configurable: hourly, 2h, 4h, 6h, 12h, daily, custom cron)
- First punch → IN, last punch → OUT (single punch → IN only)
- Machine ID (mcid) stored on each checkin record
- Duplicate prevention — won't create duplicate Employee Checkin records
- Full sync audit log via Biometric Sync Log DocType
- System Manager role-based access control

## Requirements

- Frappe Framework v15 or v16
- ERPNext with HRMS module enabled
- Active eTimeOffice account with API credentials

## Usage

1. Go to **Biometric Settings** → enter your eTimeOffice API credentials → click **Test Connection**
2. Go to **Biometric Data Fetch** page → **Manual Fetch** tab → select employee + date range → **Fetch & Sync**
3. Open the **Scheduler** tab to enable automatic fetching on a cron schedule
4. View sync history in **Biometric Sync Log**

## API Details

- Endpoint: `https://api.etimeoffice.com/api/DownloadPunchDataMCID`
- Auth: `Authorization: Base64(corporateid:username:password:true)`
- Employee code maps to ERPNext Employee ID

## App Structure

```
etimeoffice_biometric/
├── hooks.py                     ← Scheduler registration
├── api.py                       ← Whitelisted REST methods
├── tasks.py                     ← Scheduled job logic
├── utils/
│   ├── etimeoffice.py           ← eTimeOffice API HTTP client
│   └── sync.py                  ← Core IN/OUT sync logic
└── etimeoffice_biometric/
    ├── doctype/
    │   ├── biometric_settings/  ← Settings DocType (API + scheduler config)
    │   └── biometric_sync_log/  ← Audit log DocType
    └── page/
        └── biometric_fetch/     ← Management UI page
```

## License

MIT — see [LICENSE](LICENSE)

## Author

**Yash Chaurasia** — chaurasiayash351@gmail.com
