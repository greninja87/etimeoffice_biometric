app_name = "etimeoffice_biometric"
app_title = "Etimeoffice Biometric"
app_publisher = "Yash Chaurasia"
app_description = "Biometric Attendance Integration with eTimeOffice API for ERPNext/HRMS"
app_email = "chaurasiayash351@gmail.com"
app_license = "MIT"
app_version = "1.0.0"
app_logo_url = "/assets/etimeoffice_biometric/images/app_icon.png"
frappe_version = ">=15.0.0 <17.0.0"

# ─── Includes ────────────────────────────────────────────────────────────────
# app_include_css = "/assets/etimeoffice_biometric/css/etimeoffice_biometric.css"
# app_include_js = "/assets/etimeoffice_biometric/js/etimeoffice_biometric.js"

# ─── Scheduled Tasks ─────────────────────────────────────────────────────────
# The hourly task checks the stored cron/schedule setting and decides whether
# to run the actual sync — so the user can change schedule from the UI without
# needing a bench restart.
scheduler_events = {
    "hourly": [
        "etimeoffice_biometric.tasks.run_scheduled_sync"
    ],
    # Also run the midnight daily cleanup check
    "daily": [
        "etimeoffice_biometric.tasks.daily_cleanup"
    ],
}

# ─── Jinja ───────────────────────────────────────────────────────────────────
jinja = {
    "methods": [],
    "filters": [],
}

# ─── Installation ────────────────────────────────────────────────────────────
# after_install = "etimeoffice_biometric.install.after_install"

# ─── Document Events ─────────────────────────────────────────────────────────
# doc_events = {}

# ─── Override DocTypes ───────────────────────────────────────────────────────
# override_doctype_class = {}
