// Copyright (c) 2024, Yash Chaurasia and contributors
frappe.ui.form.on("Biometric Sync Log", {
    refresh(frm) {
        if (frm.doc.status === "Failed") {
            frm.dashboard.set_headline_alert(
                `<div class="alert alert-danger">${frm.doc.error_message || "Sync failed"}</div>`
            );
        }
    },
});
