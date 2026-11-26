/* --- START OF FILE: creator-controls.js --- */
(function () {
    "use strict";

    if (window.__CB_CREATOR_CONTROLS_INIT__) return;
    window.__CB_CREATOR_CONTROLS_INIT__ = true;

    const CREATOR_FLAGS_KEY = "cb_creator_flags_v1";
    const MQTT_CREATOR_TOPIC = "campusbites/vpiet_exclusive_sync_2026/creator_flags_v1";

    const DEFAULT_FLAGS = {
        onlinePaymentEnabled: true,
        maintenanceMode: false,
        maintenanceMessage: "CampusBites is temporarily under scheduled maintenance to improve your experience. Please check back shortly!",
        updatedAt: 0
    };

    let creatorFlags = loadCreatorFlags();
    window.CB_CREATOR_FLAGS = creatorFlags;

    function loadCreatorFlags() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CREATOR_FLAGS_KEY) || "null");
            if (parsed && typeof parsed === "object") {
                return { ...DEFAULT_FLAGS, ...parsed };
            }
        } catch (e) {}
        return { ...DEFAULT_FLAGS };
    }

    function saveCreatorFlags(broadcast = true) {
        creatorFlags.updatedAt = Date.now();
        window.CB_CREATOR_FLAGS = creatorFlags;
        localStorage.setItem(CREATOR_FLAGS_KEY, JSON.stringify(creatorFlags));
        enforceAllCreatorFlags();
        refreshCreatorControlsUI();

        if (broadcast) {
            const client = window.cbMqttClient;
            if (client && client.connected) {
                try {
                    client.publish(MQTT_CREATOR_TOPIC, JSON.stringify(creatorFlags), { qos: 1, retain: true });
                } catch (e) {}
            }
            if (typeof cloudConfig !== "undefined" && cloudConfig.dbUrl) {
                fetch(`${cloudConfig.dbUrl}/campusbites_creator_flags.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(creatorFlags)
                }).catch(() => {});
            }
        }
    }

    const css = `
        .cb-cc-panel {
            background: var(--liquid-glass-strong, #ffffff);
            border: 1.5px solid rgba(99, 102, 241, 0.45);
            border-radius: 20px;
            padding: 18px;
            margin-bottom: 18px;
            box-shadow: var(--liquid-glass-shadow, 0 4px 16px rgba(0, 0, 0, 0.08));
        }
        .cb-cc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 12px;
            margin-top: 10px;
        }
        .cb-cc-card {
            background: var(--surface-sub-bg, #f8fafc);
            border: 1.5px solid var(--liquid-glass-border, #e2e8f0);
            border-radius: 16px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
        }
        .cb-cc-card.is-alert {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.08);
        }
        .cb-cc-btn {
            width: 100%;
            border: none;
            border-radius: 11px;
            padding: 10px 12px;
            font-size: 12.5px;
            font-weight: 900;
            color: #ffffff;
            cursor: pointer;
        }
        .cb-cc-btn.on { background: #10b981; }
        .cb-cc-btn.off { background: #dc2626; }

        #payOnlineCard.cb-online-disabled {
            opacity: 0.55;
            border-style: dashed !important;
            border-color: #ef4444 !important;
            background: rgba(239, 68, 68, 0.08) !important;
        }

        .cb-maint-overlay {
            position: fixed;
            inset: 0;
            z-index: 950;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
            color: #ffffff;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
        }
        .cb-maint-overlay.active { display: flex; }
        .cb-maint-card {
            max-width: 440px;
            width: 100%;
            background: rgba(255, 255, 255, 0.09);
            border: 1.5px solid rgba(255, 255, 255, 0.22);
            border-radius: 26px;
            padding: 28px 22px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
        }
        .cb-maint-badge {
            display: inline-block;
            background: #f59e0b;
            color: #0f172a;
            font-size: 10.5px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 20px;
            letter-spacing: 0.7px;
            margin-bottom: 10px;
        }
    `;
    const st = document.createElement("style");
    st.id = "cb-creator-controls-css";
    st.textContent = css;
    document.head.appendChild(st);

    function mountCreatorUI() {
        if (!document.getElementById("cbMaintenanceOverlay")) {
            const ov = document.createElement("div");
            ov.id = "cbMaintenanceOverlay";
            ov.className = "cb-maint-overlay";
            ov.innerHTML = `
                <div class="cb-maint-card">
                    <div style="font-size: 52px; margin-bottom: 8px;">🚧</div>
                    <span class="cb-maint-badge">System Maintenance</span>
                    <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 8px;">App Under Maintenance</h2>
                    <p id="cbMaintOverlayMsg" style="font-size: 13px; color: #e2e8f0; line-height: 1.55; font-weight: 600; margin-bottom: 20px;">
                        CampusBites is temporarily under maintenance. Please check back shortly!
                    </p>
                    <button type="button" id="cbMaintRefreshBtn" style="width:100%; background:#10b981; color:#fff; border:none; padding:12px; border-radius:13px; font-size:13px; font-weight:900; cursor:pointer; margin-bottom:10px;">
                        🔄 Check Again
                    </button>
                    <button type="button" id="cbMaintCreatorBypassBtn" style="background:none; border:1px solid rgba(255,255,255,0.3); color:#cbd5e1; padding:7px 14px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">
                        👑 App Creator Login (Unlock)
                    </button>
                </div>
            `;
            document.body.appendChild(ov);

            document.getElementById("cbMaintRefreshBtn").addEventListener("click", () => location.reload());
            document.getElementById("cbMaintCreatorBypassBtn").addEventListener("click", () => {
                const pin = prompt("👑 Enter App Creator PIN to unlock & manage Maintenance Mode:");
                if (pin === "9999") {
                    const pinInput = document.getElementById("creatorMasterPinInput");
                    if (pinInput) pinInput.value = "9999";
                    if (typeof completeCreatorAuditorLogin === "function") completeCreatorAuditorLogin();
                    enforceAllCreatorFlags();
                } else if (pin !== null) {
                    alert("❌ Invalid Creator PIN!");
                }
            });
        }

        const mount = document.getElementById("creatorControlsMount");
        if (mount && !document.getElementById("cbCreatorControlsBox")) {
            mount.innerHTML = `
                <div class="cb-cc-panel" id="cbCreatorControlsBox">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                            <span style="font-size:10px; font-weight:900; color:var(--primary); text-transform:uppercase; letter-spacing:0.6px;">👑 Creator Live App Switches</span>
                            <h3 style="font-size:16px; font-weight:900; color:var(--text-main);">Payment Gateway &amp; Maintenance Controls</h3>
                        </div>
                        <span style="font-size:11px; font-weight:800; color:#10b981;">⚡ Syncs live to all connected devices</span>
                    </div>

                    <div class="cb-cc-grid">
                        <div class="cb-cc-card" id="cbCcOnlinePayCard">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                    <strong style="font-size:14px;">💳 Online UPI Payment</strong>
                                    <span id="cbCcOnlineStatusBadge" style="font-size:10.5px; font-weight:900; padding:3px 9px; border-radius:12px;">ON</span>
                                </div>
                                <p style="font-size:11.5px; color:var(--text-muted); font-weight:600; line-height:1.4;">
                                    Turn OFF to temporarily disable Online UPI / QR checkout app-wide. Students will automatically use <b>Cash on Pay</b>.
                                </p>
                            </div>
                            <button type="button" class="cb-cc-btn on" id="cbCcToggleOnlineBtn">Turn Online Payment OFF</button>
                        </div>

                        <div class="cb-cc-card" id="cbCcMaintCard">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                    <strong style="font-size:14px;">🚧 App Maintenance Mode</strong>
                                    <span id="cbCcMaintStatusBadge" style="font-size:10.5px; font-weight:900; padding:3px 9px; border-radius:12px;">LIVE</span>
                                </div>
                                <p style="font-size:11.5px; color:var(--text-muted); font-weight:600; line-height:1.4; margin-bottom:8px;">
                                    Turn ON if something goes wrong. Shows an "App Under Maintenance" screen to all students, colleges &amp; counter staff (Creator stays unlocked).
                                </p>
                                <input type="text" class="form-control" id="cbCcMaintMsgInput" placeholder="Maintenance notice shown to users..." style="font-size:12px; margin-bottom:6px;">
                            </div>
                            <div style="display:flex; gap:6px;">
                                <button type="button" class="cb-cc-btn off" id="cbCcToggleMaintBtn" style="flex:1;">Enable Maintenance Mode</button>
                                <button type="button" id="cbCcSaveMaintMsgBtn" style="background:#334155; color:#fff; border:none; border-radius:10px; padding:0 12px; font-size:11px; font-weight:800; cursor:pointer;">Save Msg</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById("cbCcToggleOnlineBtn").addEventListener("click", () => {
                creatorFlags.onlinePaymentEnabled = !creatorFlags.onlinePaymentEnabled;
                saveCreatorFlags(true);
            });

            document.getElementById("cbCcToggleMaintBtn").addEventListener("click", () => {
                const msgInp = document.getElementById("cbCcMaintMsgInput");
                if (msgInp && msgInp.value.trim()) creatorFlags.maintenanceMessage = msgInp.value.trim();
                creatorFlags.maintenanceMode = !creatorFlags.maintenanceMode;
                saveCreatorFlags(true);
            });

            document.getElementById("cbCcSaveMaintMsgBtn").addEventListener("click", () => {
                const msgInp = document.getElementById("cbCcMaintMsgInput");
                if (msgInp && msgInp.value.trim()) {
                    creatorFlags.maintenanceMessage = msgInp.value.trim();
                    saveCreatorFlags(true);
                    alert("✅ Maintenance message updated & synced!");
                }
            });
        }

        refreshCreatorControlsUI();
    }

    function refreshCreatorControlsUI() {
        const onlineBadge = document.getElementById("cbCcOnlineStatusBadge");
        const onlineBtn = document.getElementById("cbCcToggleOnlineBtn");
        const onlineCard = document.getElementById("cbCcOnlinePayCard");
        const maintBadge = document.getElementById("cbCcMaintStatusBadge");
        const maintBtn = document.getElementById("cbCcToggleMaintBtn");
        const maintCard = document.getElementById("cbCcMaintCard");
        const maintInput = document.getElementById("cbCcMaintMsgInput");

        if (onlineBadge && onlineBtn && onlineCard) {
            if (creatorFlags.onlinePaymentEnabled) {
                onlineBadge.textContent = "🟢 ENABLED";
                onlineBadge.style.background = "#dcfce7";
                onlineBadge.style.color = "#166534";
                onlineBtn.textContent = "Turn Online Payment OFF";
                onlineBtn.className = "cb-cc-btn off";
                onlineCard.classList.remove("is-alert");
            } else {
                onlineBadge.textContent = "🔴 DISABLED";
                onlineBadge.style.background = "#fee2e2";
                onlineBadge.style.color = "#dc2626";
                onlineBtn.textContent = "Turn Online Payment ON";
                onlineBtn.className = "cb-cc-btn on";
                onlineCard.classList.add("is-alert");
            }
        }

        if (maintBadge && maintBtn && maintCard) {
            if (maintInput && document.activeElement !== maintInput) {
                maintInput.value = creatorFlags.maintenanceMessage || DEFAULT_FLAGS.maintenanceMessage;
            }
            if (creatorFlags.maintenanceMode) {
                maintBadge.textContent = "🚧 MAINTENANCE ON";
                maintBadge.style.background = "#fee2e2";
                maintBadge.style.color = "#dc2626";
                maintBtn.textContent = "Turn Maintenance OFF (Go Live)";
                maintBtn.className = "cb-cc-btn on";
                maintCard.classList.add("is-alert");
            } else {
                maintBadge.textContent = "🟢 APP LIVE";
                maintBadge.style.background = "#dcfce7";
                maintBadge.style.color = "#166534";
                maintBtn.textContent = "Enable Maintenance Mode 🚧";
                maintBtn.className = "cb-cc-btn off";
                maintCard.classList.remove("is-alert");
            }
        }
    }
    window.refreshCreatorControlsUI = refreshCreatorControlsUI;

    function enforceAllCreatorFlags() {
        const role = typeof currentRole !== "undefined" ? currentRole : "student";
        const overlay = document.getElementById("cbMaintenanceOverlay");
        const msgEl = document.getElementById("cbMaintOverlayMsg");
        if (msgEl) msgEl.textContent = creatorFlags.maintenanceMessage || DEFAULT_FLAGS.maintenanceMessage;
        if (overlay) {
            overlay.classList.toggle("active", Boolean(creatorFlags.maintenanceMode) && role !== "auditor");
        }

        const onlineCard = document.getElementById("payOnlineCard");
        if (onlineCard) {
            if (!creatorFlags.onlinePaymentEnabled) {
                onlineCard.classList.add("cb-online-disabled");
                const p = onlineCard.querySelector("p");
                if (p) p.textContent = "Temporarily OFF";
                if (typeof selectedPaymentMethod !== "undefined" && selectedPaymentMethod === "online") {
                    if (typeof selectPayment === "function") selectPayment("cash");
                }
            } else {
                onlineCard.classList.remove("cb-online-disabled");
                const p = onlineCard.querySelector("p");
                if (p) p.textContent = "GPay / PhonePe Safe";
            }
        }
    }

    function hookPaymentFunctions() {
        if (typeof window.selectPayment === "function" && !window.selectPayment.__cbWrapped) {
            const origSelectPayment = window.selectPayment;
            window.selectPayment = function (mode) {
                if (mode === "online" && !creatorFlags.onlinePaymentEnabled) {
                    alert("⚠️ Online UPI payment is temporarily turned OFF by the App Creator.\n\nPlease use 'Cash on Pay' to place your order.");
                    return origSelectPayment("cash");
                }
                const res = origSelectPayment(mode);
                enforceAllCreatorFlags();
                return res;
            };
            window.selectPayment.__cbWrapped = true;
        }

        if (typeof window.placeOrder === "function" && !window.placeOrder.__cbWrapped) {
            const origPlaceOrder = window.placeOrder;
            window.placeOrder = function () {
                if (creatorFlags.maintenanceMode && (typeof currentRole === "undefined" || currentRole !== "auditor")) {
                    enforceAllCreatorFlags();
                    return;
                }
                if (typeof selectedPaymentMethod !== "undefined" && selectedPaymentMethod === "online" && !creatorFlags.onlinePaymentEnabled) {
                    alert("⚠️ Online UPI payment is currently disabled. Switching to Cash on Pay.");
                    if (typeof window.selectPayment === "function") window.selectPayment("cash");
                    return;
                }
                return origPlaceOrder.apply(this, arguments);
            };
            window.placeOrder.__cbWrapped = true;
        }

        if (typeof window.openDrawer === "function" && !window.openDrawer.__cbCreatorWrapped) {
            const origOpenDrawer = window.openDrawer;
            window.openDrawer = function () {
                if (!creatorFlags.onlinePaymentEnabled && typeof selectedPaymentMethod !== "undefined") {
                    selectedPaymentMethod = "cash";
                }
                const res = origOpenDrawer.apply(this, arguments);
                enforceAllCreatorFlags();
                return res;
            };
            window.openDrawer.__cbCreatorWrapped = true;
        }

        if (typeof window.logoutAndOpenAuthGate === "function" && !window.logoutAndOpenAuthGate.__cbCreatorWrapped) {
            const origLogout = window.logoutAndOpenAuthGate;
            window.logoutAndOpenAuthGate = function () {
                const res = origLogout.apply(this, arguments);
                setTimeout(enforceAllCreatorFlags, 50);
                return res;
            };
            window.logoutAndOpenAuthGate.__cbCreatorWrapped = true;
        }
    }

    const prevOnConnect = window.onCbMqttConnected;
    window.onCbMqttConnected = function (client) {
        if (typeof prevOnConnect === "function") prevOnConnect(client);
        try { client.subscribe(MQTT_CREATOR_TOPIC, { qos: 1 }); } catch (e) {}
    };

    const prevOnMsg = window.onCbMqttMessage;
    window.onCbMqttMessage = function (topic, message) {
        if (typeof prevOnMsg === "function") prevOnMsg(topic, message);
        if (topic !== MQTT_CREATOR_TOPIC) return;
        try {
            const incoming = JSON.parse(message.toString());
            if (incoming && Number(incoming.updatedAt || 0) >= Number(creatorFlags.updatedAt || 0)) {
                creatorFlags = { ...DEFAULT_FLAGS, ...incoming };
                window.CB_CREATOR_FLAGS = creatorFlags;
                localStorage.setItem(CREATOR_FLAGS_KEY, JSON.stringify(creatorFlags));
                enforceAllCreatorFlags();
                refreshCreatorControlsUI();
            }
        } catch (e) {}
    };

    window.addEventListener("storage", (e) => {
        if (e.key === CREATOR_FLAGS_KEY && e.newValue) {
            creatorFlags = loadCreatorFlags();
            window.CB_CREATOR_FLAGS = creatorFlags;
            enforceAllCreatorFlags();
            refreshCreatorControlsUI();
        }
    });

    function initCreatorControls() {
        mountCreatorUI();
        hookPaymentFunctions();
        enforceAllCreatorFlags();
        if (typeof cloudConfig !== "undefined" && cloudConfig.dbUrl) {
            fetch(`${cloudConfig.dbUrl}/campusbites_creator_flags.json`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && Number(data.updatedAt || 0) > Number(creatorFlags.updatedAt || 0)) {
                        creatorFlags = { ...DEFAULT_FLAGS, ...data };
                        window.CB_CREATOR_FLAGS = creatorFlags;
                        localStorage.setItem(CREATOR_FLAGS_KEY, JSON.stringify(creatorFlags));
                        enforceAllCreatorFlags();
                        refreshCreatorControlsUI();
                    }
                }).catch(() => {});
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCreatorControls);
    } else {
        initCreatorControls();
    }
})();
/* --- END OF FILE: creator-controls.js --- */
