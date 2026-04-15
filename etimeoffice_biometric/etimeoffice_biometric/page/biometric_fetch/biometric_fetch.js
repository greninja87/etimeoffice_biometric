/**
 * biometric_fetch.js
 * Biometric Data Fetch — Frappe/ERPNext Custom Page
 * Compatible: ERPNext v15 & v16
 */

frappe.pages["biometric-fetch"].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Biometric Data Fetch"),
        single_column: true,
    });

    // ── Toolbar actions ──────────────────────────────────────────────────────
    page.set_primary_action(__("Fetch & Sync"), () => app.runFetch(), "refresh");

    page.add_inner_button(__("Biometric Settings"), () => {
        frappe.set_route("Form", "Biometric Settings");
    });

    page.add_inner_button(__("View All Logs"), () => {
        frappe.set_route("List", "Biometric Sync Log");
    });

    // ── Scheduler status indicator (v15 + v16 safe) ──────────────────────────
    const $pill = $(`
        <div id="bio-sched-status" style="display:inline-flex; align-items:center;
             gap:6px; padding: 4px 10px; border-radius: 20px; font-size: 12px;
             font-weight: 600; border: 1px solid var(--border-color, #d1d8dd);
             background: var(--fg-color, #fff); margin-left: 8px;">
            <span id="bio-sched-dot" style="width:8px;height:8px;border-radius:50%;
                  background:#ccc; display:inline-block;"></span>
            <span id="bio-sched-text">Loading…</span>
        </div>
    `).appendTo(page.title_area);

    // ── Page body ─────────────────────────────────────────────────────────────
    $(page.body).html(`
        <div style="padding: 16px 15px 30px;">

            <!-- Last sync info bar -->
            <div id="bio-info-bar" style="display:none; align-items:center; gap:16px;
                 padding: 8px 14px; border-radius: 6px; margin-bottom: 16px;
                 background: var(--fg-color, #fff);
                 border: 1px solid var(--border-color, #d1d8dd); font-size: 12px;">
                <span class="text-muted">
                    <strong>Last Sync:</strong> <span id="bio-last-sync-val">—</span>
                </span>
                <span class="text-muted">
                    <strong>Schedule:</strong> <span id="bio-schedule-val">—</span>
                </span>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs" id="bioTabs" style="margin-bottom: 20px; border-bottom: 2px solid var(--border-color, #d1d8dd);">
                <li class="nav-item">
                    <a class="nav-link active" data-tab="manual" href="#" style="font-size: 13px;">
                        Manual Fetch
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-tab="scheduler" href="#" style="font-size: 13px;">
                        Scheduler
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-tab="logs" href="#" style="font-size: 13px;">
                        Sync Logs
                    </a>
                </li>
            </ul>

            <!-- ═══ MANUAL FETCH TAB ════════════════════════════════════ -->
            <div id="tab-manual" class="bio-tab-panel">

                <div class="frappe-card" style="padding: 20px 24px; margin-bottom: 16px;">
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 14px; font-weight: 600; color: var(--text-color, #1c2126);">
                            Fetch Attendance Data
                        </div>
                        <div class="text-muted" style="font-size: 12px; margin-top: 3px;">
                            Pull punch data from eTimeOffice. First punch = <strong>IN</strong>,
                            last punch = <strong>OUT</strong>. Single punch = <strong>IN only</strong>.
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-sm-4" id="emp-field-wrapper"></div>
                        <div class="col-sm-4" id="from-date-wrapper"></div>
                        <div class="col-sm-4" id="to-date-wrapper"></div>
                    </div>

                    <div style="margin-top: 4px;">
                        <button class="btn btn-default btn-sm" id="bio-preview-btn">
                            Preview Checkins
                        </button>
                    </div>
                </div>

                <!-- Result stats -->
                <div id="bio-result-card" class="frappe-card hidden"
                     style="padding: 20px 24px; margin-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 14px;
                                color: var(--text-color, #1c2126);">
                        Fetch Result
                    </div>
                    <div class="row" id="bio-stats-row"></div>
                    <div class="hidden" id="bio-error-box"
                         style="margin-top: 12px; padding: 10px 14px; border-radius: 6px;
                                background: #fff3f3; border: 1px solid #f5c2c7;
                                color: #842029; font-size: 13px;">
                    </div>
                </div>

                <!-- Preview table -->
                <div id="bio-preview-card" class="frappe-card hidden"
                     style="padding: 20px 24px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 14px;
                                color: var(--text-color, #1c2126);">
                        Employee Checkin Records
                    </div>
                    <div id="bio-checkin-table-wrap"></div>
                </div>
            </div>

            <!-- ═══ SCHEDULER TAB ════════════════════════════════════════ -->
            <div id="tab-scheduler" class="bio-tab-panel hidden">
                <div class="frappe-card" style="padding: 20px 24px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;
                                color: var(--text-color, #1c2126);">
                        Automatic Fetch Schedule
                    </div>
                    <div class="text-muted" style="font-size: 12px; margin-bottom: 20px;">
                        Configure when ERPNext automatically pulls biometric data.
                        Changes take effect immediately without a server restart.
                    </div>

                    <!-- Enable toggle -->
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
                                padding: 12px 14px; border-radius: 6px;
                                background: var(--bg-color, #f8f9fa);
                                border: 1px solid var(--border-color, #d1d8dd);">
                        <input type="checkbox" id="sched-enabled"
                               style="width:16px; height:16px; cursor:pointer; accent-color: var(--primary, #2490ef);" />
                        <label for="sched-enabled" style="margin:0; cursor:pointer; font-size:13px; font-weight:500;">
                            Enable automatic fetch
                        </label>
                        <span id="sched-status-tag" style="margin-left: auto; font-size: 11px;
                              font-weight: 600; padding: 2px 10px; border-radius: 12px;
                              background: #fde8e8; color: #842029; border: 1px solid #f5c2c7;">
                            Disabled
                        </span>
                    </div>

                    <div id="sched-options" class="row" style="transition: opacity 0.2s;">
                        <div class="col-sm-4">
                            <div class="form-group">
                                <label class="control-label" style="font-size: 12px;">
                                    Fetch Schedule
                                </label>
                                <select id="sched-schedule" class="form-control form-control-sm">
                                    <option>Every Hour</option>
                                    <option>Every 2 Hours</option>
                                    <option>Every 4 Hours</option>
                                    <option>Every 6 Hours</option>
                                    <option>Every 12 Hours</option>
                                    <option>Daily</option>
                                    <option>Custom</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-sm-4" id="sched-cron-field" style="display:none;">
                            <div class="form-group">
                                <label class="control-label" style="font-size: 12px;">
                                    Custom Cron Expression
                                </label>
                                <input type="text" id="sched-custom-cron"
                                       class="form-control form-control-sm"
                                       placeholder="e.g. 0 */4 * * *" />
                                <p class="help-box small text-muted" style="margin-top: 4px;">
                                    e.g. <code>0 */4 * * *</code> = every 4 hours
                                </p>
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <div class="form-group">
                                <label class="control-label" style="font-size: 12px;">
                                    Lookback Days (first run only)
                                </label>
                                <input type="number" id="sched-days-back"
                                       class="form-control form-control-sm"
                                       min="1" max="365" value="1" />
                                <p class="help-box small text-muted" style="margin-top: 4px;">
                                    Days of history to pull on the very first sync
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 8px; padding-top: 16px;
                                border-top: 1px solid var(--border-color, #d1d8dd);">
                        <button class="btn btn-primary btn-sm" id="sched-save-btn">
                            Save Schedule
                        </button>
                    </div>
                </div>
            </div>

            <!-- ═══ SYNC LOGS TAB ════════════════════════════════════════ -->
            <div id="tab-logs" class="bio-tab-panel hidden">
                <div class="frappe-card" style="padding: 20px 24px;">
                    <div style="display:flex; justify-content:space-between;
                                align-items:center; margin-bottom:16px;">
                        <div style="font-size:14px; font-weight:600;
                                    color: var(--text-color, #1c2126);">
                            Sync History
                        </div>
                        <button class="btn btn-default btn-xs" id="logs-refresh-btn">
                            ↻ Refresh
                        </button>
                    </div>
                    <div id="bio-logs-wrap"></div>
                </div>
            </div>

        </div>
    `);

    const app = new BiometricFetchPage(page, $pill);
};

