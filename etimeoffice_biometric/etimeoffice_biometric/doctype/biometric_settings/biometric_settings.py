# Copyright (c) 2024, Yash Chaurasia and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class BiometricSettings(Document):
    def validate(self):
        if self.fetch_schedule == "Custom" and not self.custom_cron:
            frappe.throw(
                "Please enter a Custom Cron Expression when schedule is set to 'Custom'."
            )
        if self.custom_cron:
            self._validate_cron()

    def _validate_cron(self):
        try:
            from croniter import croniter
            if not croniter.is_valid(self.custom_cron):
                frappe.throw(
                    f"'{self.custom_cron}' is not a valid cron expression. "
                    "Example: '0 */4 * * *' for every 4 hours."
                )
        except ImportError:
            pass  # croniter not installed yet; skip validation silently
