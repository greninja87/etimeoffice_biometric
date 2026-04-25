"""
etimeoffice_biometric/api.py
─────────────────────────────
Whitelisted API methods called from the Biometric Fetch page.
All methods require System Manager role.
"""
import datetime

import frappe
from frappe import _


# ─── Guards ───────────────────────────────────────────────────────────────────

def _require_system_manager():
    if not frappe.has_permission("Biometric Settings", "write"):
        frappe.throw(_("Not permitted. System Manager role required."), frappe.PermissionError)


# ─── Settings ─────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_settings():
    """Return current Biometric Settings (password omitted)."""
    _require_system_manager()
    s = frappe.get_single("Biometric Settings")
    return {
        "corporate_id":       s.corporate_id or "",
        "username":           s.username or "",
        "api_base_url":       s.api_base_url or "https://api.etimeoffice.com",
        "auto_fetch_enabled": int(s.auto_fetch_enabled or 0),
        "fetch_schedule":     s.fetch_schedule or "Every Hour",
        "custom_cron":        s.custom_cron or "",
        "sync_days_back":     int(s.sync_days_back or 1),
        "last_sync_time":     str(s.last_sync_time) if s.last_sync_time else "",
    }


@frappe.whitelist()
def save_settings(
    corporate_id,
    username,
    password=None,
    api_base_url=None,
    auto_fetch_enabled=0,
    fetch_schedule="Every Hour",
    custom_cron=None,
    sync_days_back=1,
):
    """Persist Biometric Settings."""
    _require_system_manager()

    s = frappe.get_single("Biometric Settings")
    s.corporate_id       = corporate_id
    s.username           = username
    s.api_base_url       = api_base_url or "https://api.etimeoffice.com"
    s.auto_fetch_enabled = int(auto_fetch_enabled)
    s.fetch_schedule     = fetch_schedule
    s.custom_cron        = custom_cron or ""
    s.sync_days_back     = int(sync_days_back or 1)

    if password:
        s.password = password  # stored encrypted by Frappe

    s.save(ignore_permissions=True)
    return {"success": True, "message": "Settings saved successfully."}


# ─── Connection test ──────────────────────────────────────────────────────────

@frappe.whitelist()
def test_connection():
    """Ping the eTimeOffice API with current credentials."""
    _require_system_manager()
    settings = frappe.get_single("Biometric Settings")

    if not settings.corporate_id:
        return {"success": False, "message": "Please configure and save API settings first."}

    from etimeoffice_biometric.utils.etimeoffice import test_api_connection
    success, message = test_api_connection(settings)
    return {"success": success, "message": message}


# ─── Manual fetch ─────────────────────────────────────────────────────────────

@frappe.whitelist()
def manual_fetch(emp_code="ALL", from_date=None, to_date=None):
    """
    Trigger a manual biometric data sync.

    Args:
        emp_code  : "ALL" or a specific Employee ID
        from_date : "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
        to_date   : "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
    """
    _require_system_manager()

    from etimeoffice_biometric.utils.sync import fetch_and_sync, _ensure_datetime

    fd = _ensure_datetime(from_date) if from_date else None
    td = _ensure_datetime(to_date)   if to_date   else None

    # Make to_date inclusive of the full day when only a date is given
    if to_date and len(str(to_date)) == 10:
        td = td + datetime.timedelta(days=1, seconds=-1)

    log = fetch_and_sync(emp_code=emp_code, from_date=fd, to_date=td)

    return {
        "success":         log.status != "Failed",
        "status":          log.status,
        "records_fetched": log.records_fetched  or 0,
        "records_created": log.records_created  or 0,
        "records_skipped": log.records_skipped  or 0,
        "not_found":       log.records_not_found or 0,
        "error":           log.error_message    or "",
        "log_name":        log.name,
    }


# ─── Sync logs ────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_sync_logs(limit=20):
    """Return the most recent Biometric Sync Log entries."""
    _require_system_manager()
    logs = frappe.get_all(
        "Biometric Sync Log",
        fields=[
            "name", "sync_time", "employee_filter",
            "from_date", "to_date", "status",
            "records_fetched", "records_created",
            "records_skipped", "records_not_found",
            "error_message",
        ],
        order_by="sync_time desc",
        limit=int(limit),
    )
    return logs


# ─── Employee list ────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_employees():
    """Return active employees for the manual-fetch dropdown."""
    _require_system_manager()
    employees = frappe.get_all(
        "Employee",
        fields=["name", "employee_name"],
        filters={"status": "Active"},
        order_by="employee_name asc",
        limit=1000,
    )
    return employees


# ─── Fetch log detail ─────────────────────────────────────────────────────────

@frappe.whitelist()
def get_checkins_for_log(log_name):
    """
    Return Employee Checkin records created during a specific sync window.
    Uses the from_date / to_date stored in the Biometric Sync Log.
    """
    _require_system_manager()

    log = frappe.get_doc("Biometric Sync Log", log_name)
    if not log.from_date or not log.to_date:
        return []

    filters = {
        "time": ["between", [log.from_date, log.to_date]],
    }
    if log.employee_filter and log.employee_filter != "ALL":
        filters["employee"] = log.employee_filter

    return frappe.get_all(
        "Employee Checkin",
        fields=["name", "employee", "employee_name", "time", "log_type", "device_id"],
        filters=filters,
        order_by="employee asc, time asc",
        limit=500,
    )