/* ═══════════════════════════════════════════════════════════════════════════
   Page Controller
═══════════════════════════════════════════════════════════════════════════ */
class BiometricFetchPage {

    constructor(page, $pill) {
        this.page      = page;
        this.$pill     = $pill;
        this._settings = {};
        this._makeFields();
        this._setupTabs();
        this._setupEvents();
        this._loadAll();
    }

    /* ── Native Frappe form controls (v15 + v16) ──────────────────────────── */
    _makeFields() {
        this.empField = frappe.ui.form.make_control({
            df: {
                fieldtype: "Link",
                fieldname: "employee",
                label: __("Employee"),
                options: "Employee",
                placeholder: __("Leave blank for all employees"),
            },
            parent: $("#emp-field-wrapper")[0],
            render_input: true,
        });

        this.fromDate = frappe.ui.form.make_control({
            df: { fieldtype: "Date", fieldname: "from_date", label: __("From Date") },
            parent: $("#from-date-wrapper")[0],
            render_input: true,
        });
        this.fromDate.set_value(frappe.datetime.get_today());

        this.toDate = frappe.ui.form.make_control({
            df: { fieldtype: "Date", fieldname: "to_date", label: __("To Date") },
            parent: $("#to-date-wrapper")[0],
            render_input: true,
        });
        this.toDate.set_value(frappe.datetime.get_today());
    }

