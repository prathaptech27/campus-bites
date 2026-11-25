/* ============================================================================
   CampusBites — 3-Bar Slide-Out Side Window & Essential Utilities
   File: sidebar-menu.js
   Usage: Upload alongside index.html and add:
          <script src="sidebar-menu.js"></script> before </body> in index.html
   ============================================================================ */
(function () {
    "use strict";

    if (window.__CB_SIDEBAR_INITIALIZED__) return;
    window.__CB_SIDEBAR_INITIALIZED__ = true;

    const FEEDBACK_STORAGE_KEY = "cb_user_feedback_v1";

    /* ------------------------------------------------------------------------
       1. INJECT STYLES (LIGHT/DARK + NORMAL/GLASS AWARE)
       ------------------------------------------------------------------------ */
    const sidebarCSS = `
        /* Declutter top header — move secondary controls into 3-bar sidebar */
        header #headerStyleToggleBtn,
        header #headerThemeToggleBtn,
        header .switch-auth-btn {
            display: none !important;
        }

        /* 3-Bar Hamburger Button in Top Bar */
        .cb-sb-menu-btn {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid var(--liquid-glass-border, #e2e8f0);
            background: var(--surface-row-bg, #ffffff);
            color: var(--text-main, #0f172a);
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4.5px;
            cursor: pointer;
            box-shadow: var(--liquid-glass-shadow, 0 2px 8px rgba(15, 23, 42, 0.08));
            flex-shrink: 0;
            transition: transform 0.15s ease, background 0.2s ease;
            padding: 0;
        }
        .cb-sb-menu-btn:active {
            transform: scale(0.93);
        }
        .cb-sb-menu-btn span {
            display: block;
            width: 18px;
            height: 2.2px;
            border-radius: 3px;
            background: currentColor;
            transition: 0.2s ease;
        }
        .cb-sb-menu-btn span:nth-child(2) {
            width: 13px;
            align-self: flex-end;
            margin-right: 9px;
        }

        /* Backdrop Overlay */
        .cb-sb-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.48);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 540;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.22s ease;
        }
        .cb-sb-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        /* Slide-Out Side Window */
        .cb-sb-drawer {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(330px, 86vw);
            background: var(--drawer-glass-bg, #ffffff);
            backdrop-filter: blur(22px) saturate(190%);
            -webkit-backdrop-filter: blur(22px) saturate(190%);
            border-left: 1.5px solid var(--liquid-glass-border, #e2e8f0);
            box-shadow: -12px 0 36px rgba(15, 23, 42, 0.28);
            z-index: 550;
            display: flex;
            flex-direction: column;
            transform: translate3d(105%, 0, 0);
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
            color: var(--text-main, #0f172a);
        }
        .cb-sb-drawer.open {
            transform: translate3d(0, 0, 0);
        }

        /* Fast Solid Normal Mode Overrides */
        [data-ui-style="normal"] .cb-sb-overlay {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(15, 23, 42, 0.62);
        }
        [data-ui-style="normal"] .cb-sb-drawer {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            box-shadow: -6px 0 24px rgba(0, 0, 0, 0.22);
        }

        /* Sidebar Header & Profile Card */
        .cb-sb-header {
            padding: 16px 16px 14px;
            background: linear-gradient(135deg, var(--primary, #4f46e5), var(--primary-dark, #4338ca));
            color: #ffffff;
            position: relative;
        }
        .cb-sb-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        .cb-sb-brand-mini {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: -0.2px;
        }
        .cb-sb-close-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.35);
            background: rgba(255, 255, 255, 0.16);
            color: #ffffff;
            font-size: 18px;
            font-weight: 900;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        .cb-sb-profile-box {
            display: flex;
            align-items: center;
            gap: 11px;
            background: rgba(255, 255, 255, 0.14);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 14px;
            padding: 10px 12px;
        }
        .cb-sb-avatar {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: #ffffff;
            color: var(--primary, #4f46e5);
            font-size: 19px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .cb-sb-profile-meta {
            min-width: 0;
            flex: 1;
        }
        .cb-sb-profile-name {
            font-size: 14px;
            font-weight: 900;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .cb-sb-profile-sub {
            font-size: 11px;
            color: #e0e7ff;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 2px;
        }

        /* Scrollable Body */
        .cb-sb-body {
            flex: 1;
            overflow-y: auto;
            padding: 12px 14px;
        }
        .cb-sb-section-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: var(--text-muted, #64748b);
            margin: 10px 4px 6px;
        }
        .cb-sb-section-label:first-child {
            margin-top: 2px;
        }

        /* Toggle Switches Row */
        .cb-sb-toggles-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 8px;
        }
        .cb-sb-toggle-card {
            background: var(--surface-sub-bg, #f8fafc);
            border: 1px solid var(--liquid-glass-border, #e2e8f0);
            border-radius: 14px;
            padding: 10px;
            cursor: pointer;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 4px;
            color: var(--text-main, #0f172a);
            transition: border-color 0.15s ease, transform 0.12s ease;
        }
        .cb-sb-toggle-card:active {
            transform: scale(0.97);
        }
        .cb-sb-toggle-card:hover {
            border-color: var(--primary, #4f46e5);
        }
        .cb-sb-toggle-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 15px;
        }
        .cb-sb-pill-badge {
            font-size: 9.5px;
            font-weight: 900;
            padding: 2px 7px;
            border-radius: 10px;
            background: rgba(99, 102, 241, 0.16);
            color: var(--primary, #4f46e5);
            text-transform: uppercase;
        }
        [data-theme="dark"] .cb-sb-pill-badge {
            color: #a5b4fc;
        }
        .cb-sb-toggle-title {
            font-size: 12px;
            font-weight: 800;
        }
        .cb-sb-toggle-sub {
            font-size: 10px;
            color: var(--text-muted, #64748b);
            font-weight: 600;
        }

        /* Sidebar List Items */
        .cb-sb-list {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .cb-sb-item {
            width: 100%;
            background: var(--surface-row-bg, #ffffff);
            border: 1px solid var(--liquid-glass-border, #e2e8f0);
            border-radius: 13px;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            color: var(--text-main, #0f172a);
            text-align: left;
            transition: border-color 0.15s ease, transform 0.12s ease;
        }
        .cb-sb-item:hover {
            border-color: var(--primary, #4f46e5);
        }
        .cb-sb-item:active {
            transform: scale(0.985);
        }
        .cb-sb-item-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        .cb-sb-item-icon {
            width: 32px;
            height: 32px;
            border-radius: 9px;
            background: var(--surface-sub-bg, #f1f5f9);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            flex-shrink: 0;
        }
        .cb-sb-item-title {
            font-size: 12.5px;
            font-weight: 800;
            line-height: 1.2;
        }
        .cb-sb-item-desc {
            font-size: 10.5px;
            color: var(--text-muted, #64748b);
            font-weight: 600;
            margin-top: 1px;
        }
        .cb-sb-arrow {
            font-size: 13px;
            color: var(--text-muted, #94a3b8);
            font-weight: 900;
        }

        /* Sidebar Footer */
        .cb-sb-footer {
            padding: 12px 14px;
            border-top: 1px solid var(--liquid-glass-border, #e2e8f0);
            background: var(--surface-sub-bg, #f8fafc);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .cb-sb-logout-btn {
            width: 100%;
            background: #0f172a;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 11px;
            border-radius: 13px;
            font-size: 12.5px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        [data-theme="dark"] .cb-sb-logout-btn {
            background: #dc2626;
        }
        .cb-sb-version-note {
            text-align: center;
            font-size: 10px;
            color: var(--text-muted, #64748b);
            font-weight: 700;
        }

        /* Sub-Modals (Contact, Feedback, FAQ, About) */
        .cb-sb-modal {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.56);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 650;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 14px;
        }
        .cb-sb-modal.active {
            display: flex;
        }
        [data-ui-style="normal"] .cb-sb-modal {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(15, 23, 42, 0.65);
        }
        .cb-sb-modal-card {
            background: var(--modal-glass-bg, #ffffff);
            border: 1.5px solid var(--liquid-glass-border, #e2e8f0);
            border-radius: 24px;
            width: 100%;
            max-width: 440px;
            max-height: 88vh;
            overflow-y: auto;
            padding: 20px;
            color: var(--text-main, #0f172a);
            box-shadow: var(--liquid-glass-shadow, 0 18px 40px rgba(0, 0, 0, 0.3));
        }
        .cb-sb-modal-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            margin-bottom: 12px;
            border-bottom: 1px solid var(--liquid-glass-border, #e2e8f0);
        }
        .cb-sb-modal-head h3 {
            font-size: 17px;
            font-weight: 900;
        }

        /* Contact Cards */
        .cb-sb-contact-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            background: var(--surface-sub-bg, #f8fafc);
            border: 1px solid var(--liquid-glass-border, #e2e8f0);
            border-radius: 13px;
            padding: 11px 12px;
            margin-bottom: 8px;
        }
        .cb-sb-mini-btn {
            background: var(--primary, #4f46e5);
            color: #ffffff;
            border: none;
            padding: 6px 11px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            text-decoration: none;
            white-space: nowrap;
        }

        /* Feedback Star Picker */
        .cb-sb-stars {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin: 8px 0 12px;
        }
        .cb-sb-star {
            font-size: 28px;
            cursor: pointer;
            background: none;
            border: none;
            filter: grayscale(1);
            opacity: 0.45;
            transition: transform 0.12s ease, opacity 0.12s ease;
        }
        .cb-sb-star.lit {
            filter: none;
            opacity: 1;
            transform: scale(1.1);
        }

        /* FAQ Accordion */
        .cb-sb-faq-item {
            background: var(--surface-sub-bg, #f8fafc);
            border: 1px solid var(--liquid-glass-border, #e2e8f0);
            border-radius: 12px;
            margin-bottom: 8px;
            overflow: hidden;
        }
        .cb-sb-faq-q {
            width: 100%;
            background: none;
            border: none;
            padding: 11px 13px;
            text-align: left;
            font-size: 12.5px;
            font-weight: 800;
            color: var(--text-main, #0f172a);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
        }
        .cb-sb-faq-a {
            display: none;
            padding: 0 13px 11px;
            font-size: 11.5px;
            color: var(--text-muted, #475569);
            line-height: 1.5;
            font-weight: 600;
        }
        .cb-sb-faq-item.open .cb-sb-faq-a {
            display: block;
        }

        /* Lightweight Floating Toast */
        .cb-sb-toast {
            position: fixed;
            bottom: 86px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: #0f172a;
            color: #ffffff;
            padding: 9px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 800;
            z-index: 750;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
            box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
            white-space: nowrap;
        }
        .cb-sb-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `;

    const styleEl = document.createElement("style");
    styleEl.id = "cb-sidebar-styles";
    styleEl.textContent = sidebarCSS;
    document.head.appendChild(styleEl);

    /* ------------------------------------------------------------------------
       2. SAFE ACCESSORS FOR INDEX.HTML GLOBALS
       ------------------------------------------------------------------------ */
    function getRole() {
        return typeof currentRole !== "undefined" ? currentRole : "student";
    }
    function getUser() {
        return typeof currentUser !== "undefined" && currentUser ? currentUser : { name: "Student", phone: "", email: "", college: "" };
    }
    function getActiveCollege() {
        const role = getRole();
        if (role === "admin" || role === "staff" || role === "auditor") {
            return typeof currentAdminCollege !== "undefined" ? currentAdminCollege : "VPIET";
        }
        return getUser().college || "";
    }
    function getActiveCollegeRecord() {
        const colName = getActiveCollege();
        if (typeof colleges !== "undefined" && Array.isArray(colleges) && colName) {
            return colleges.find(c => c.name === colName) || null;
        }
        return null;
    }

    function showMiniToast(msg) {
        let toast = document.getElementById("cbSbToast");
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
    }

    /* ------------------------------------------------------------------------
       3. BUILD SIDEBAR & MODALS DOM
       ------------------------------------------------------------------------ */
    function buildSidebarDOM() {
        // Insert 3-bar hamburger button into the Top Header
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

        // Overlay + Side Window + Sub-Modals + Mini Toast
        const wrapper = document.createElement("div");
        wrapper.id = "cbSidebarRoot";
        wrapper.innerHTML = `
            <div class="cb-sb-overlay" id="cbSbOverlay"></div>

            <aside class="cb-sb-drawer" id="cbSbDrawer" aria-hidden="true">
                <div class="cb-sb-header">
                    <div class="cb-sb-header-top">
                        <div class="cb-sb-brand-mini">
                            <span>🍴</span>
                            <span>CampusBites Menu</span>
                        </div>
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
                            <div class="cb-sb-toggle-top">
                                <span id="cbSbThemeIcon">🌙</span>
                                <span class="cb-sb-pill-badge" id="cbSbThemeBadge">LIGHT</span>
                            </div>
                            <div class="cb-sb-toggle-title">Color Theme</div>
                            <div class="cb-sb-toggle-sub" id="cbSbThemeSub">Tap for Dark Mode</div>
                        </button>

                        <button type="button" class="cb-sb-toggle-card" id="cbSbStyleCard">
                            <div class="cb-sb-toggle-top">
                                <span id="cbSbStyleIcon">⚡</span>
                                <span class="cb-sb-pill-badge" id="cbSbStyleBadge">NORMAL</span>
                            </div>
                            <div class="cb-sb-toggle-title">UI Style</div>
                            <div class="cb-sb-toggle-sub" id="cbSbStyleSub">Fast Solid Mode</div>
                        </button>
                    </div>

                    <div class="cb-sb-section-label">🧭 Quick Navigation</div>
                    <div class="cb-sb-list" id="cbSbQuickNavList"></div>

                    <div class="cb-sb-section-label">🤝 Support & Essential Options</div>
                    <div class="cb-sb-list">
                        <button type="button" class="cb-sb-item" id="cbSbContactBtn">
                            <div class="cb-sb-item-left">
                                <div class="cb-sb-item-icon">📞</div>
                                <div>
                                    <div class="cb-sb-item-title">Contact Us</div>
                                    <div class="cb-sb-item-desc">Canteen helpdesk & tech support</div>
                                </div>
                            </div>
                            <span class="cb-sb-arrow">›</span>
                        </button>

                        <button type="button" class="cb-sb-item" id="cbSbFeedbackBtn">
                            <div class="cb-sb-item-left">
                                <div class="cb-sb-item-icon">💬</div>
                                <div>
                                    <div class="cb-sb-item-title">Feedback & Rating</div>
                                    <div class="cb-sb-item-desc">Share suggestions or report an issue</div>
                                </div>
                            </div>
                            <span class="cb-sb-arrow">›</span>
                        </button>

                        <button type="button" class="cb-sb-item" id="cbSbFaqBtn">
                            <div class="cb-sb-item-left">
                                <div class="cb-sb-item-icon">❓</div>
                                <div>
                                    <div class="cb-sb-item-title">Help & FAQ</div>
                                    <div class="cb-sb-item-desc">Orders, UPI linking & PIN guide</div>
                                </div>
                            </div>
                            <span class="cb-sb-arrow">›</span>
                        </button>

                        <button type="button" class="cb-sb-item" id="cbSbShareBtn">
                            <div class="cb-sb-item-left">
                                <div class="cb-sb-item-icon">📤</div>
                                <div>
                                    <div class="cb-sb-item-title">Share CampusBites</div>
                                    <div class="cb-sb-item-desc">Invite friends to your college canteen</div>
                                </div>
                            </div>
                            <span class="cb-sb-arrow">›</span>
                        </button>

                        <button type="button" class="cb-sb-item" id="cbSbAboutBtn">
                            <div class="cb-sb-item-left">
                                <div class="cb-sb-item-icon">🛡️</div>
                                <div>
                                    <div class="cb-sb-item-title">About & Privacy</div>
                                    <div class="cb-sb-item-desc">Security, version & terms</div>
                                </div>
                            </div>
                            <span class="cb-sb-arrow">›</span>
                        </button>
                    </div>
                </div>

                <div class="cb-sb-footer">
                    <button type="button" class="cb-sb-logout-btn" id="cbSbLogoutBtn">
                        🚪 Switch Role / Logout
                    </button>
                    <div class="cb-sb-version-note">CampusBites Official Network • Fast & Secure</div>
                </div>
            </aside>

            <!-- MODAL 1: CONTACT US -->
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

            <!-- MODAL 2: FEEDBACK & RATING -->
            <div class="cb-sb-modal" id="cbSbFeedbackModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                        <h3>💬 Send Feedback</h3>
                        <button type="button" class="close-drawer" data-cb-close-modal="cbSbFeedbackModal">×</button>
                    </div>
                    <p style="font-size:11.5px; color:var(--text-muted); font-weight:600; text-align:center;">
                        How is your experience with CampusBites?
                    </p>

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

                    <button type="button" class="checkout-btn" id="cbSbSubmitFbBtn" style="background:#10b981; margin-top:4px;">
                        🚀 Submit Feedback
                    </button>

                    <div id="cbSbFeedbackHistoryWrap" style="margin-top:14px; display:none;">
                        <label style="font-size:10.5px; font-weight:900; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:6px;">
                            Recent Feedback Submissions
                        </label>
                        <div id="cbSbFeedbackHistoryList" style="max-height:150px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;"></div>
                    </div>
                </div>
            </div>

            <!-- MODAL 3: HELP & FAQ -->
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
                        <button type="button" class="cb-sb-faq-q"><span>2. Why is there Normal Mode and Glass Mode?</span><span>▾</span></button>
                        <div class="cb-sb-faq-a"><b>Normal Mode</b> removes heavy blur effects so the app runs smoothly and saves battery on all phones. <b>Glass Mode</b> enables translucent Liquid Glass styling. Switch anytime from this 3-bar menu!</div>
                    </div>

                    <div class="cb-sb-faq-item">
                        <button type="button" class="cb-sb-faq-q"><span>3. What is the 2-Digit Counter Handshake PIN?</span><span>▾</span></button>
                        <div class="cb-sb-faq-a">Every verified digital receipt gets a unique 2-digit PIN and live ticking clock to prevent fake screenshots. Show your Token # and PIN at the counter to collect your food.</div>
                    </div>

                    <div class="cb-sb-faq-item">
                        <button type="button" class="cb-sb-faq-q"><span>4. How do I link my Bank / UPI account?</span><span>▾</span></button>
                        <div class="cb-sb-faq-a">Tap <b>Link Bank / UPI</b> in the sidebar or student bar, select your bank, enter account details & set a 4-digit UPI PIN for fast in-app checkout.</div>
                    </div>

                    <button type="button" class="checkout-btn" data-cb-close-modal="cbSbFaqModal" style="margin-top:10px; padding:10px;">Got It</button>
                </div>
            </div>

            <!-- MODAL 4: ABOUT & PRIVACY -->
            <div class="cb-sb-modal" id="cbSbAboutModal">
                <div class="cb-sb-modal-card">
                    <div class="cb-sb-modal-head">
                        <h3>🛡️ About CampusBites & Privacy</h3>
                        <button type="button" class="close-drawer" data-cb-close-modal="cbSbAboutModal">×</button>
                    </div>
                    <div style="text-align:center; padding:8px 0 12px;">
                        <div style="font-size:34px; margin-bottom:4px;">🍴</div>
                        <div style="font-size:16px; font-weight:900;">CampusBites Canteen Network</div>
                        <div style="font-size:11px; color:var(--text-muted); font-weight:700;">Digital Pass • Instant UPI • Live Counter Sync</div>
                    </div>
                    <div style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); border-radius:12px; padding:11px 12px; font-size:11.5px; color:var(--text-muted); line-height:1.55; font-weight:600; margin-bottom:12px;">
                        • <b>Anti-Fraud Receipts:</b> Every order uses cryptographic signature hashes, live clocks, and 2-digit Counter Handshake PINs.<br>
                        • <b>Student Privacy:</b> Your order history, spending analytics, and linked preferences remain isolated to your account.<br>
                        • <b>Performance Choice:</b> Toggle freely between Light/Dark themes and Normal/Glass UI styles.
                    </div>
                    <button type="button" class="checkout-btn" data-cb-close-modal="cbSbAboutModal" style="padding:10px;">Close</button>
                </div>
            </div>

            <div class="cb-sb-toast" id="cbSbToast"></div>
        `;
        document.body.appendChild(wrapper);
        bindSidebarEvents();
    }

    /* ------------------------------------------------------------------------
       4. DYNAMIC CONTENT REFRESH (PROFILE, TOGGLES, ROLE-AWARE QUICK NAV)
       ------------------------------------------------------------------------ */
    function refreshSidebarUI() {
        const role = getRole();
        const user = getUser();
        const activeCol = getActiveCollege();

        // Profile Box
        const avatarEl = document.getElementById("cbSbAvatar");
        const nameEl = document.getElementById("cbSbProfileName");
        const subEl = document.getElementById("cbSbProfileSub");

        if (role === "admin") {
            if (avatarEl) avatarEl.textContent = "🏛️";
            if (nameEl) nameEl.textContent = `Admin • ${activeCol || "College"}`;
            if (subEl) subEl.textContent = "College Administration Studio";
        } else if (role === "staff") {
            const canName = typeof currentStaffCanteen !== "undefined" && currentStaffCanteen ? currentStaffCanteen : "Counter";
            if (avatarEl) avatarEl.textContent = "👨‍🍳";
            if (nameEl) nameEl.textContent = `${canName} Counter`;
            if (subEl) subEl.textContent = `${activeCol || "College"} Staff Portal`;
        } else if (role === "auditor") {
            if (avatarEl) avatarEl.textContent = "👑";
            if (nameEl) nameEl.textContent = "App Creator";
            if (subEl) subEl.textContent = "Master Audit & Sync Portal";
        } else {
            if (avatarEl) avatarEl.textContent = "🎓";
            if (nameEl) nameEl.textContent = user.name || "Student";
            if (subEl) subEl.textContent = `${activeCol ? activeCol + " • " : ""}${user.phone || user.email || "Student Pass"}`;
        }

        // Sync Theme & UI Style Toggle Cards
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const isGlass = document.documentElement.getAttribute("data-ui-style") === "glass";

        const themeIcon = document.getElementById("cbSbThemeIcon");
        const themeBadge = document.getElementById("cbSbThemeBadge");
        const themeSub = document.getElementById("cbSbThemeSub");
        if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
        if (themeBadge) themeBadge.textContent = isDark ? "DARK" : "LIGHT";
        if (themeSub) themeSub.textContent = isDark ? "Tap for Light Mode" : "Tap for Dark Mode";

        const styleIcon = document.getElementById("cbSbStyleIcon");
        const styleBadge = document.getElementById("cbSbStyleBadge");
        const styleSub = document.getElementById("cbSbStyleSub");
        if (styleIcon) styleIcon.textContent = isGlass ? "✨" : "⚡";
        if (styleBadge) styleBadge.textContent = isGlass ? "GLASS" : "NORMAL";
        if (styleSub) styleSub.textContent = isGlass ? "Tap for Fast Normal" : "Fast Solid • Tap for Glass";

        // Build Role-Aware Quick Navigation
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
                { icon: "🏗️", title: "Menu & Offers Studio", desc: "Edit dishes, prices & banners", action: () => typeof switchAdminTab === "function" && switchAdminTab("admin-studio") },
                { icon: "👨‍🍳", title: "Orders & Counter Ledger", desc: "Verify PINs, collect cash & serve", action: () => typeof switchAdminTab === "function" && switchAdminTab("admin-ledger") },
                { icon: "🍲", title: "Kitchen Food Prep Count", desc: "Dish quantities (High to Low)", action: () => typeof openFoodPrepModal === "function" && openFoodPrepModal() },
                { icon: "👀", title: "Preview Student View", desc: "See live student menu layout", action: () => typeof switchTab === "function" && switchTab("menu") },
                { icon: "🔄", title: "Sync All Devices", desc: "Broadcast latest updates now", action: () => typeof forceManualCloudSync === "function" && forceManualCloudSync() }
            ];
            if (role === "auditor") {
                items.unshift({
                    icon: "👑", title: "Creator Audit Dashboard", desc: "Colleges, PINs & OTP controls",
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
            btn.addEventListener("click", () => {
                closeSidebar();
                item.action();
            });
            navList.appendChild(btn);
        });
    }

    /* ------------------------------------------------------------------------
       5. SIDEBAR & MODAL CONTROLS
       ------------------------------------------------------------------------ */
    function openSidebar() {
        refreshSidebarUI();
        const overlay = document.getElementById("cbSbOverlay");
        const drawer = document.getElementById("cbSbDrawer");
        if (overlay) overlay.classList.add("open");
        if (drawer) {
            drawer.classList.add("open");
            drawer.setAttribute("aria-hidden", "false");
        }
        try { history.pushState({ cbSidebar: true }, ""); } catch (e) {}
    }

    function closeSidebar() {
        const overlay = document.getElementById("cbSbOverlay");
        const drawer = document.getElementById("cbSbDrawer");
        if (overlay) overlay.classList.remove("open");
        if (drawer) {
            drawer.classList.remove("open");
            drawer.setAttribute("aria-hidden", "true");
        }
    }

    function openSubModal(modalId) {
        closeSidebar();
        const el = document.getElementById(modalId);
        if (!el) return;
        if (modalId === "cbSbContactModal") populateContactModal();
        if (modalId === "cbSbFeedbackModal") renderFeedbackHistory();
        el.classList.add("active");
        try { history.pushState({ cbSidebarModal: modalId }, ""); } catch (e) {}
    }

    function closeSubModal(modalId) {
        const el = document.getElementById(modalId);
        if (el) el.classList.remove("active");
    }

    function closeAllSidebarOverlays() {
        let closedAny = false;
        const modals = ["cbSbContactModal", "cbSbFeedbackModal", "cbSbFaqModal", "cbSbAboutModal"];
        modals.forEach(id => {
            const m = document.getElementById(id);
            if (m && m.classList.contains("active")) {
                m.classList.remove("active");
                closedAny = true;
            }
        });
        const drawer = document.getElementById("cbSbDrawer");
        if (drawer && drawer.classList.contains("open")) {
            closeSidebar();
            closedAny = true;
        }
        return closedAny;
    }

    /* ------------------------------------------------------------------------
       6. CONTACT, FEEDBACK & SHARE LOGIC
       ------------------------------------------------------------------------ */
    function populateContactModal() {
        const colObj = getActiveCollegeRecord();
        const adminRow = document.getElementById("cbSbCollegeAdminContactRow");
        const adminEmailEl = document.getElementById("cbSbContactAdminEmail");
        if (colObj && colObj.email && adminRow && adminEmailEl) {
            adminRow.style.display = "flex";
            adminEmailEl.textContent = `${colObj.name}: ${colObj.email}`;
            const copyBtn = document.getElementById("cbSbCopyAdminEmailBtn");
            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard && navigator.clipboard.writeText(colObj.email);
                    showMiniToast(`📋 Copied ${colObj.email}`);
                };
            }
        } else if (adminRow) {
            adminRow.style.display = "none";
        }
    }

    let selectedStarRating = 5;

    function updateStarUI(rating) {
        selectedStarRating = rating;
        document.querySelectorAll("#cbSbStarContainer .cb-sb-star").forEach(btn => {
            const val = Number(btn.getAttribute("data-star"));
            btn.classList.toggle("lit", val <= rating);
        });
    }

    function getSavedFeedback() {
        try { return JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)) || []; } catch (e) { return []; }
    }

    function renderFeedbackHistory() {
        const list = getSavedFeedback();
        const wrap = document.getElementById("cbSbFeedbackHistoryWrap");
        const container = document.getElementById("cbSbFeedbackHistoryList");
        if (!wrap || !container) return;

        if (list.length === 0) {
            wrap.style.display = "none";
            return;
        }
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

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    async function handleFeedbackSubmit() {
        const msgEl = document.getElementById("cbSbFbMessage");
        const catEl = document.getElementById("cbSbFbCategory");
        const submitBtn = document.getElementById("cbSbSubmitFbBtn");
        const message = (msgEl ? msgEl.value : "").trim();
        const category = catEl ? catEl.value : "General";

        if (!message) {
            showMiniToast("⚠️ Please write your feedback message first");
            if (msgEl) msgEl.focus();
            return;
        }

        const user = getUser();
        const entry = {
            id: "fb_" + Date.now(),
            rating: selectedStarRating,
            category: category,
            message: message,
            author: user.name || getRole(),
            contact: user.phone || user.email || "",
            college: getActiveCollege() || "CampusBites",
            date: new Date().toLocaleDateString()
        };

        const existing = getSavedFeedback();
        existing.unshift(entry);
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));

        // Optional EmailJS notification if configured in index.html
        if (typeof cloudConfig !== "undefined" && cloudConfig.emailPublicKey && cloudConfig.emailServiceId && cloudConfig.emailTemplateId && window.emailjs) {
            const colObj = getActiveCollegeRecord();
            const targetEmail = (colObj && colObj.email) ? colObj.email : "support@campusbites.in";
            try {
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }
                await emailjs.send(cloudConfig.emailServiceId, cloudConfig.emailTemplateId, {
                    to_email: targetEmail,
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
        const shareUrl = typeof getCollegeInviteUrl === "function"
            ? getCollegeInviteUrl(col)
            : window.location.href;
        const shareTitle = col ? `CampusBites — ${col} Canteens` : "CampusBites Official Canteen App";
        const shareText = `Order food faster and skip canteen queues on CampusBites!`;

        if (navigator.share) {
            navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            showMiniToast("📋 Invite link copied to clipboard!");
        } else {
            alert("Share Link:\n" + shareUrl);
        }
    }

    /* ------------------------------------------------------------------------
       7. BIND EVENTS
       ------------------------------------------------------------------------ */
    function bindSidebarEvents() {
        const overlay = document.getElementById("cbSbOverlay");
        const closeBtn = document.getElementById("cbSbCloseBtn");
        if (overlay) overlay.addEventListener("click", closeSidebar);
        if (closeBtn) closeBtn.addEventListener("click", closeSidebar);

        // Theme & UI Style toggle cards
        const themeCard = document.getElementById("cbSbThemeCard");
        if (themeCard) {
            themeCard.addEventListener("click", () => {
                if (typeof toggleThemeMode === "function") toggleThemeMode();
                refreshSidebarUI();
                const isDark = document.documentElement.getAttribute("data-theme") === "dark";
                showMiniToast(isDark ? "🌙 Dark Mode Enabled" : "☀️ Light Mode Enabled");
            });
        }

        const styleCard = document.getElementById("cbSbStyleCard");
        if (styleCard) {
            styleCard.addEventListener("click", () => {
                if (typeof toggleUiStyle === "function") toggleUiStyle();
                refreshSidebarUI();
                const isGlass = document.documentElement.getAttribute("data-ui-style") === "glass";
                showMiniToast(isGlass ? "✨ Glass UI Enabled" : "⚡ Normal (Fast) UI Enabled");
            });
        }

        // Support & Utility Buttons
        document.getElementById("cbSbContactBtn")?.addEventListener("click", () => openSubModal("cbSbContactModal"));
        document.getElementById("cbSbFeedbackBtn")?.addEventListener("click", () => openSubModal("cbSbFeedbackModal"));
        document.getElementById("cbSbFaqBtn")?.addEventListener("click", () => openSubModal("cbSbFaqModal"));
        document.getElementById("cbSbShareBtn")?.addEventListener("click", handleShareApp);
        document.getElementById("cbSbAboutBtn")?.addEventListener("click", () => openSubModal("cbSbAboutModal"));

        // Logout button
        document.getElementById("cbSbLogoutBtn")?.addEventListener("click", () => {
            closeSidebar();
            if (typeof logoutAndOpenAuthGate === "function") logoutAndOpenAuthGate();
        });

        // Close modal buttons & backdrop click
        document.querySelectorAll("[data-cb-close-modal]").forEach(btn => {
            btn.addEventListener("click", () => closeSubModal(btn.getAttribute("data-cb-close-modal")));
        });
        document.querySelectorAll(".cb-sb-modal").forEach(modal => {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.classList.remove("active");
            });
        });

        // Star rating buttons
        document.querySelectorAll("#cbSbStarContainer .cb-sb-star").forEach(btn => {
            btn.addEventListener("click", () => updateStarUI(Number(btn.getAttribute("data-star"))));
        });
        document.getElementById("cbSbSubmitFbBtn")?.addEventListener("click", handleFeedbackSubmit);

        // FAQ Accordion
        document.querySelectorAll(".cb-sb-faq-q").forEach(qBtn => {
            qBtn.addEventListener("click", () => {
                const parent = qBtn.closest(".cb-sb-faq-item");
                if (parent) parent.classList.toggle("open");
            });
        });

        // ESC key & Mobile Back button support
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeAllSidebarOverlays();
        });
        window.addEventListener("popstate", () => {
            closeAllSidebarOverlays();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildSidebarDOM);
    } else {
        buildSidebarDOM();
    }
})();
