# Privacy Policy — Etimeoffice Biometric

**Last updated: April 2025**

## Overview

Etimeoffice Biometric ("the App") is a Frappe/ERPNext application developed by Yash Chaurasia. This policy explains what data the App handles and how it is used.

## Data Collected

The App processes the following data:

- **Biometric punch records** fetched from the eTimeOffice API (employee ID, punch timestamps, machine ID)
- **API credentials** (Corporate ID, username, password) stored encrypted within your ERPNext instance
- **Employee Checkin records** created within your ERPNext instance

## How Data is Used

- Biometric punch data is used solely to create Employee Checkin records in ERPNext/HRMS
- API credentials are stored locally on your ERPNext server and never transmitted to any third party
- Sync logs are stored within your ERPNext database for audit purposes

## Data Storage

All data is stored on **your own ERPNext server**. The App does not send any data to external servers other than the eTimeOffice API endpoint you configure.

## Third-Party Services

The App communicates with the **eTimeOffice API** (`api.etimeoffice.com`) using credentials provided by you. Please refer to eTimeOffice's own privacy policy for their data handling practices.

## Data Retention

Sync logs are automatically cleaned up after 90 days. Biometric checkin records follow your ERPNext data retention settings.

## Contact

For privacy-related questions, contact: chaurasiayash351@gmail.com
