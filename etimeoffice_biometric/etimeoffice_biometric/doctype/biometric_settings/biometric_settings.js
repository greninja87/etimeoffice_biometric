// Copyright (c) 2024, Yash Chaurasia and contributors
// For license information, please see license.txt

frappe.ui.form.on("Biometric Settings", {
    refresh(frm) {
        frm.add_custom_button(__("Test Connection"), function () {
            frappe.call({
                method: "etimeoffice_biometric.api.test_connection",
                freeze: true,
                freeze_message: __("Testing connection..."),
                callback(r) {
                    if (r.message && r.message.success) {
                        frappe.msgprint({
                            title: __("Connection Successful"),
                            indicator: "green",
                            message: r.message.message,
                        });
                    } else {
                        frappe.msgprint({
                            title: __("Connection Failed"),
                            indicator: "red",
                            message: (r.message && r.message.message) || __("Unknown error"),
                        });
                    }
                },
            });
        }, __("Actions"));

        frm.add_custom_button(__("Open Biometric Fetch Page"), function () {
            frappe.set_route("biometric-fetch");
        }, __("Actions"));
    },

    fetch_schedule(frm) {
        if (frm.doc.fetch_schedule !== "Custom") {
            frm.set_value("custom_cron", "");
        }
    },
});
