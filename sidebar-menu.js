/* ============================================================================
   CampusBites — 3-Bar Side Window + Clean Header + Fast Tray + Delete Account
   File: sidebar-menu.js
   ============================================================================ */
(function () {
    "use strict";

    if (window.__CB_SIDEBAR_INITIALIZED__) return;
    window.__CB_SIDEBAR_INITIALIZED__ = true;

    const FEEDBACK_STORAGE_KEY = "cb_user_feedback_v1";

    const sidebarCSS = `
        header #headerStyleToggleBtn,
        header #headerThemeToggleBtn,
        header .switch-auth-btn,
        header #headerSubTitle,
        header #activeUserPill {
            display: none !important;
        }
        header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
            padding: 10px 14px !important;
        }
        header .brand,
        header .header-actions {
            width: auto !important;
        }

        /* Fast
60fps Tray Drawer */
        .drawer-overlay {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(15, 23, 42, 0.56) !important;
        }
        .drawer {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: var(--surface-row-bg, #ffffff) !important;
            box-shadow: 0 -6px 22px rgba(0, 0, 0, 0.22) !important;
            will-change: transform;
            contain: layout style paint;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            visibility: hidden;
            pointer-events: none;
            transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0.16s !important;
        }
        .drawer.active {
            visibility: visible;
            pointer-events: auto;
            transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s !important;
        }
        [data-theme="dark"] .drawer { background: #1e293b !important; }

        .cb-sb-menu-btn {
            width: 38px; height: 38px; border-radius: 12px;
            border: 1px solid var(--liquid-glass-border, #e2e8f0);
            background: var(--surface-row-bg, #ffffff); color: var(--text-main, #0f172a);
            display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 4.5px; cursor: pointer; box-shadow: var(--liquid-glass-shadow, 0 2px 8px rgba(15, 23, 42, 0.08));
            flex-shrink: 0; padding: 0;
        }
        .cb-sb-menu-btn:active { transform: scale(0.93); }
        .cb-sb-menu-btn span { display: block; width: 18px; height: 2.2px; border-radius: 3px; background: currentColor; }
        .cb-sb-menu-btn span:nth-child(2) { width: 13px; align-self: flex-end; margin-right: 9px; }

        .cb-sb-overlay {
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.56); z-index: 540;
            opacity: 0; pointer-events: none; transition: opacity 0.18s ease;
        }
        .cb-sb-overlay.open { opacity: 1; pointer-events: auto; }

        .cb-sb-drawer {
            position: fixed; top: 0; right: 0; bottom: 0; width: min(330px, 86vw);
            background: var(--drawer-glass-bg, #ffffff); border-left: 1.5px solid var(--liquid-glass-border, #e2e8f0);
            box-shadow: -8px 0 28px rgba(15, 23, 42, 0.25); z-index: 550; display: flex; flex-direction: column;
            transform: translate3d(105%, 0, 0); will-change: transform; contain: layout style paint;
            visibility: hidden; transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0.2s;
            color: var(--text-main, #0f172a);
        }
        .cb-sb-drawer.open {
            visibility: visible; transform: translate3d(0, 0, 0);
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s;
        }
        [data-ui-style="glass"] .cb-sb-drawer.open {
            backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
        }

        .cb-sb-header { padding: 16px 16px 14px; background: linear-gradient(135deg, var(--primary, #4f46e5), var(--primary-dark, #4338ca)); color: #ffffff; }
        .cb-sb-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .cb-sb-brand-mini { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; }
        .cb-sb-close-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.16); color: #fff; font-size: 18px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .cb-sb-profile-box { display: flex; align-items: center; gap: 11px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); border-radius: 14px; padding: 10px 12px; }
        .cb-sb-avatar { width: 40px; height: 40px; border-radius: 12px; background: #fff; color: var(--primary, #4f46e5); font-size: 19px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cb-sb-profile-meta { min-width: 0; flex: 1; }
        .cb-sb-profile-name { font-size: 14px; font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cb-sb-profile-sub { font-size: 11px; color: #e0e7ff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

        .cb-sb-body { flex: 1; overflow-y: auto; padding: 12px 14px; -webkit-overflow-scrolling: touch; }
        .cb-sb-section-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-muted, #64748b); margin: 10px 4px 6px; }
        .cb-sb-section-label:first-child { margin-top: 2px; }

        .cb-sb-toggles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .cb-sb-toggle-card { background: var(--surface-sub-bg, #f8fafc); border: 1px solid var(--liquid-glass-border, #e2e8f0); border-radius: 14px; padding: 10px; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 4px; color: var(--text-main, #0f172a); }
        .cb-sb-toggle-top { display: flex; justify-content: space-between; align-items: center; font-size: 15px; }
        .cb-sb-pill-badge { font-size: 9.5px; font-weight: 900; padding: 2px 7px; border-radius: 10px; background: rgba(99, 102, 241, 0.16); color: var(--primary, #4f46e5); text-transform: uppercase; }
        [data-theme="dark"] .cb-sb-pill-badge { color: #a5b4fc; }
        .cb-sb-toggle-title { font-size: 12px; font-weight: 800; }
        .cb-sb-toggle-sub { font-size: 10px; color: var(--text-muted, #64748b); font-weight: 600; }

        .cb-sb-list { display: flex; flex-direction: column; gap: 5px; }
        .cb-sb-item { width: 100%; background: var(--surface-row-bg, #ffffff); border: 1px solid var(--liquid-glass-border, #e2e8f0); border-radius: 13px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer; color: var(--text-main, #0f172a); text-align: left; }
        .cb-sb-item.danger-item { border-color: rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.06); color: #dc2626; }
        .cb-sb-item-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .cb-sb-item-icon { width: 32px; height: 32px; border-radius: 9px; background: var(--surface-sub-bg, #f1f5f9); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .cb-sb-item-title { font-size: 12.5px; font-weight: 800; line-height: 1.2; }
        .cb-sb-item-desc { font-size: 10.5px; color: var(--text-muted, #64748b); font-weight: 600; margin-top: 1px; }
        .cb-sb-arrow { font-size: 13px; color: var(--text-muted, #94a3b8); font-weight: 900; }

        .cb-sb-footer { padding: 12px 14px; border-top: 1px solid var(--liquid-glass-border, #e2e8f0); background: var(--surface-sub-bg, #f8fafc); display: flex; flex-direction: column; gap: 8px; }
        .cb-sb-logout-btn { width: 100%; background: #0f172a; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); padding: 11px; border-radius: 13px; font-size: 12.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
        [data-theme="dark"] .cb-sb-logout-btn { background: #dc2626; }
        .cb-sb-version-note { text-align: center; font-size: 10px; color: var(--text-muted, #64748b); font-weight: 700; }

        .cb-sb-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.62); z-index: 650; display: none; align-items: center; justify-content: center; padding: 14px; }
        .cb-sb-modal.active { display: flex; }
        .cb-sb-modal-card { background: var(--modal-glass-bg, #ffffff); border: 1.5px solid var(--liquid-glass-border, #e2e8f0); border-radius: 24px; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto; padding: 20px; color: var(--text-main, #0f172a); box-shadow: var(--liquid-glass-shadow, 0 18px 40px rgba(0, 0, 0, 0.3)); }
        .cb-sb-modal-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--liquid-glass-border, #e2e8f0); }
        .cb-sb-modal-head h3 { font-size: 17px; font-weight: 900; }

        .cb-sb-contact-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--surface-sub-bg, #f8fafc); border: 1px solid var(--liquid-glass-border, #e2e8f0); border-radius: 13px; padding: 11px 12px; margin-bottom: 8px; }
        .cb-sb-mini-btn { background: var(--primary, #4f46e5); color: #ffffff; border: none; padding: 6px 11px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; text-decoration: none; white-space: nowrap; }
        .cb-sb-stars { display: flex; justify-content: center; gap: 8px; margin: 8px 0 12px; }
        .cb-sb-star { font-size: 28px; cursor: pointer; background: none; border: none; filter: grayscale(1); opacity: 0.45; }
        .cb-sb-star.lit { filter: none; opacity: 1; transform: scale(1.1); }
        .cb-sb-faq-item { background: var(--surface-sub-bg, #f8fafc); border: 1px solid var(--liquid-glass-border, #e2e8f0); border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
        .cb-sb-faq-q { width: 100%; background: none; border: none; padding: 11px 13px; text-align: left; font-size: 12.5px; font-weight: 800; color: var(--text-main, #0f172a); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .cb-sb-faq-a { display: none; padding: 0 13px 11px; font-size: 11.5px; color: var(--text-muted, #475569); line-height: 1.5; font-weight: 600; }
        .cb-sb-faq-item.open .cb-sb-faq-a { display: block; }

        .cb-sb-toast { position: fixed; bottom: 86px; left: 50%; transform: translateX(-50%) translateY(20px); background: #0f172a; color: #fff; padding: 9px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; z-index: 750; opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35); white-space: nowrap; }
        .cb-sb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;

    const styleEl = document.createElement("style");
    styleEl.id = "cb-sidebar-styles";
    styleEl.textContent = sidebarCSS;
    document.head.appendChild(styleEl);

    /* Fast
Non-Blocking Tray Drawer */
    let deferredQrTimer = null;
    let lastRenderedDrawerQrUri = "";

    function installFastTrayDrawer() {
        if (typeof window.openDrawer !== "function") return;
        const baseOpenDrawer = window.openDrawer;

        window.openDrawer = function () {
            const drawerEl = document.getElementById("trayDrawer");
            const overlayEl = document.getElementById("drawerOverlay");
            if (!drawerEl || !overlayEl) return;

            const wasAlreadyOpen = drawerEl.classList.contains("active");
            if (!wasAlreadyOpen) {
                if (typeof pushOverlayHistoryState === "function") pushOverlayHistoryState("tray-drawer");
                overlayEl.classList.add("active");
                requestAnimationFrame(() => drawerEl.classList.add("active"));
            }

            baseOpenDrawer();

            const payMode = typeof selectedPaymentMethod !== "undefined" ? selectedPaymentMethod : "online";
            const finalPayable = Number(document.getElementById("billTotal")?.innerText || 0);
            const activeUpi = document.getElementById("qrVpaText")?.innerText || "canteen@sbi";
            const activeMerchant = document.getElementById("qrMerchantNameText")?.innerText || "CANTEEN OFFICIAL";
            const activeCol = getActiveCollege();

            if (deferredQrTimer) clearTimeout(deferredQrTimer);
            if (payMode === "online" && finalPayable > 0 && typeof buildFixedAmountQrUri === "function" && typeof generateQrDataUrl === "function") {
                const qrUri = buildFixedAmountQrUri(activeUpi, activeMerchant, finalPayable, `CampusBites ${activeCol || ""}`);
                if (qrUri !== lastRenderedDrawerQrUri) {
                    deferredQrTimer = setTimeout(() => {
                     const qrImg = document.getElementById("upiQrImg");
                     if (qrImg && drawerEl.classList.contains("active")) {
                     lastRenderedDrawerQrUri = qrUri;
                     qrImg.src = generateQrDataUrl(qrUri, 180);
                     }
                    }, wasAlreadyOpen ? 220 : 190);
                }
            }
        };
    }

    function getRole() { return typeof currentRole !== "undefined" ? currentRole : "student"; }
    function getUser() { return typeof currentUser !== "undefined" && currentUser ? currentUser : { name: "Student", phone: "", email: "", college: "" }; }
    function getActiveCollege() {
        const role = getRole();
        if (role === "admin" || role === "staff" || role === "auditor") return typeof currentAdminCollege !== "undefined" ? currentAdminCollege : "VPIET";
        return getUser().college || "";
    }
    function getActiveCollegeRecord() {
        const colName = getActiveCollege();
        if (typeof colleges !== "undefined" && Array.isArray(colleges) && colName) {
            return colleges.find(c => c.name.toLowerCase() === colName.toLowerCase()) || null;
        }
        return null;
    }

    function showMiniToast(msg) {
        const toast = document.getElementById("cbSbToast");
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
    }

    function buildSidebarDOM() {
        installFastTrayDrawer();

        const headerActions = document.querySelector("header .header-actions");
        if (headerActions && !document.getElementById("cbSbOpenBtn")) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.id = "cbSbOpenBtn";
            btn.className = "cb-sb-menu-btn";
            btn.setAttribute("aria-label", "Open Menu");
            btn.title = "Open Side Menu";
            btn.innerHTML = "<span></span><span></span><span></span>";
            btn.addEventListener("click", openSidebar);
            headerActions.appendChild(btn);
        }

        const wrapper = document.createElement("div");
        wrapper.id = "cbSidebarRoot";
        wrapper.innerHTML = `
            <div class="cb-sb-overlay" id="cbSbOverlay"></div>

            <aside class="cb-sb-drawer" id="cbSbDrawer" aria-hidden="true">
                <div class="cb-sb-header">
                    <div class="cb-sb-header-top">
                     <div class="cb-sb-brand-mini"><span>🍴</span><span>CampusBites Menu</span></div>
                     <button type="button" class="cb-sb-close-btn" id="cbSbCloseBtn" aria-label="Close Menu">×</button>
                    </div>
                    <div class="cb-sb-profile-box">
                     <div class="cb-sb-avatar" id="cbSbAvatar">🎓</div>
                     <div class="cb-sb-profile-meta">
                     <div class="cb-sb-profile-name" id="cbSbProfileName">Student</div>
                     <div class="cb-sb-profile-sub" id="cbSbProfileSub">CampusBites Pass</div>
                     </div>
                    </div>
                </div>

                <div class="cb-sb-body">
                    <div class="cb-sb-section-label">🎨 Appearance & Speed</div>
                    <div class="cb-sb-toggles-grid">
                     <button type="button" class="cb-sb-toggle-card" id="cbSbThemeCard">
                     <div class="cb-sb-toggle-top"><span id="cbSbThemeIcon">🌙</span><span class="cb-sb-pill-badge" id="cbSbThemeBadge">LIGHT</span></div>
                     <div class="cb-sb-toggle-title">Color Theme</div>
                     <div class="cb-sb-toggle-sub" id="cbSbThemeSub">Tap for Dark Mode</div>
                     </button>
                     <button type="button" class="cb-sb-toggle-card" id="cbSbStyleCard">
                     <div class="cb-sb-toggle-top"><span id="cbSbStyleIcon">⚡</span><span class="cb-sb-pill-badge" id="cbSbStyleBadge">NORMAL</span></div>
                     <div class="cb-sb-toggle-title">UI Style</div>
                     <div class="cb-sb-toggle-sub" id="cbSbStyleSub">Fast Solid Mode</div>
                     </button>
                    </div>

                    <div class="cb-sb-section-label">🧭 Quick Navigation</div>
                    <div class="cb-sb-list" id="cbSbQuickNavList"></div>

                    <div class="cb-sb-section-label">🤝 Support & Essential Options</div>
                    <div class="cb-sb-list">
                     <button type="button" class="cb-sb-item" id="cbSbContactBtn">
                     <div class="cb-sb-item-left"><div class="cb-sb-item-icon">📞</div><div><div class="cb-sb-item-title">Contact Us</div><div class="cb-sb-item-desc">Canteen helpdesk & tech support</div></div></div>
                     <span class="cb-sb-arrow">›</span>
                     </button>
                     <button type="button" class="cb-sb-item" id="cbSbFeedbackBtn">
                     <div class="cb-sb-item-left"><div class="cb-sb-item-icon">💬</div><div><div class="cb-sb-item-title">Feedback & Rating</div><div class="cb-sb-item-desc">Share suggestions or report an issue</div></div></div>
                     <span class="cb-sb-arrow">›</span>
                     </button>
                     <button type="button" class="cb-sb-item" id="cbSbFaqBtn">
                     <div class="cb-sb-item-left"><div class="cb-sb-item-icon">❓</div><div><div class="cb-sb-item-title">Help & FAQ</div><div class="cb-sb-item-desc">Orders, UPI linking & PIN guide</div></div></div>
                     <span class="cb-sb-arrow">›</span>
                     </button>
                     <button type="button" class="cb-sb-item" id="cbSbShareBtn">
                     <div class="cb-sb-item-left"><div class="cb-sb-item-icon">📤</div><div><div class="cb-sb-item-title">Share CampusBites</div><div class="cb-sb-item-desc">Invite friends to your college canteen</div></div></div>
                     <span class="cb-sb-arrow">›</span>
                     </button>
                     <button type="button" class="cb-sb-item" id="cbSbAboutBtn">
                     <div class="cb-sb-item-left"><div class="cb-sb-item-icon">🛡️</div><div><div class="cb-sb-item-title">About & Privacy</div><div class="cb-sb-item-desc">Security, version & terms</div></div></div>
                     <span class="cb-sb-arrow">›</span>
                     </button>
                     <button type="button" class="cb-sb-item danger-item" id="cbSbDeleteAccBtn" style="display:none;">
                     <div class="cb-sb-item-left"><div class="cb-sb-item-icon" style="background:#fee2e2;">🗑️</div><div><div class="cb-sb-item-title" id="cbSbDeleteAccTitle">Delete My Account</div><div class="cb-sb-item-desc">Remove account (re-login allowed later)</div></div></div>
                     <span class="cb-sb-arrow" style="color:#dc2626;">›</span>
                     </button>
                    </div>
                </div>

                <div class="cb-sb-footer">
                    <button type="button" class="cb-sb-logout-btn" id="cbSbLogoutBtn">🚪 Switch Role / Logout</button>
                    <div class="cb-sb-version-note">CampusBites Official Network • Fast & Secure</div>
                </div>
            </aside>

            <!-- MODAL: DELETE ACCOUNT CONFIRMATION -->
            <div class="cb-sb-modal" id="cbSbDeleteAccModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                     <h3 style="color:#dc2626;" id="cbSbDelModalHeading">🗑️ Remove Account</h3>
                     <button type="button" class="close-drawer" data-cb-close-modal="cbSbDeleteAccModal">×</button>
                    </div>
                    <p id="cbSbDelModalDesc" style="font-size:12px; color:var(--text-muted); font-weight:600; line-height:1.5; margin-bottom:12px;">
                     Are you sure you want to remove your account? You can register and log in again anytime later using the same mobile number or email ID.
                    </p>
                    <div class="form-group">
                     <label id="cbSbDelPinLabel">Enter Your PIN to Confirm *</label>
                     <input type="password" class="form-control" id="cbSbDelPinInput" maxlength="6" placeholder="Enter PIN">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                     <button type="button" class="checkout-btn" id="cbSbConfirmDeleteBtn" style="background:#dc2626; padding:10px;">Yes, Delete</button>
                     <button type="button" class="checkout-btn" data-cb-close-modal="cbSbDeleteAccModal" style="background:#475569; padding:10px;">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- MODAL: CONTACT US -->
            <div class="cb-sb-modal" id="cbSbContactModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                     <h3>📞 Contact & Helpdesk</h3>
                     <button type="button" class="close-drawer" data-cb-close-modal="cbSbContactModal">×</button>
                    </div>
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px; font-weight:600; line-height:1.45;">
                     Need help with an order, UPI receipt, or college canteen setup? Reach out to us directly below.
                    </p>
                    <div class="cb-sb-contact-row" id="cbSbCollegeAdminContactRow" style="display:none;">
                     <div>
                     <div style="font-size:10.5px; font-weight:900; color:var(--primary); text-transform:uppercase;">🏛️ Active College Admin</div>
                     <div style="font-size:13px; font-weight:800; margin-top:2px;" id="cbSbContactAdminEmail">admin@college.ac.in</div>
                     </div>
                     <button type="button" class="cb-sb-mini-btn" id="cbSbCopyAdminEmailBtn">📋 Copy</button>
                    </div>
                    <div class="cb-sb-contact-row">
                     <div>
                     <div style="font-size:10.5px; font-weight:900; color:#10b981; text-transform:uppercase;">📧 Official Support Email</div>
                     <div style="font-size:13px; font-weight:800; margin-top:2px;">support@campusbites.in</div>
                     </div>
                     <a class="cb-sb-mini-btn" href="mailto:support@campusbites.in?subject=CampusBites%20Support">Mail</a>
                    </div>
                    <div class="cb-sb-contact-row">
                     <div>
                     <div style="font-size:10.5px; font-weight:900; color:#f59e0b; text-transform:uppercase;">☎️ Canteen Helpdesk Helpline</div>
                     <div style="font-size:13px; font-weight:800; margin-top:2px;">+91 98765 43210</div>
                     <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">Mon – Sat • 8:00 AM to 6:00 PM</div>
                     </div>
                     <a class="cb-sb-mini-btn" href="tel:+919876543210" style="background:#059669;">Call</a>
                    </div>
                    <button type="button" class="checkout-btn" data-cb-close-modal="cbSbContactModal" style="margin-top:10px; padding:10px;">Close Contact</button>
                </div>
            </div>

            <!-- MODAL: FEEDBACK -->
            <div class="cb-sb-modal" id="cbSbFeedbackModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                     <h3>💬 Send Feedback</h3>
                     <button type="button" class="close-drawer" data-cb-close-modal="cbSbFeedbackModal">×</button>
                    </div>
                    <p style="font-size:11.5px; color:var(--text-muted); font-weight:600; text-align:center;">How is your experience with CampusBites?</p>
                    <div class="cb-sb-stars" id="cbSbStarContainer">
                     <button type="button" class="cb-sb-star lit" data-star="1">⭐</button>
                     <button type="button" class="cb-sb-star lit" data-star="2">⭐</button>
                     <button type="button" class="cb-sb-star lit" data-star="3">⭐</button>
                     <button type="button" class="cb-sb-star lit" data-star="4">⭐</button>
                     <button type="button" class="cb-sb-star lit" data-star="5">⭐</button>
                    </div>
                    <div class="form-group">
                     <label>Feedback Category</label>
                     <select class="form-control" id="cbSbFbCategory">
                     <option value="Food Quality & Taste">🍔 Food Quality & Taste</option>
                     <option value="App Speed & Design">⚡ App Speed & Design</option>
                     <option value="UPI / Payment Experience">💳 UPI / Payment Experience</option>
                     <option value="Feature Suggestion">💡 Feature Suggestion</option>
                     <option value="Report a Bug / Issue">🐞 Report a Bug / Issue</option>
                     </select>
                    </div>
                    <div class="form-group">
                     <label>Your Message *</label>
                     <textarea class="form-control" id="cbSbFbMessage" rows="3" placeholder="Tell us what you liked or what we can improve..." style="resize:vertical;"></textarea>
                    </div>
                    <button type="button" class="checkout-btn" id="cbSbSubmitFbBtn" style="background:#10b981; margin-top:4px;">🚀 Submit Feedback</button>
                    <div id="cbSbFeedbackHistoryWrap" style="margin-top:14px; display:none;">
                     <label style="font-size:10.5px; font-weight:900; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:6px;">Recent Feedback Submissions</label>
                     <div id="cbSbFeedbackHistoryList" style="max-height:150px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;"></div>
                    </div>
                </div>
            </div>

            <!-- MODAL: FAQ -->
            <div class="cb-sb-modal" id="cbSbFaqModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                     <h3>❓ Help & Frequently Asked Questions</h3>
                     <button type="button" class="close-drawer" data-cb-close-modal="cbSbFaqModal">×</button>
                    </div>
                    <div class="cb-sb-faq-item open">
                     <button type="button" class="cb-sb-faq-q"><span>1. How do I join my college canteen?</span><span>▾</span></button>
                     <div class="cb-sb-faq-a">Open the Canteens tab and tap <b>Scan / Add College</b>. Scan your college's official QR code using your camera or upload the QR image to unlock all canteens.</div>
                    </div>
                    <div class="cb-sb-faq-item">
                     <button type="button" class="cb-sb-faq-q"><span>2. Why is a food item marked Sold Out?</span><span>▾</span></button>
                     <div class="cb-sb-faq-a">Canteen staff update daily quantities live (including walk-in sales). Items with 0 quantity left cannot be ordered until the canteen restocks them.</div>
                    </div>
                    <div class="cb-sb-faq-item">
                     <button type="button" class="cb-sb-faq-q"><span>3. Can I delete my account and come back later?</span><span>▾</span></button>
                     <div class="cb-sb-faq-a">Yes! Both Students and College Admins can delete their accounts anytime from this sidebar. Your phone/email is immediately freed so you can sign up again later.</div>
                    </div>
                    <div class="cb-sb-faq-item">
                     <button type="button" class="cb-sb-faq-q"><span>4. Why Normal Mode vs Glass Mode?</span><span>▾</span></button>
                     <div class="cb-sb-faq-a"><b>Normal Mode</b> removes heavy blur effects so the app runs smoothly on all phones. <b>Glass Mode</b> enables translucent Liquid Glass styling.</div>
                    </div>
                    <button type="button" class="checkout-btn" data-cb-close-modal="cbSbFaqModal" style="margin-top:10px; padding:10px;">Got It</button>
                </div>
            </div>

            <!-- MODAL: ABOUT -->
            <div class="cb-sb-modal" id="cbSbAboutModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                     <h3>🛡️ About CampusBites & Privacy</h3>
                     <button type="button" class="close-drawer" data-cb-close-modal="cbSbAboutModal">×</button>
                    </div>
                    <div style="text-align:center; padding:8px 0 12px;">
                     <div style="font-size:34px; margin-bottom:4px;">🍴</div>
                     <div style="font-size:16px; font-weight:900;">CampusBites Canteen Network</div>
                     <div style="font-size:11px; color:var(--text-muted); font-weight:700;">Digital Pass • Live Stock • Compact Bill Print</div>
                    </div>
                    <div style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); border-radius:12px; padding:11px 12px; font-size:11.5px; color:var(--text-muted); line-height:1.55; font-weight:600; margin-bottom:12px;">
                     • <b>Anti-Fraud Receipts:</b> Cryptographic signature hashes, live clocks &amp; 2-digit Counter Handshake PINs.<br>
                     • <b>Full Account Control:</b> Delete your student or college account anytime and re-register cleanly.<br>
                     • <b>Fast Performance:</b> Switch between Light/Dark and Normal/Glass modes anytime.
                    </div>
                    <button type="button" class="checkout-btn" data-cb-close-modal="cbSbAboutModal" style="padding:10px;">Close</button>
                </div>
            </div>

            <div class="cb-sb-toast" id="cbSbToast"></div>
        `;
        document.body.appendChild(wrapper);
        bindSidebarEvents();
    }

    function refreshSidebarUI() {
        const role = getRole();
        const user = getUser();
        const activeCol = getActiveCollege();

        const avatarEl = document.getElementById("cbSbAvatar");
        const nameEl = document.getElementById("cbSbProfileName");
        const subEl = document.getElementById("cbSbProfileSub");

        if (role === "admin") {
            avatarEl.textContent = "🏛️";
            nameEl.textContent = `Admin • ${activeCol || "College"}`;
            subEl.textContent = "College Administration Studio";
        } else if (role === "staff") {
            const canName = typeof currentStaffCanteen !== "undefined" && currentStaffCanteen ? currentStaffCanteen : "Counter";
            avatarEl.textContent = "👨‍🍳";
            nameEl.textContent = `${canName} Counter`;
            subEl.textContent = `${activeCol || "College"} Staff Portal`;
        } else if (role === "auditor") {
            avatarEl.textContent = "👑";
            nameEl.textContent = "App Creator";
            subEl.textContent = "Master Audit & Live Controls";
        } else {
            avatarEl.textContent = "🎓";
            nameEl.textContent = user.name || "Student";
            subEl.textContent = `${activeCol ? activeCol + " • " : ""}${user.phone || user.email || "Student Pass"}`;
        }

        // Show Delete Account button for Students & College Admins
        const delBtn = document.getElementById("cbSbDeleteAccBtn");
        const delTitle = document.getElementById("cbSbDeleteAccTitle");
        if (delBtn && delTitle) {
            if (role === "student") {
                delBtn.style.display = "flex";
                delTitle.textContent = "Delete My Student Account";
            } else if (role === "admin") {
                delBtn.style.display = "flex";
                delTitle.textContent = `Delete College (${activeCol})`;
            } else {
                delBtn.style.display = "none";
            }
        }

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const isGlass = document.documentElement.getAttribute("data-ui-style") === "glass";
        document.getElementById("cbSbThemeIcon").textContent = isDark ? "☀️" : "🌙";
        document.getElementById("cbSbThemeBadge").textContent = isDark ? "DARK" : "LIGHT";
        document.getElementById("cbSbThemeSub").textContent = isDark ? "Tap for Light Mode" : "Tap for Dark Mode";
        document.getElementById("cbSbStyleIcon").textContent = isGlass ? "✨" : "⚡";
        document.getElementById("cbSbStyleBadge").textContent = isGlass ? "GLASS" : "NORMAL";
        document.getElementById("cbSbStyleSub").textContent = isGlass ? "Tap for Fast Normal" : "Fast Solid • Tap for Glass";

        const navList = document.getElementById("cbSbQuickNavList");
        if (!navList) return;

        let items = [];
        if (role === "student") {
            items = [
                { icon: "🍔", title: "Canteens & Menu", desc: "Browse dishes & active offers", action: () => typeof switchTab === "function" && switchTab("menu") },
                { icon: "🧾", title: "My Digital Receipts", desc: "View tokens & Counter PINs", action: () => typeof switchTab === "function" && switchTab("receipts") },
                { icon: "📊", title: "My Spending Tracker", desc: "Daily, weekly & monthly stats", action: () => typeof switchTab === "function" && switchTab("spending") },
                { icon: "🏦", title: "Linked Bank / UPI", desc: "Manage payment accounts & PIN", action: () => typeof openStudentBankManagerModal === "function" && openStudentBankManagerModal() },
                { icon: "📲", title: "College Join QR", desc: "View or download campus QR", action: () => typeof openStudentQrPopup === "function" && openStudentQrPopup() },
                { icon: "📷", title: "Scan / Add College", desc: "Join another college via QR", action: () => typeof switchStudentCollegeQr === "function" && switchStudentCollegeQr() }
            ];
        } else {
            items = [
                { icon: "📦", title: "Daily Stock / Walk-In Qty", desc: "Update food counts & mark Sold Out", action: () => typeof openDailyStockModal === "function" && openDailyStockModal() },
                { icon: "🏗️", title: "Menu & Offers Studio", desc: "Edit dishes, prices & banners", action: () => typeof switchAdminTab === "function" && switchAdminTab("admin-studio") },
                { icon: "👨‍🍳", title: "Orders & Counter Ledger", desc: "Verify PINs, print bill & serve", action: () => typeof switchAdminTab === "function" && switchAdminTab("admin-ledger") },
                { icon: "🍲", title: "Kitchen Food Prep Count", desc: "Dish quantities (High to Low)", action: () => typeof openFoodPrepModal === "function" && openFoodPrepModal() },
                { icon: "👀", title: "Preview Student View", desc: "See live student menu layout", action: () => typeof switchTab === "function" && switchTab("menu") },
                { icon: "🔄", title: "Sync All Devices", desc: "Broadcast latest updates now", action: () => typeof forceManualCloudSync === "function" && forceManualCloudSync() }
            ];
            if (role === "auditor") {
                items.unshift({
                    icon: "👑", title: "Creator Audit & Switches", desc: "Online Pay ON/OFF & Maintenance",
                    action: () => typeof switchAdminTab === "function" && switchAdminTab("auditor-portal")
                });
            }
        }

        navList.innerHTML = "";
        items.forEach(item => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cb-sb-item";
            btn.innerHTML = `
                <div class="cb-sb-item-left">
                    <div class="cb-sb-item-icon">${item.icon}</div>
                    <div>
                     <div class="cb-sb-item-title">${item.title}</div>
                     <div class="cb-sb-item-desc">${item.desc}</div>
                    </div>
                </div>
                <span class="cb-sb-arrow">›</span>
            `;
            btn.addEventListener("click", () => { closeSidebar(); item.action(); });
            navList.appendChild(btn);
        });
    }

    function openSidebar() {
        refreshSidebarUI();
        document.getElementById("cbSbOverlay")?.classList.add("open");
        const drawer = document.getElementById("cbSbDrawer");
        if (drawer) { drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); }
        try { history.pushState({ cbSidebar: true }, ""); } catch (e) {}
    }

    function closeSidebar() {
        document.getElementById("cbSbOverlay")?.classList.remove("open");
        const drawer = document.getElementById("cbSbDrawer");
        if (drawer) { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); }
    }

    function openSubModal(modalId) {
        closeSidebar();
        const el = document.getElementById(modalId);
        if (!el) return;
        if (modalId === "cbSbContactModal") populateContactModal();
        if (modalId === "cbSbFeedbackModal") renderFeedbackHistory();
        if (modalId === "cbSbDeleteAccModal") prepareDeleteAccountModal();
        el.classList.add("active");
        try { history.pushState({ cbSidebarModal: modalId }, ""); } catch (e) {}
    }

    function closeSubModal(modalId) {
        document.getElementById(modalId)?.classList.remove("active");
    }

    function closeAllSidebarOverlays() {
        ["cbSbContactModal", "cbSbFeedbackModal", "cbSbFaqModal", "cbSbAboutModal", "cbSbDeleteAccModal"].forEach(id => {
            document.getElementById(id)?.classList.remove("active");
        });
        if (document.getElementById("cbSbDrawer")?.classList.contains("open")) closeSidebar();
    }

    function prepareDeleteAccountModal() {
        const role = getRole();
        const activeCol = getActiveCollege();
        const heading = document.getElementById("cbSbDelModalHeading");
        const desc = document.getElementById("cbSbDelModalDesc");
        const pinLabel = document.getElementById("cbSbDelPinLabel");
        const pinInput = document.getElementById("cbSbDelPinInput");
        if (pinInput) pinInput.value = "";

        if (role === "admin") {
            heading.textContent = `🗑️ Delete College "${activeCol}"`;
            desc.textContent = `This will permanently remove "${activeCol}", its canteens, menu, and offers. You are permitted to register again later using the same college name or Admin Email ID.`;
            pinLabel.textContent = "Enter College Admin PIN to Confirm *";
        } else {
            heading.textContent = "🗑️ Delete My Student Account";
            desc.textContent = "This will remove your Student profile from CampusBites. You are permitted to sign up again anytime later using the same mobile number or email ID.";
            pinLabel.textContent = "Enter Your 4-Digit Student PIN to Confirm *";
        }
    }

    function confirmDeleteFromSidebar() {
        const role = getRole();
        const enteredPin = (document.getElementById("cbSbDelPinInput")?.value || "").trim();
        if (!enteredPin) { showMiniToast("⚠️ Please enter your PIN to confirm"); return; }

        if (role === "student") {
            if (typeof deleteCurrentStudentAccount === "function") {
                const ok = deleteCurrentStudentAccount(enteredPin);
                if (ok) closeSubModal("cbSbDeleteAccModal");
            }
        } else if (role === "admin") {
            const colObj = getActiveCollegeRecord();
            const expectedPin = (colObj && colObj.adminPin) ? String(colObj.adminPin) : "2727";
            if (enteredPin !== expectedPin) { alert("❌ Incorrect College Admin PIN!"); return; }
            if (typeof deleteCurrentCollegeAccount === "function") {
                deleteCurrentCollegeAccount(getActiveCollege());
                closeSubModal("cbSbDeleteAccModal");
            }
        }
    }

    function populateContactModal() {
        const colObj = getActiveCollegeRecord();
        const adminRow = document.getElementById("cbSbCollegeAdminContactRow");
        const adminEmailEl = document.getElementById("cbSbContactAdminEmail");
        if (colObj && colObj.email && adminRow && adminEmailEl) {
            adminRow.style.display = "flex";
            adminEmailEl.textContent = `${colObj.name}: ${colObj.email}`;
            document.getElementById("cbSbCopyAdminEmailBtn").onclick = () => {
                navigator.clipboard && navigator.clipboard.writeText(colObj.email);
                showMiniToast(`📋 Copied ${colObj.email}`);
            };
        } else if (adminRow) {
            adminRow.style.display = "none";
        }
    }

    let selectedStarRating = 5;
    function updateStarUI(rating) {
        selectedStarRating = rating;
        document.querySelectorAll("#cbSbStarContainer .cb-sb-star").forEach(btn => {
            btn.classList.toggle("lit", Number(btn.getAttribute("data-star")) <= rating);
        });
    }

    function getSavedFeedback() {
        try { return JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)) || []; } catch (e) { return []; }
    }

    function escapeHtml(str) {
        return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function renderFeedbackHistory() {
        const list = getSavedFeedback();
        const wrap = document.getElementById("cbSbFeedbackHistoryWrap");
        const container = document.getElementById("cbSbFeedbackHistoryList");
        if (!wrap || !container) return;
        if (list.length === 0) { wrap.style.display = "none"; return; }
        wrap.style.display = "block";
        container.innerHTML = list.slice(0, 8).map(fb => `
            <div style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); border-radius:10px; padding:8px 10px; font-size:11.5px;">
                <div style="display:flex; justify-content:space-between; font-weight:800; margin-bottom:2px;">
                    <span>${"⭐".repeat(fb.rating || 5)} • ${fb.category}</span>
                    <span style="color:var(--text-muted); font-size:10px;">${fb.date}</span>
                </div>
                <div style="color:var(--text-main); font-weight:600;">${escapeHtml(fb.message)}</div>
                <div style="color:var(--text-muted); font-size:10px; margin-top:2px;">— ${escapeHtml(fb.author)} (${escapeHtml(fb.college || "General")})</div>
            </div>
        `).join("");
    }

    async function handleFeedbackSubmit() {
        const msgEl = document.getElementById("cbSbFbMessage");
        const catEl = document.getElementById("cbSbFbCategory");
        const submitBtn = document.getElementById("cbSbSubmitFbBtn");
        const message = (msgEl ? msgEl.value : "").trim();
        if (!message) { showMiniToast("⚠️ Please write your feedback message first"); return; }

        const user = getUser();
        const entry = {
            id: "fb_" + Date.now(), rating: selectedStarRating, category: catEl ? catEl.value : "General",
            message, author: user.name || getRole(), college: getActiveCollege() || "CampusBites",
            date: new Date().toLocaleDateString()
        };
        const existing = getSavedFeedback();
        existing.unshift(entry);
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));

        if (typeof cloudConfig !== "undefined" && cloudConfig.emailPublicKey && cloudConfig.emailServiceId && cloudConfig.emailTemplateId && window.emailjs) {
            const colObj = getActiveCollegeRecord();
            try {
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }
                await emailjs.send(cloudConfig.emailServiceId, cloudConfig.emailTemplateId, {
                    to_email: (colObj && colObj.email) ? colObj.email : "support@campusbites.in",
                    to_name: "CampusBites Team",
                    message: `[Feedback ${entry.rating}★ | ${entry.category}] From ${entry.author} (${entry.college}): ${entry.message}`
                });
            } catch (e) {}
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "🚀 Submit Feedback"; }
        }

        if (msgEl) msgEl.value = "";
        updateStarUI(5);
        renderFeedbackHistory();
        showMiniToast("✅ Thank you! Your feedback has been submitted.");
    }

    function handleShareApp() {
        closeSidebar();
        const col = getActiveCollege();
        const shareUrl = typeof getCollegeInviteUrl === "function" ? getCollegeInviteUrl(col) : window.location.href;
        if (navigator.share) {
            navigator.share({ title: col ? `CampusBites — ${col}` : "CampusBites", text: "Order food faster on CampusBites!", url: shareUrl }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            showMiniToast("📋 Invite link copied to clipboard!");
        }
    }

    function bindSidebarEvents() {
        document.getElementById("cbSbOverlay")?.addEventListener("click", closeSidebar);
        document.getElementById("cbSbCloseBtn")?.addEventListener("click", closeSidebar);

        document.getElementById("cbSbThemeCard")?.addEventListener("click", () => {
            if (typeof toggleThemeMode === "function") toggleThemeMode();
            refreshSidebarUI();
            showMiniToast(document.documentElement.getAttribute("data-theme") === "dark" ? "🌙 Dark Mode Enabled" : "☀️ Light Mode Enabled");
        });

        document.getElementById("cbSbStyleCard")?.addEventListener("click", () => {
            if (typeof toggleUiStyle === "function") toggleUiStyle();
            refreshSidebarUI();
            showMiniToast(document.documentElement.getAttribute("data-ui-style") === "glass" ? "✨ Glass UI Enabled" : "⚡ Normal (Fast) UI Enabled");
        });

        document.getElementById("cbSbContactBtn")?.addEventListener("click", () => openSubModal("cbSbContactModal"));
        document.getElementById("cbSbFeedbackBtn")?.addEventListener("click", () => openSubModal("cbSbFeedbackModal"));
        document.getElementById("cbSbFaqBtn")?.addEventListener("click", () => openSubModal("cbSbFaqModal"));
        document.getElementById("cbSbShareBtn")?.addEventListener("click", handleShareApp);
        document.getElementById("cbSbAboutBtn")?.addEventListener("click", () => openSubModal("cbSbAboutModal"));
        document.getElementById("cbSbDeleteAccBtn")?.addEventListener("click", () => openSubModal("cbSbDeleteAccModal"));
        document.getElementById("cbSbConfirmDeleteBtn")?.addEventListener("click", confirmDeleteFromSidebar);

        document.getElementById("cbSbLogoutBtn")?.addEventListener("click", () => {
            closeSidebar();
            if (typeof logoutAndOpenAuthGate === "function") logoutAndOpenAuthGate();
        });

        document.querySelectorAll("[data-cb-close-modal]").forEach(btn => {
            btn.addEventListener("click", () => closeSubModal(btn.getAttribute("data-cb-close-modal")));
        });
        document.querySelectorAll(".cb-sb-modal").forEach(modal => {
            modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
        });

        document.querySelectorAll("#cbSbStarContainer .cb-sb-star").forEach(btn => {
            btn.addEventListener("click", () => updateStarUI(Number(btn.getAttribute("data-star"))));
        });
        document.getElementById("cbSbSubmitFbBtn")?.addEventListener("click", handleFeedbackSubmit);

        document.querySelectorAll(".cb-sb-faq-q").forEach(qBtn => {
            qBtn.addEventListener("click", () => qBtn.closest(".cb-sb-faq-item")?.classList.toggle("open"));
        });

        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllSidebarOverlays(); });
        window.addEventListener("popstate", closeAllSidebarOverlays);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildSidebarDOM);
    else buildSidebarDOM();
})();