    /* ── Tabs ─────────────────────────────────────────────────────────────── */
    _setupTabs() {
        $("#bioTabs .nav-link").on("click", function (e) {
            e.preventDefault();
            const tab = $(this).data("tab");
            $("#bioTabs .nav-link").removeClass("active");
            $(".bio-tab-panel").addClass("hidden");
            $(this).addClass("active");
            $(`#tab-${tab}`).removeClass("hidden");
        });
    }

    /* ── Events ───────────────────────────────────────────────────────────── */
    _setupEvents() {
        this.page.btn_primary.on("click",  () => this.runFetch());
        $("#bio-preview-btn").on("click",  () => this._loadCheckins());
        $("#sched-enabled").on("change",   () => this._toggleSchedulerUI());
        $("#sched-schedule").on("change",  () => this._toggleCronField());
        $("#sched-save-btn").on("click",   () => this._saveScheduler());
        $("#logs-refresh-btn").on("click", () => this._loadLogs());
    }

    _loadAll() {
        this._loadSettings();
        this._loadLogs();
    }

    /* ── Settings ─────────────────────────────────────────────────────────── */
    _loadSettings() {
        frappe.call({
            method: "etimeoffice_biometric.api.get_settings",
            callback: (r) => {
                if (!r.message) return;
                const s = this._settings = r.message;

                // Update status pill (v15 + v16 safe — plain DOM approach)
                const dot  = document.getElementById("bio-sched-dot");
                const text = document.getElementById("bio-sched-text");
                if (s.auto_fetch_enabled) {
                    dot.style.background  = "#28a745";
                    text.textContent = `ON — ${s.fetch_schedule || "Scheduled"}`;
                } else {
                    dot.style.background  = "#dc3545";
                    text.textContent = "Scheduler OFF";
                }

                // Info bar
                if (s.last_sync_time || s.fetch_schedule) {
                    $("#bio-info-bar").show();
                    $("#bio-last-sync-val").text(
                        s.last_sync_time ? frappe.datetime.str_to_user(s.last_sync_time) : "Never"
                    );
                    $("#bio-schedule-val").text(
                        s.auto_fetch_enabled ? (s.fetch_schedule || "—") : "Disabled"
                    );
                }

                // Populate scheduler tab
                $("#sched-enabled").prop("checked", !!s.auto_fetch_enabled);
                $("#sched-schedule").val(s.fetch_schedule   || "Every Hour");
                $("#sched-custom-cron").val(s.custom_cron   || "");
                $("#sched-days-back").val(s.sync_days_back  || 1);
                this._toggleSchedulerUI();
                this._toggleCronField();
            },
        });
    }

