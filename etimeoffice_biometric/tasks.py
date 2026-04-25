"""
etimeoffice_biometric/tasks.py
──────────────────────────────
Scheduled task entry points registered in hooks.py.
"""
import frappe
from frappe.utils import now_datetime


def run_scheduled_sync():
    """
    Called by the Frappe hourly scheduler.
    Reads the fetch_schedule setting from Biometric Settings and decides
    whether to actually execute the sync. This avoids needing a bench
    restart when the user changes the schedule from the UI.
    """
    try:
        settings = frappe.get_single("Biometric Settings")

        if not settings.auto_fetch_enabled:
            return  # Scheduler disabled by the user

        now = now_datetime()
        should_run = _check_schedule(settings, now)

        if not should_run:
            return

        frappe.logger("biometric").info(
            f"[Biometric] Scheduled sync starting at {now} "
            f"(schedule: {settings.fetch_schedule})"
        )

        from etimeoffice_biometric.utils.sync import fetch_and_sync

        # Determine from_date: use last_sync_time or fall back to sync_days_back
        if settings.last_sync_time:
            from_date = settings.last_sync_time
        else:
            import datetime
            days_back = int(settings.sync_days_back or 1)
            from_date = now - datetime.timedelta(days=days_back)

        to_date = now

        log = fetch_and_sync(emp_code="ALL", from_date=from_date, to_date=to_date)

        # Update last sync time only on success/partial
        if log.status in ("Success", "Partial"):
            frappe.db.set_single_value("Biometric Settings", "last_sync_time", now)

        frappe.logger("biometric").info(
            f"[Biometric] Scheduled sync done — status: {log.status}, "
            f"created: {log.records_created}, skipped: {log.records_skipped}"
        )

    except Exception:
        frappe.log_error(frappe.get_traceback(), "[Biometric] Scheduled Sync Error")


def daily_cleanup():
    """
    Optional daily cleanup: delete Biometric Sync Log entries older than
    90 days to keep the table lean.
    """
    try:
        import datetime
        cutoff = now_datetime() - datetime.timedelta(days=90)
        old_logs = frappe.get_all(
            "Biometric Sync Log",
            filters={"sync_time": ("<", cutoff)},
            pluck="name",
        )
        for name in old_logs:
            frappe.delete_doc("Biometric Sync Log", name, ignore_permissions=True)
        if old_logs:
            frappe.logger("biometric").info(
                f"[Biometric] Cleaned up {len(old_logs)} old sync logs."
            )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "[Biometric] Daily Cleanup Error")


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _check_schedule(settings, now):
    """Return True if the sync should run at the given datetime."""
    schedule = settings.fetch_schedule or "Every Hour"

    if schedule == "Every Hour":
        return True  # Task is already hourly

    if schedule == "Every 2 Hours":
        return now.hour % 2 == 0 and now.minute < 5

    if schedule == "Every 4 Hours":
        return now.hour % 4 == 0 and now.minute < 5

    if schedule == "Every 6 Hours":
        return now.hour % 6 == 0 and now.minute < 5

    if schedule == "Every 12 Hours":
        return now.hour % 12 == 0 and now.minute < 5

    if schedule == "Daily":
        return now.hour == 0 and now.minute < 5

    if schedule == "Custom" and settings.custom_cron:
        try:
            import datetime as dt
            from croniter import croniter
            cron = croniter(settings.custom_cron, now - dt.timedelta(hours=1))
            next_run = cron.get_next(dt.datetime)
            # Run if the next scheduled time is within the past hour window
            return (next_run - now).total_seconds() <= 0 or \
                   abs((next_run - now).total_seconds()) < 3600
        except Exception:
            frappe.log_error(frappe.get_traceback(), "[Biometric] Cron Parse Error")
            return False

    return True