    /* ── Scheduler ────────────────────────────────────────────────────────── */
    _toggleSchedulerUI() {
        const on = $("#sched-enabled").is(":checked");
        const tag = document.getElementById("sched-status-tag");
        if (on) {
            tag.textContent = "Enabled";
            tag.style.cssText += "background:#d1fae5; color:#065f46; border-color:#a7f3d0;";
        } else {
            tag.textContent = "Disabled";
            tag.style.cssText += "background:#fde8e8; color:#842029; border-color:#f5c2c7;";
        }
        $("#sched-options").css({ opacity: on ? 1 : 0.45, "pointer-events": on ? "auto" : "none" });
    }

    _toggleCronField() {
        $("#sched-cron-field").toggle($("#sched-schedule").val() === "Custom");
    }

    _saveScheduler() {
        const enabled  = $("#sched-enabled").is(":checked") ? 1 : 0;
        const schedule = $("#sched-schedule").val();
        const cron     = $("#sched-custom-cron").val().trim();
        const days     = parseInt($("#sched-days-back").val()) || 1;

        if (schedule === "Custom" && !cron) {
            frappe.msgprint({ title: __("Validation"), indicator: "orange",
                message: __("Please enter a cron expression.") });
            return;
        }

        frappe.call({
            method: "etimeoffice_biometric.api.save_settings",
            args: {
                corporate_id:       this._settings.corporate_id   || "",
                username:           this._settings.username        || "",
                api_base_url:       this._settings.api_base_url    || "https://api.etimeoffice.com",
                auto_fetch_enabled: enabled,
                fetch_schedule:     schedule,
                custom_cron:        cron,
                sync_days_back:     days,
            },
            freeze: true,
            freeze_message: __("Saving schedule…"),
            callback: (r) => {
                if (r.message && r.message.success) {
                    frappe.show_alert({ message: __("Schedule saved!"), indicator: "green" });
                    this._loadSettings();
                }
            },
        });
    }

    /* ── Manual Fetch ─────────────────────────────────────────────────────── */
    runFetch() {
        const empCode  = this.empField.get_value() || "ALL";
        const fromDate = this.fromDate.get_value();
        const toDate   = this.toDate.get_value();

        if (!fromDate || !toDate) {
            frappe.msgprint({ title: __("Validation"), indicator: "orange",
                message: __("Please select From Date and To Date.") });
            return;
        }
        if (fromDate > toDate) {
            frappe.msgprint({ title: __("Validation"), indicator: "orange",
                message: __("From Date cannot be after To Date.") });
            return;
        }

        this.page.btn_primary.prop("disabled", true).text(__("Fetching…"));
        $("#bio-result-card").addClass("hidden");

        frappe.call({
            method: "etimeoffice_biometric.api.manual_fetch",
            args: { emp_code: empCode, from_date: fromDate, to_date: toDate },
            callback: (r) => {
                this.page.btn_primary.prop("disabled", false).text(__("Fetch & Sync"));
                if (r.message) this._showResult(r.message);
            },
            error: () => {
                this.page.btn_primary.prop("disabled", false).text(__("Fetch & Sync"));
                frappe.show_alert({ message: __("Fetch failed. Check error log."), indicator: "red" });
            },
        });
    }

    _showResult(m) {
        $("#bio-result-card").removeClass("hidden");

        const stats = [
            { num: m.records_fetched, label: __("Records from API"),   bg: "#f0f7ff", color: "#1565c0", border: "#bfdbfe" },
            { num: m.records_created, label: __("Checkins Created"),   bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
            { num: m.records_skipped, label: __("Duplicates Skipped"), bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
            { num: m.not_found,       label: __("Employees Not Found"),bg: "#fff5f5", color: "#991b1b", border: "#fecaca" },
        ];

        $("#bio-stats-row").html(
            stats.map(s => `
                <div class="col-sm-3">
                    <div style="text-align:center; padding:16px 10px; border-radius:8px;
                                background:${s.bg}; border:1px solid ${s.border};
                                margin-bottom:8px;">
                        <div style="font-size:2rem; font-weight:700; color:${s.color};
                                    line-height:1.1;">${s.num || 0}</div>
                        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em;
                                    color:#6b7280; margin-top:5px; font-weight:600;">
                            ${s.label}
                        </div>
                    </div>
                </div>`
            ).join("")
        );

        if (m.error) {
            $("#bio-error-box").removeClass("hidden").text(__("Error: ") + m.error);
        } else {
            $("#bio-error-box").addClass("hidden");
        }

        this._loadLogs();
    }

    /* ── Preview Checkins ─────────────────────────────────────────────────── */
    _loadCheckins() {
        const empCode  = this.empField.get_value() || "ALL";
        const fromDate = this.fromDate.get_value();
        const toDate   = this.toDate.get_value();

        if (!fromDate || !toDate) {
            frappe.msgprint({ title: __("Validation"), indicator: "orange",
                message: __("Please select dates first.") });
            return;
        }

        $("#bio-preview-card").removeClass("hidden");
        $("#bio-checkin-table-wrap").html(
            `<p class="text-muted text-center" style="padding:24px;">${__("Loading…")}</p>`
        );

        const filters = [
            ["time", ">=", fromDate + " 00:00:00"],
            ["time", "<=", toDate   + " 23:59:59"],
        ];
        if (empCode !== "ALL") filters.push(["employee", "=", empCode]);

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype:  "Employee Checkin",
                fields:   ["name","employee","employee_name","time","log_type","device_id"],
                filters:  filters,
                order_by: "employee asc, time asc",
                limit:    500,
            },
            callback: (r) => this._renderCheckinTable(r.message || []),
        });
    }

    _renderCheckinTable(records) {
        if (!records.length) {
            $("#bio-checkin-table-wrap").html(
                `<div style="text-align:center; padding:32px; color:#9ca3af;">
                    <div style="font-size:2rem; margin-bottom:8px;">📭</div>
                    <div>${__("No checkin records found for this range.")}</div>
                 </div>`
            );
            return;
        }

        const rows = records.map(r => {
            const isIn  = (r.log_type || "").toUpperCase() === "IN";
            const badge = `<span style="display:inline-block; padding:2px 10px;
                                border-radius:12px; font-size:11px; font-weight:700;
                                background:${isIn ? "#dbeafe" : "#fee2e2"};
                                color:${isIn ? "#1d4ed8" : "#991b1b"};">
                ${r.log_type}
            </span>`;
            return `<tr>
                <td style="font-size:13px;">${r.employee}</td>
                <td style="font-size:13px;">${r.employee_name || "—"}</td>
                <td style="font-size:13px;">${frappe.datetime.str_to_user(r.time)}</td>
                <td>${badge}</td>
                <td style="font-size:13px;">${r.device_id || "—"}</td>
                <td style="font-size:13px;">
                    <a href="/app/employee-checkin/${r.name}" target="_blank"
                       style="color: var(--primary, #2490ef);">View ↗</a>
                </td>
            </tr>`;
        }).join("");

        $("#bio-checkin-table-wrap").html(`
            <div style="overflow-x:auto;">
                <table class="table table-bordered table-hover" style="font-size:13px; margin-bottom:0;">
                    <thead>
                        <tr style="background: var(--bg-color, #f8f9fa);">
                            <th>${__("Employee ID")}</th>
                            <th>${__("Name")}</th>
                            <th>${__("Punch Time")}</th>
                            <th>${__("Type")}</th>
                            <th>${__("Machine ID")}</th>
                            <th>${__("Link")}</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <p class="text-muted" style="font-size:12px; margin-top:8px; text-align:right;">
                ${records.length} ${__("record(s) found")}
            </p>`);
    }

    /* ── Sync Logs ────────────────────────────────────────────────────────── */
    _loadLogs() {
        $("#bio-logs-wrap").html(
            `<p class="text-muted text-center" style="padding:24px;">${__("Loading…")}</p>`
        );
        frappe.call({
            method: "etimeoffice_biometric.api.get_sync_logs",
            args: { limit: 30 },
            callback: (r) => this._renderLogs(r.message || []),
        });
    }

    _renderLogs(logs) {
        if (!logs.length) {
            $("#bio-logs-wrap").html(
                `<div style="text-align:center; padding:32px; color:#9ca3af;">
                    <div style="font-size:2rem; margin-bottom:8px;">📋</div>
                    <div>${__("No sync logs yet. Run your first fetch above.")}</div>
                 </div>`
            );
            return;
        }

        const statusStyle = {
            "Success": "background:#d1fae5; color:#065f46; border-color:#a7f3d0;",
            "Partial": "background:#fef3c7; color:#92400e; border-color:#fde68a;",
            "Failed":  "background:#fee2e2; color:#991b1b; border-color:#fecaca;",
        };

        const rows = logs.map(l => {
            const sStyle = statusStyle[l.status] || "background:#f3f4f6; color:#374151;";
            const errCell = l.error_message
                ? `<span title="${frappe.utils.escape_html(l.error_message)}"
                         style="cursor:help; color:#991b1b; font-size:12px;">⚠ ${__("Error")}</span>`
                : `<span style="color:#9ca3af;">—</span>`;
            return `<tr>
                <td style="font-size:12px; white-space:nowrap;">
                    ${frappe.datetime.str_to_user(l.sync_time)}
                </td>
                <td style="font-size:12px;">${l.employee_filter || "ALL"}</td>
                <td style="font-size:12px; white-space:nowrap;">
                    ${l.from_date ? frappe.datetime.str_to_user(l.from_date) : "—"}
                </td>
                <td style="font-size:12px; white-space:nowrap;">
                    ${l.to_date ? frappe.datetime.str_to_user(l.to_date) : "—"}
                </td>
                <td>
                    <span style="display:inline-block; padding:2px 10px; border-radius:12px;
                                 font-size:11px; font-weight:700; border:1px solid;
                                 ${sStyle}">
                        ${l.status}
                    </span>
                </td>
                <td style="font-size:12px; text-align:center;">${l.records_fetched  || 0}</td>
                <td style="font-size:12px; text-align:center;">${l.records_created  || 0}</td>
                <td style="font-size:12px; text-align:center;">${l.records_skipped  || 0}</td>
                <td>${errCell}</td>
            </tr>`;
        }).join("");

        $("#bio-logs-wrap").html(`
            <div style="overflow-x:auto;">
                <table class="table table-bordered" style="margin-bottom:0;">
                    <thead>
                        <tr style="background: var(--bg-color, #f8f9fa);">
                            <th style="font-size:11px;">${__("Sync Time")}</th>
                            <th style="font-size:11px;">${__("Employee")}</th>
                            <th style="font-size:11px;">${__("From")}</th>
                            <th style="font-size:11px;">${__("To")}</th>
                            <th style="font-size:11px;">${__("Status")}</th>
                            <th style="font-size:11px; text-align:center;">${__("Fetched")}</th>
                            <th style="font-size:11px; text-align:center;">${__("Created")}</th>
                            <th style="font-size:11px; text-align:center;">${__("Skipped")}</th>
                            <th style="font-size:11px;">${__("Notes")}</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <p class="text-muted" style="font-size:12px; margin-top:8px; text-align:right;">
                ${__("Showing last")} ${logs.length} ${__("entries")}
            </p>`);
    }
}
