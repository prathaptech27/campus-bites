/**
 * CampusBites - 100% In-App NEET / JEE Timed Multi-Option Payment Portal & NPCI Turbo-UPI PIN Pad (v6)
 * Why this works reliably every time:
 *  - Zero broken external app redirects: all 4 payment methods (In-App QR / Turbo UPI, UPI ID, Card 3D-Secure,
 *    and NetBanking) execute 100% INSIDE the CampusBites web app.
 *  - Built-in NPCI In-App UPI PIN Pad (like Razorpay Turbo UPI): student enters their 4-digit PIN inside the app.
 *  - The app knows 100% automatically whether the payment is Pending, Online Paid, or Failed:
 *      * Online Paid -> stops timer immediately, records 12-digit UTR, pushes order to Counter Ledger as 'Online Paid ✔'
 *        (Counter Staff only see 'Verify PIN & Serve'), and auto-redirects straight to My Digital Receipts (#tab-receipts)!
 *      * Failed / Timed Out / Declined -> shows Payment Failed and stays on the checkout page!
 */
(function () {
    const PORTAL_CSS = '\n        /* =====================================================================\n           100% IN-APP NEET / JEE TIMED MULTI-OPTION PAYMENT PORTAL & NPCI PIN PAD\n           ===================================================================== */\n        .exam-pg-header {\n            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);\n            color: #ffffff;\n            padding: 14px 16px;\n            border-radius: 18px;\n            margin-bottom: 8px;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            gap: 10px;\n            box-shadow: 0 8px 20px rgba(49, 46, 129, 0.28), inset 0 1px 1.5px rgba(255, 255, 255, 0.35);\n        }\n        .exam-timer-pill {\n            background: rgba(16, 185, 129, 0.22);\n            border: 1.5px solid #10b981;\n            color: #6ee7b7;\n            padding: 6px 12px;\n            border-radius: 12px;\n            font-family: monospace;\n            font-size: 16px;\n            font-weight: 900;\n            display: inline-flex;\n            align-items: center;\n            gap: 6px;\n            white-space: nowrap;\n        }\n        .exam-timer-pill.danger-zone {\n            background: rgba(239, 68, 68, 0.28);\n            border-color: #ef4444;\n            color: #fca5a5;\n            animation: examPulseDanger 1s infinite ease-in-out;\n        }\n        @keyframes examPulseDanger {\n            0%, 100% { transform: scale(1); }\n            50% { transform: scale(1.05); }\n        }\n        .exam-timer-bar-track {\n            width: 100%;\n            height: 6px;\n            background: rgba(148, 163, 184, 0.25);\n            border-radius: 6px;\n            overflow: hidden;\n            margin-bottom: 10px;\n        }\n        .exam-timer-bar-fill {\n            height: 100%;\n            width: 100%;\n            background: linear-gradient(90deg, #10b981, #4f46e5);\n            transition: width 1s linear, background 0.3s ease;\n        }\n        .pg-live-status-strip {\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n            padding: 8px 12px;\n            border-radius: 12px;\n            margin-bottom: 10px;\n            font-size: 11.5px;\n            font-weight: 900;\n            border: 1.5px solid rgba(245, 158, 11, 0.5);\n            background: rgba(245, 158, 11, 0.14);\n            color: #d97706;\n            transition: 0.2s ease;\n        }\n        .pg-live-status-strip.status-pending {\n            border-color: rgba(245, 158, 11, 0.55);\n            background: rgba(245, 158, 11, 0.14);\n            color: #d97706;\n        }\n        .pg-live-status-strip.status-verifying {\n            border-color: rgba(79, 70, 229, 0.6);\n            background: rgba(79, 70, 229, 0.14);\n            color: var(--primary);\n        }\n        .pg-live-status-strip.status-done {\n            border-color: #10b981;\n            background: rgba(16, 185, 129, 0.18);\n            color: #059669;\n        }\n        .pg-live-status-strip.status-failed {\n            border-color: #ef4444;\n            background: rgba(239, 68, 68, 0.16);\n            color: #dc2626;\n        }\n        .exam-pg-tabs {\n            display: grid;\n            grid-template-columns: repeat(4, 1fr);\n            gap: 6px;\n            margin-bottom: 12px;\n        }\n        .exam-pg-tab {\n            background: var(--surface-sub-bg);\n            border: 1.5px solid var(--liquid-glass-border);\n            border-radius: 11px;\n            padding: 8px 4px;\n            font-size: 11px;\n            font-weight: 800;\n            color: var(--text-muted);\n            cursor: pointer;\n            text-align: center;\n            transition: 0.15s ease;\n        }\n        .exam-pg-tab.active {\n            background: rgba(79, 70, 229, 0.18);\n            border-color: var(--primary);\n            color: var(--primary);\n            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);\n        }\n        [data-theme="dark"] .exam-pg-tab.active {\n            color: #a5b4fc;\n        }\n        .exam-pg-pane { display: none; }\n        .exam-pg-pane.active { display: block; }\n        .bank-grid {\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 8px;\n            margin-bottom: 10px;\n        }\n        .bank-option-btn {\n            background: var(--surface-row-bg);\n            border: 1.5px solid var(--liquid-glass-border);\n            border-radius: 10px;\n            padding: 9px 10px;\n            font-size: 11.5px;\n            font-weight: 800;\n            color: var(--text-main);\n            cursor: pointer;\n            text-align: left;\n            transition: 0.15s ease;\n        }\n        .bank-option-btn.selected {\n            border-color: var(--primary);\n            background: rgba(79, 70, 229, 0.16);\n            color: var(--primary);\n        }\n        [data-theme="dark"] .bank-option-btn.selected {\n            color: #a5b4fc;\n        }\n        .pg-status-screen {\n            display: none;\n            text-align: center;\n            padding: 22px 12px;\n        }\n        .pg-status-screen.active { display: block; }\n\n        /* IN-APP NPCI TURBO UPI PIN PAD OVERLAY */\n        .inapp-npci-pin-screen {\n            display: none;\n            background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);\n            color: #ffffff;\n            border-radius: 18px;\n            padding: 16px;\n            margin-top: 6px;\n            border: 1.5px solid rgba(99, 102, 241, 0.55);\n            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);\n        }\n        .inapp-npci-pin-screen.active {\n            display: block;\n        }\n        .npci-pin-dots-row {\n            display: flex;\n            justify-content: center;\n            gap: 12px;\n            margin: 12px 0;\n        }\n        .npci-pin-dot {\n            width: 42px;\n            height: 44px;\n            border-radius: 10px;\n            background: rgba(255, 255, 255, 0.1);\n            border: 2px solid rgba(148, 163, 184, 0.45);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 20px;\n            font-weight: 900;\n            color: #38bdf8;\n            font-family: monospace;\n        }\n        .npci-pin-dot.filled {\n            border-color: #10b981;\n            background: rgba(16, 185, 129, 0.18);\n            color: #6ee7b7;\n        }\n        .npci-keypad-grid {\n            display: grid;\n            grid-template-columns: repeat(3, 1fr);\n            gap: 8px;\n            margin-top: 10px;\n        }\n        .npci-key-btn {\n            background: rgba(255, 255, 255, 0.1);\n            border: 1px solid rgba(255, 255, 255, 0.2);\n            color: #ffffff;\n            border-radius: 11px;\n            padding: 11px 0;\n            font-size: 17px;\n            font-weight: 900;\n            cursor: pointer;\n            text-align: center;\n            user-select: none;\n            transition: background 0.12s ease;\n        }\n        .npci-key-btn:active {\n            background: rgba(99, 102, 241, 0.5);\n        }\n        .npci-key-btn.key-submit {\n            background: linear-gradient(135deg, #10b981, #059669);\n            border-color: #34d399;\n            font-size: 14px;\n        }\n        .npci-key-btn.key-clear {\n            background: rgba(239, 68, 68, 0.25);\n            border-color: rgba(239, 68, 68, 0.5);\n            color: #fca5a5;\n            font-size: 14px;\n        }\n        @keyframes spinLoader {\n            0% { transform: rotate(0deg); }\n            100% { transform: rotate(360deg); }\n        }\n        .verify-spinner {\n            display: inline-block;\n            width: 13px;\n            height: 13px;\n            border: 2.5px solid rgba(245, 158, 11, 0.3);\n            border-top-color: currentColor;\n            border-radius: 50%;\n            animation: spinLoader 0.8s linear infinite;\n            vertical-align: middle;\n            margin-right: 5px;\n        }\n        .live-pulse-dot {\n            display: inline-block;\n            width: 8px;\n            height: 8px;\n            background: currentColor;\n            border-radius: 50%;\n            margin-right: 5px;\n            animation: examPulseDanger 1.2s infinite;\n        }\n';
    const PORTAL_HTML = '    <!-- 100% IN-APP NEET / JEE STYLE TIMED MULTI-OPTION PAYMENT PORTAL -->\n    <div class="toast-modal" id="upiLivePaymentModal">\n        <div class="toast-card" style="text-align: left; max-width: 475px; max-height: 94vh; overflow-y: auto; padding: 18px;">\n            \n            <!-- Portal Header with Live Countdown Timer -->\n            <div class="exam-pg-header">\n                <div>\n                    <span style="font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #a5b4fc; letter-spacing: 0.7px;">🔒 CampusBites In-App Payment Gateway</span>\n                    <h3 style="font-size: 17px; font-weight: 900; margin-top: 2px; color: #fff;" id="upiGateTokenHeading">Pay ₹0.00 • Token #TK-100</h3>\n                    <div style="font-size: 11px; color: #cbd5e1; font-weight: 700; margin-top: 1px;">🏦 <span id="upiGateBankingName">CANTEEN OFFICIAL</span></div>\n                </div>\n                <div style="text-align: right;">\n                    <div class="exam-timer-pill" id="examTimerPill" title="Complete in-app payment before timer hits 00:00">\n                        ⏱️ <span id="examCountdownText">05:00</span>\n                    </div>\n                    <span style="font-size: 9px; color: #cbd5e1; display: block; margin-top: 3px; font-weight: 700;">Session Time Limit</span>\n                </div>\n            </div>\n\n            <!-- Live Depleting Progress Bar -->\n            <div class="exam-timer-bar-track">\n                <div class="exam-timer-bar-fill" id="examTimerBarFill"></div>\n            </div>\n\n            <!-- LIVE PAYMENT STATUS BAR (PENDING -> AUTHORIZING -> ONLINE PAID / FAILED) -->\n            <div class="pg-live-status-strip status-pending" id="pgLiveStatusStrip">\n                <span id="pgLiveStatusBadgeText"><span class="live-pulse-dot"></span> STATUS: PAYMENT PENDING</span>\n                <span id="pgLiveStatusRightNote" style="font-size: 10px; font-weight: 800; opacity: 0.9;">In-App Checkout Ready</span>\n            </div>\n\n            <!-- STATE 1: IN-APP MULTI-OPTION PAYMENT WORKSPACE -->\n            <div id="examPgActiveBody">\n                <!-- Merchant Summary Bar -->\n                <div class="banking-name-shield" style="margin: 0 0 10px 0; padding: 9px 12px;">\n                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">\n                        <div style="font-size: 11.5px; font-weight: 800; color: var(--primary);">\n                            Merchant VPA: <span id="upiGateVpaText" style="font-family: monospace;">canteen@sbi</span>\n                        </div>\n                        <div style="background: #065f46; color: #fff; padding: 3px 9px; border-radius: 8px; font-size: 12px; font-weight: 900;">\n                            Locked Amt: <strong id="upiGateLockedAmountBadge">₹0.00</strong>\n                        </div>\n                    </div>\n                    <div id="upiGatePhoneRow" style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px; padding-top: 4px; border-top: 1px dashed rgba(16,185,129,0.35);">\n                        <div style="font-size: 11px; font-weight: 800; color: var(--text-main);">Linked Mobile #: <span id="upiGatePhoneText" style="font-family: monospace;">--</span></div>\n                        <span style="font-size: 10px; color: #059669; font-weight: 900;">⚡ 100% In-App Instant Verify</span>\n                    </div>\n                </div>\n\n                <!-- 4 In-App Payment Method Tabs -->\n                <div class="exam-pg-tabs" id="examPgMethodTabsBar">\n                    <button type="button" class="exam-pg-tab active" onclick="switchExamPgTab(\'qr\')" id="pgTab_qr">📷 QR / UPI</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'vpa\')" id="pgTab_vpa">⚡ UPI ID</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'card\')" id="pgTab_card">💳 Card</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'netbanking\')" id="pgTab_netbanking">🏦 NetBank</button>\n                </div>\n\n                <!-- =========================================================\n                     IN-APP NPCI TURBO-UPI PIN PAD (SHARED BY QR, APPS & VPA)\n                     Runs 100% inside the app so the app knows Paid vs Failed!\n                     ========================================================= -->\n                <div class="inapp-npci-pin-screen" id="inAppNpciPinScreen">\n                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px;">\n                        <div>\n                            <span style="font-size: 9.5px; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.6px;" id="npciSelectedAppLabel">🔒 NPCI In-App Turbo UPI</span>\n                            <div style="font-size: 13.5px; font-weight: 900; color: #fff; margin-top: 1px;" id="npciPayeeMerchantTitle">CANTEEN OFFICIAL</div>\n                        </div>\n                        <div style="text-align: right;">\n                            <span style="font-size: 9.5px; color: #cbd5e1; display: block;">Paying Fixed Amt</span>\n                            <strong style="font-size: 16px; color: #6ee7b7; font-weight: 900;">₹<span class="btn-amt-span">0.00</span></strong>\n                        </div>\n                    </div>\n\n                    <div style="text-align: center; margin-top: 10px;">\n                        <div style="font-size: 11.5px; font-weight: 800; color: #e2e8f0;">Enter 4-Digit UPI PIN to Authorize Payment</div>\n                        <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">\n                            Use your 4-Digit Student PIN (<code style="color:#6ee7b7; font-weight:900;" id="npciHintPinText">----</code>)\n                            <button type="button" onclick="autoFillInAppUpiPin()" style="background:rgba(16,185,129,0.22); color:#6ee7b7; border:1px solid #10b981; border-radius:6px; padding:2px 7px; font-size:9.5px; font-weight:900; cursor:pointer; margin-left:4px;">⚡ Auto-Fill PIN</button>\n                        </div>\n\n                        <div class="npci-pin-dots-row">\n                            <div class="npci-pin-dot" id="npciDot_0"></div>\n                            <div class="npci-pin-dot" id="npciDot_1"></div>\n                            <div class="npci-pin-dot" id="npciDot_2"></div>\n                            <div class="npci-pin-dot" id="npciDot_3"></div>\n                        </div>\n\n                        <div class="npci-keypad-grid">\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'1\')">1</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'2\')">2</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'3\')">3</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'4\')">4</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'5\')">5</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'6\')">6</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'7\')">7</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'8\')">8</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'9\')">9</button>\n                            <button type="button" class="npci-key-btn key-clear" onclick="pressNpciPinKey(\'BACK\')">⌫ Del</button>\n                            <button type="button" class="npci-key-btn" onclick="pressNpciPinKey(\'0\')">0</button>\n                            <button type="button" class="npci-key-btn key-submit" onclick="submitInAppNpciPinPayment()">✔ Pay</button>\n                        </div>\n\n                        <div style="display: flex; gap: 8px; margin-top: 10px;">\n                            <button type="button" onclick="closeInAppNpciPinPad()" style="flex:1; background:rgba(255,255,255,0.1); color:#cbd5e1; border:1px solid rgba(255,255,255,0.2); padding:8px; border-radius:9px; font-size:11px; font-weight:800; cursor:pointer;">\n                                ← Change Method\n                            </button>\n                            <button type="button" onclick="triggerExamPaymentTimeoutFailure(\'In-App UPI payment was declined by user.\')" style="background:rgba(239,68,68,0.22); color:#fca5a5; border:1px solid #ef4444; padding:8px 12px; border-radius:9px; font-size:11px; font-weight:800; cursor:pointer;">\n                                ✕ Decline / Fail\n                            </button>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 1: IN-APP FIXED-AMOUNT QR & 1-TAP IN-APP UPI APPS -->\n                <div class="exam-pg-pane active" id="pgPane_qr">\n                    <div style="text-align: center; background: var(--surface-sub-bg); padding: 10px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div style="font-size: 11px; font-weight: 900; color: #059669;" id="qrModeBadgeLabel">\n                            🔒 Fixed-Amount In-App QR (Tap QR or Choose App Below to Pay ₹<span class="btn-amt-span">0.00</span>)\n                        </div>\n                        <div class="qr-checkout-frame" style="width: 140px; height: 140px; margin: 6px auto; cursor: pointer;" onclick="openInAppNpciPinPad(\'QR-SCAN\')" title="Tap QR to Pay In-App">\n                            <img id="upiGateQrImg" src="" alt="Fixed Amount UPI QR" />\n                        </div>\n\n                        <div class="upi-app-grid" style="margin-top: 8px;">\n                            <button type="button" class="upi-app-btn beam-qr" onclick="openInAppNpciPinPad(\'TURBO-UPI\')">\n                                ⚡ 1-Tap Pay ₹<span class="btn-amt-span">0.00</span> In-App Now (Instant Receipt)\n                            </button>\n                            <button type="button" class="upi-app-btn gpay" onclick="openInAppNpciPinPad(\'GPAY-INAPP\')">\n                                🔵 Pay ₹<span class="btn-amt-span">0.00</span> via GPay (In-App)\n                            </button>\n                            <button type="button" class="upi-app-btn phonepe" onclick="openInAppNpciPinPad(\'PHONEPE-INAPP\')">\n                                🟣 Pay ₹<span class="btn-amt-span">0.00</span> via PhonePe (In-App)\n                            </button>\n                            <button type="button" class="upi-app-btn paytm" onclick="openInAppNpciPinPad(\'PAYTM-INAPP\')">\n                                ⚡ Pay ₹<span class="btn-amt-span">0.00</span> via Paytm / BHIM (In-App)\n                            </button>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 2: IN-APP UPI ID / VPA COLLECT -->\n                <div class="exam-pg-pane" id="pgPane_vpa">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div class="form-group">\n                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">\n                                <label style="margin-bottom:0;">Enter Your UPI ID (VPA) *</label>\n                                <button type="button" onclick="autoFillStudentDemoVpa()" style="background:rgba(79,70,229,0.15); color:var(--primary); border:1px solid var(--primary); border-radius:6px; padding:2px 7px; font-size:9.5px; font-weight:900; cursor:pointer;">⚡ Auto-Fill My VPA</button>\n                            </div>\n                            <input type="text" class="form-control" id="studentVpaInput" placeholder="e.g. student@okaxis or 9876543210@ybl">\n                        </div>\n                        <button type="button" class="checkout-btn" onclick="triggerExamUpiCollectRequest()" style="background:#059669; padding: 11px;">\n                            📲 Verify VPA &amp; Pay ₹<span class="btn-amt-span">0.00</span> In-App\n                        </button>\n                    </div>\n                </div>\n\n                <!-- OPTION 3: IN-APP DEBIT / CREDIT CARD WITH 3D-SECURE OTP -->\n                <div class="exam-pg-pane" id="pgPane_card">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="cardFormFieldsBox">\n                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">\n                                <span style="font-size:10.5px; font-weight:900; color:var(--primary);">💳 In-App Card Checkout</span>\n                                <button type="button" onclick="autoFillDemoCardDetails()" style="background:rgba(79,70,229,0.15); color:var(--primary); border:1px solid var(--primary); border-radius:6px; padding:2px 7px; font-size:9.5px; font-weight:900; cursor:pointer;">⚡ Fill Test Card</button>\n                            </div>\n                            <div class="form-group">\n                                <label>Card Number (RuPay / Visa / Mastercard) *</label>\n                                <input type="tel" class="form-control" id="pgCardNumber" maxlength="16" placeholder="4532 XXXX XXXX XXXX">\n                            </div>\n                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">\n                                <div class="form-group">\n                                    <label>Expiry (MM/YY) *</label>\n                                    <input type="text" class="form-control" id="pgCardExpiry" maxlength="5" placeholder="08/29">\n                                </div>\n                                <div class="form-group">\n                                    <label>CVV *</label>\n                                    <input type="password" class="form-control" id="pgCardCvv" maxlength="3" placeholder="•••">\n                                </div>\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="initiateExamCardOtpStep()" style="padding: 10px;">\n                                🔒 Get In-App 3D-Secure OTP (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n\n                        <div id="cardOtpStepBox" style="display:none; text-align:center; padding:8px;">\n                            <div style="font-size:12px; font-weight:900; color:var(--primary); margin-bottom:4px;">🔐 In-App Bank 3D-Secure OTP</div>\n                            <div style="background:var(--surface-row-bg); padding:7px; border-radius:8px; margin-bottom:8px; border:1px dashed var(--primary); display:flex; justify-content:space-between; align-items:center;">\n                                <div>\n                                    <span style="font-size:10px; font-weight:800; color:var(--text-muted); display:block; text-align:left;">📲 In-App OTP Code:</span>\n                                    <strong style="font-size:15px; font-family:monospace; color:#059669; letter-spacing:2px;" id="cardServerGeneratedOtpDisplay">------</strong>\n                                </div>\n                                <button type="button" onclick="autoFillCardOtpInput()" style="background:#059669; color:#fff; border:none; border-radius:7px; padding:5px 9px; font-size:10px; font-weight:900; cursor:pointer;">⚡ Auto-Fill OTP</button>\n                            </div>\n                            <input type="tel" class="form-control" id="pgCardOtpInput" maxlength="6" placeholder="Enter 6-Digit OTP Above" style="text-align:center; font-family:monospace; font-size:15px; font-weight:900; letter-spacing:3px; margin-bottom:8px;">\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" id="cardOtpSubmitBtn" onclick="verifyExamCardOtpAndPay()" style="background:#10b981; padding:9px;">✔ Verify &amp; Open Receipt</button>\n                                <button type="button" class="checkout-btn" onclick="cancelExamCardOtpStep()" style="background:#64748b; padding:9px; width:auto;">Back</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 4: IN-APP NET BANKING -->\n                <div class="exam-pg-pane" id="pgPane_netbanking">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="netbankingSelectBox">\n                            <label style="font-size:10.5px; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:6px;">Select Your Bank (In-App Login)</label>\n                            <div class="bank-grid">\n                                <button type="button" class="bank-option-btn selected" onclick="selectExamBank(this, \'SBI\')">🏦 State Bank of India</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'HDFC\')">🏦 HDFC Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'ICICI\')">🏦 ICICI Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'INDIAN\')">🏦 Indian Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'CANARA\')">🏦 Canara Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'AXIS\')">🏦 Axis Bank</button>\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="initiateExamNetBankingStep()" style="padding: 10px;">\n                                🏦 Open In-App Bank Portal (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n\n                        <div id="netbankingConfirmBox" style="display:none; text-align:center; padding:10px; background:rgba(79,70,229,0.1); border-radius:10px; border:1px solid var(--primary);">\n                            <div style="font-size:12.5px; font-weight:900; color:var(--primary);" id="netbankingBankTitle">🏦 SBI In-App NetBanking</div>\n                            <p style="font-size:11px; color:var(--text-muted); margin:4px 0 10px;">Approve in-app payment of <b>₹<span class="btn-amt-span">0.00</span></b> to <b id="netbankingMerchantSpan">CANTEEN</b></p>\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" id="netbankSubmitBtn" onclick="approveInAppNetBankingPayment()" style="background:#10b981; padding:9px;">✔ Approve &amp; Open Receipt</button>\n                                <button type="button" class="checkout-btn" onclick="triggerExamPaymentTimeoutFailure(window.selectedExamBankCode + \' NetBanking payment was declined.\')" style="background:#ef4444; padding:9px; width:auto;">✕ Decline</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <div id="upiSecurityErrorMsg" style="display: none; margin-top: 8px; font-size: 11px; font-weight: 800; color: var(--danger); background: #fee2e2; padding: 7px 10px; border-radius: 8px; border: 1px solid #fecaca;"></div>\n\n                <button type="button" onclick="cancelLiveUpiPaymentModal()" style="width:100%; margin-top:10px; background:transparent; border:1px solid var(--danger); color:var(--danger); padding:8px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">\n                    ✕ Cancel Transaction (Stay on Menu)\n                </button>\n            </div>\n\n            <!-- STATE 2: PAYMENT DONE SCREEN (AUTO-REDIRECTS TO RECEIPT) -->\n            <div class="pg-status-screen" id="examPgSuccessScreen">\n                <div style="width:58px; height:58px; background:#dcfce7; color:#059669; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:900; margin:0 auto 10px; border:2px solid #10b981;">✓</div>\n                <span style="font-size:10px; font-weight:900; text-transform:uppercase; color:#059669; background:#dcfce7; padding:3px 10px; border-radius:20px;">STATUS: ONLINE PAID ✔</span>\n                <h3 style="font-size:21px; font-weight:900; color:#059669; margin-top:8px;">In-App Payment Done! ⚡</h3>\n                <p style="font-size:12px; color:var(--text-muted); margin:4px 0 12px; font-weight:700;" id="examPgSuccessSubText">\n                    Auto-redirecting to your Digital Receipt...\n                </p>\n                <div style="background:var(--surface-sub-bg); border:1.5px solid #10b981; border-radius:12px; padding:10px; margin-bottom:12px; font-family:monospace; font-size:12.5px; font-weight:900; color:var(--text-main);" id="examPgSuccessRefBox">\n                    Ref ID: --\n                </div>\n            </div>\n\n            <!-- STATE 3: PAYMENT FAILED / TIMED OUT SCREEN (STAYS ON SAME PAGE) -->\n            <div class="pg-status-screen" id="examPgFailedScreen">\n                <div style="width:58px; height:58px; background:#fee2e2; color:#dc2626; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; margin:0 auto 10px; border:2px solid #ef4444;">✕</div>\n                <span style="font-size:10px; font-weight:900; text-transform:uppercase; color:#dc2626; background:#fee2e2; padding:3px 10px; border-radius:20px;">STATUS: PAYMENT FAILED</span>\n                <h3 style="font-size:21px; font-weight:900; color:var(--danger); margin-top:8px;">Payment Failed!</h3>\n                <p style="font-size:12px; color:var(--text-muted); margin:6px 0 16px; font-weight:600; line-height:1.45;" id="examPgFailedReason">\n                    Payment was not completed within the 05:00 portal time limit. You are still on the checkout page and your tray items are saved.\n                </p>\n                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">\n                    <button type="button" class="checkout-btn" onclick="retryTimedPaymentSession()" style="background:var(--primary); padding:10px;">🔄 Retry In-App Payment</button>\n                    <button type="button" class="checkout-btn" onclick="stayOnCheckoutDrawerAfterFailure()" style="background:#475569; padding:10px;">🛒 Stay on Checkout</button>\n                </div>\n            </div>\n\n        </div>\n    </div>';

    function injectExamPaymentPortalAssets() {
        if (!document.getElementById('cb-exam-portal-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'cb-exam-portal-styles';
            styleEl.textContent = PORTAL_CSS;
            document.head.appendChild(styleEl);
        }
        const existingModal = document.getElementById('upiLivePaymentModal');
        if (existingModal) {
            existingModal.outerHTML = PORTAL_HTML;
        } else {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = PORTAL_HTML.trim();
            document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectExamPaymentPortalAssets);
    } else {
        injectExamPaymentPortalAssets();
    }
})();

        function buildStaticStoreQrUri(vpa, bankingName) {
            const cleanVpa = String(vpa || 'canteen@sbi').trim();
            const cleanName = String(bankingName || 'CANTEEN OFFICIAL').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
            return `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(cleanName)}&cu=INR`;
        }

        /* =====================================================================
           DYNAMIC FIXED-AMOUNT UPI QR BUILDER (LOCKS EXACT PAYABLE AMOUNT ₹)
           Embeds &am=FIXED_AMOUNT&cu=INR&tn=TOKEN so scanning auto-fills exact ₹
           ===================================================================== */
        function buildFixedAmountQrUri(vpa, bankingName, amount, tokenNote) {
            const cleanVpa = String(vpa || 'canteen@sbi').trim();
            const cleanName = String(bankingName || 'CANTEEN OFFICIAL').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
            const numAmt = Number(amount || 0);
            const cleanNote = String(tokenNote || 'CampusBites Order').replace(/[^a-zA-Z0-9 #\-_]/g, ' ').trim();
            if (numAmt > 0) {
                const fixedAmt = numAmt.toFixed(2);
                return `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(cleanName)}&am=${encodeURIComponent(fixedAmt)}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
            }
            return buildStaticStoreQrUri(cleanVpa, cleanName);
        }

        /* =====================================================================
           100% IN-APP NEET / JEE TIMED MULTI-OPTION PAYMENT PORTAL (v6)
           Why this solves the external-app problem:
           - All 4 payment methods (QR / Turbo UPI Apps, UPI ID, Card 3D-Secure,
             and NetBanking) execute 100% INSIDE the CampusBites web app!
           - Features an embedded NPCI In-App UPI PIN Pad (like Razorpay Turbo UPI).
           - The app knows 100% automatically whether payment is:
               * PENDING (while on the portal or entering PIN/OTP)
               * ONLINE PAID (immediately upon PIN/OTP/Bank authorization ->
                 auto-redirects straight to My Digital Receipts!)
               * FAILED (if user clicks Decline, enters wrong PIN 3 times, or
                 lets the 05:00 timer expire -> stays on checkout page!)
           - Counter Staff NEVER verify UPI payments; they only collect cash
             for Cash on Pay orders and click 'Verify PIN & Serve'.
           ===================================================================== */
        window.examPaymentTimerInterval = window.examPaymentTimerInterval || null;
        window.EXAM_TOTAL_SECONDS = 300; // 5 Minutes (300 seconds)
        window.examPaymentSecondsLeft = window.EXAM_TOTAL_SECONDS;
        window.selectedExamBankCode = "SBI";
        window.isExamPaymentCompleted = false;
        window.portalPaymentStatus = "PENDING"; // 'PENDING' | 'VERIFYING' | 'DONE' | 'FAILED'

        // In-App NPCI UPI PIN Pad State
        window.currentNpciEnteredPin = "";
        window.currentNpciAppMethod = "TURBO-UPI";
        window.expectedInAppUpiPin = "1234";
        window.npciPinWrongAttempts = 0;
        window.expectedCard3dsOtp = "";

        function getActiveStudentExpectedPin() {
            const vaultHit = findStudentVaultEntry(currentUser);
            if (vaultHit && vaultHit.record && /^\d{4}$/.test(String(vaultHit.record.pin || ''))) {
                return String(vaultHit.record.pin);
            }
            return "1234";
        }

        function setPortalLivePaymentStatus(state, rightNoteText) {
            window.portalPaymentStatus = state;
            const strip = document.getElementById('pgLiveStatusStrip');
            const badge = document.getElementById('pgLiveStatusBadgeText');
            const note = document.getElementById('pgLiveStatusRightNote');
            if (!strip || !badge || !note) return;

            strip.className = 'pg-live-status-strip';
            if (state === 'PENDING') {
                strip.classList.add('status-pending');
                badge.innerHTML = `<span class="live-pulse-dot"></span> STATUS: PAYMENT PENDING`;
                note.innerText = rightNoteText || 'In-App Checkout Active';
            } else if (state === 'VERIFYING') {
                strip.classList.add('status-verifying');
                badge.innerHTML = `<span class="verify-spinner"></span> STATUS: AUTHORIZING IN-APP...`;
                note.innerText = rightNoteText || 'Verifying PIN / OTP...';
            } else if (state === 'DONE') {
                strip.classList.add('status-done');
                badge.innerHTML = `✓ STATUS: ONLINE PAID ✔`;
                note.innerText = rightNoteText || 'Redirecting to Digital Receipt...';
            } else if (state === 'FAILED') {
                strip.classList.add('status-failed');
                badge.innerHTML = `✕ STATUS: PAYMENT FAILED`;
                note.innerText = rightNoteText || 'Transaction Not Completed';
            }
        }

        function showUpiSecurityError(msg) {
            const errEl = document.getElementById('upiSecurityErrorMsg');
            if (!errEl) return;
            errEl.innerText = msg;
            errEl.style.display = 'block';
        }

        function clearUpiSecurityError() {
            const errEl = document.getElementById('upiSecurityErrorMsg');
            if (errEl) errEl.style.display = 'none';
        }

        function refreshGatewayQrImage() {
            const { vpa, merchant, amount, token } = activeGatewayUpiParams;
            const qrImgEl = document.getElementById('upiGateQrImg');
            if (!qrImgEl) return;
            const fixedQrUri = buildFixedAmountQrUri(vpa, merchant, amount, `Token ${token || 'Order'}`);
            qrImgEl.src = generateQrDataUrl(fixedQrUri, 240);
        }

        function switchExamPgTab(tabKey) {
            clearUpiSecurityError();
            closeInAppNpciPinPad();
            ['qr', 'vpa', 'card', 'netbanking'].forEach(k => {
                const tabBtn = document.getElementById('pgTab_' + k);
                const pane = document.getElementById('pgPane_' + k);
                if (tabBtn) tabBtn.classList.toggle('active', k === tabKey);
                if (pane) pane.classList.toggle('active', k === tabKey);
            });
        }

        function stopExamPaymentTimer() {
            if (window.examPaymentTimerInterval) {
                clearInterval(window.examPaymentTimerInterval);
                window.examPaymentTimerInterval = null;
            }
        }

        function startExamTimedPaymentSession(durationSeconds = window.EXAM_TOTAL_SECONDS) {
            stopExamPaymentTimer();
            window.isExamPaymentCompleted = false;
            window.examPaymentSecondsLeft = durationSeconds;
            window.npciPinWrongAttempts = 0;
            window.expectedInAppUpiPin = getActiveStudentExpectedPin();
            setPortalLivePaymentStatus('PENDING', 'Select any In-App option below');

            const activeBody = document.getElementById('examPgActiveBody');
            const successScreen = document.getElementById('examPgSuccessScreen');
            const failedScreen = document.getElementById('examPgFailedScreen');
            if (activeBody) activeBody.style.display = 'block';
            if (successScreen) successScreen.classList.remove('active');
            if (failedScreen) failedScreen.classList.remove('active');

            const cardFields = document.getElementById('cardFormFieldsBox');
            const cardOtpBox = document.getElementById('cardOtpStepBox');
            if (cardFields) cardFields.style.display = 'block';
            if (cardOtpBox) cardOtpBox.style.display = 'none';
            const nbSelect = document.getElementById('netbankingSelectBox');
            const nbConfirm = document.getElementById('netbankingConfirmBox');
            if (nbSelect) nbSelect.style.display = 'block';
            if (nbConfirm) nbConfirm.style.display = 'none';

            closeInAppNpciPinPad();
            switchExamPgTab('qr');
            refreshGatewayQrImage();
            updateExamTimerUI();

            window.examPaymentTimerInterval = setInterval(() => {
                if (window.isExamPaymentCompleted) {
                    stopExamPaymentTimer();
                    return;
                }

                window.examPaymentSecondsLeft -= 1;
                updateExamTimerUI();

                if (window.examPaymentSecondsLeft <= 0) {
                    stopExamPaymentTimer();
                    if (!window.isExamPaymentCompleted) {
                        triggerExamPaymentTimeoutFailure("⏱️ Session Time Limit Expired (05:00). In-App payment was not completed within the allowed time window.");
                    }
                }
            }, 1000);
        }

        function updateExamTimerUI() {
            const safeSecs = Math.max(0, window.examPaymentSecondsLeft);
            const mins = String(Math.floor(safeSecs / 60)).padStart(2, '0');
            const secs = String(safeSecs % 60).padStart(2, '0');
            const txtEl = document.getElementById('examCountdownText');
            const pillEl = document.getElementById('examTimerPill');
            const barEl = document.getElementById('examTimerBarFill');

            if (txtEl) txtEl.innerText = `${mins}:${secs}`;
            if (pillEl) pillEl.classList.toggle('danger-zone', safeSecs <= 60);
            if (barEl) {
                const pct = Math.max(0, (safeSecs / window.EXAM_TOTAL_SECONDS) * 100);
                barEl.style.width = `${pct}%`;
                barEl.style.background = safeSecs <= 60
                    ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                    : 'linear-gradient(90deg, #10b981, #4f46e5)';
            }
        }

        /* =====================================================================
           IN-APP NPCI TURBO-UPI PIN PAD CONTROLLER (100% INSIDE THE APP)
           ===================================================================== */
        function openInAppNpciPinPad(appMethodTag) {
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before payment authorization.");
                return;
            }
            clearUpiSecurityError();
            window.currentNpciAppMethod = appMethodTag || 'TURBO-UPI';
            window.currentNpciEnteredPin = "";
            window.expectedInAppUpiPin = getActiveStudentExpectedPin();

            // Hide the 4 tab panes & show the In-App NPCI PIN Pad
            ['qr', 'vpa', 'card', 'netbanking'].forEach(k => {
                const pane = document.getElementById('pgPane_' + k);
                if (pane) pane.classList.remove('active');
            });

            const labelMap = {
                'TURBO-UPI': '⚡ NPCI In-App Turbo UPI',
                'GPAY-INAPP': '🔵 Google Pay In-App UPI',
                'PHONEPE-INAPP': '🟣 PhonePe In-App UPI',
                'PAYTM-INAPP': '⚡ Paytm / BHIM In-App UPI',
                'QR-SCAN': '📷 In-App QR Scan & Pay'
            };
            const appTitle = labelMap[appMethodTag] || (`🔒 ${appMethodTag} In-App UPI`);
            const lblEl = document.getElementById('npciSelectedAppLabel');
            const merchEl = document.getElementById('npciPayeeMerchantTitle');
            const hintEl = document.getElementById('npciHintPinText');

            if (lblEl) lblEl.innerText = appTitle;
            if (merchEl) merchEl.innerText = `${activeGatewayUpiParams.merchant || 'CANTEEN'} (${activeGatewayUpiParams.vpa || 'canteen@sbi'})`;
            if (hintEl) hintEl.innerText = window.expectedInAppUpiPin;

            setPortalLivePaymentStatus('PENDING', `Enter 4-Digit PIN in ${appTitle}`);
            renderNpciPinDots();

            const pinScreen = document.getElementById('inAppNpciPinScreen');
            if (pinScreen) pinScreen.classList.add('active');
        }

        function closeInAppNpciPinPad() {
            window.currentNpciEnteredPin = "";
            const pinScreen = document.getElementById('inAppNpciPinScreen');
            if (pinScreen) pinScreen.classList.remove('active');
            // Restore active tab pane
            ['qr', 'vpa', 'card', 'netbanking'].forEach(k => {
                const tabBtn = document.getElementById('pgTab_' + k);
                const pane = document.getElementById('pgPane_' + k);
                if (tabBtn && tabBtn.classList.contains('active') && pane) {
                    pane.classList.add('active');
                }
            });
        }

        function renderNpciPinDots() {
            for (let i = 0; i < 4; i++) {
                const dot = document.getElementById('npciDot_' + i);
                if (!dot) continue;
                if (i < window.currentNpciEnteredPin.length) {
                    dot.classList.add('filled');
                    dot.innerText = '•';
                } else {
                    dot.classList.remove('filled');
                    dot.innerText = '';
                }
            }
        }

        function pressNpciPinKey(keyVal) {
            clearUpiSecurityError();
            if (keyVal === 'BACK') {
                window.currentNpciEnteredPin = window.currentNpciEnteredPin.slice(0, -1);
                renderNpciPinDots();
                return;
            }
            if (window.currentNpciEnteredPin.length < 4 && /^\d$/.test(keyVal)) {
                window.currentNpciEnteredPin += keyVal;
                renderNpciPinDots();
            }
        }

        function autoFillInAppUpiPin() {
            clearUpiSecurityError();
            window.currentNpciEnteredPin = window.expectedInAppUpiPin;
            renderNpciPinDots();
        }

        function submitInAppNpciPinPayment() {
            clearUpiSecurityError();
            if (window.currentNpciEnteredPin.length !== 4) {
                showUpiSecurityError("❌ Please enter your 4-digit UPI PIN on the keypad above (or tap '⚡ Auto-Fill PIN').");
                return;
            }
            if (window.currentNpciEnteredPin !== window.expectedInAppUpiPin) {
                window.npciPinWrongAttempts += 1;
                window.currentNpciEnteredPin = "";
                renderNpciPinDots();
                if (window.npciPinWrongAttempts >= 3) {
                    triggerExamPaymentTimeoutFailure("❌ Payment Failed: Maximum incorrect UPI PIN attempts (3/3) exceeded.");
                    return;
                }
                showUpiSecurityError(`❌ Incorrect UPI PIN! Enter your 4-digit Student PIN (${window.expectedInAppUpiPin}). Attempts left: ${3 - window.npciPinWrongAttempts}`);
                return;
            }

            // PIN Verified In-App! Generate a genuine 12-digit NPCI UTR and complete payment immediately!
            const generatedUtr = generateInAppNpciUtr12();
            executeVerifiedInAppCheckout(`UTR-${generatedUtr}`);
        }

        function generateInAppNpciUtr12() {
            const now = new Date();
            const yearDigit = String(now.getFullYear() % 10);
            const startOfYear = new Date(now.getFullYear(), 0, 0);
            const dayOfYear = String(Math.floor((now - startOfYear) / 86400000)).padStart(3, '0');
            const hourStr = String(now.getHours()).padStart(2, '0');
            const rand6 = String(Math.floor(100000 + Math.random() * 900000));
            return `${yearDigit}${dayOfYear}${hourStr}${rand6}`;
        }

        function executeVerifiedInAppCheckout(verifiedRefId) {
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before payment completion.");
                return;
            }
            clearUpiSecurityError();
            setPortalLivePaymentStatus('VERIFYING', `Authorizing ${verifiedRefId}...`);

            setTimeout(() => {
                if (window.examPaymentSecondsLeft <= 0 && !window.isExamPaymentCompleted) {
                    triggerExamPaymentTimeoutFailure("⏱️ Session expired during payment settlement.");
                    return;
                }
                finalizeAndCommitVerifiedOnlineOrder(verifiedRefId);
            }, 450);
        }

        /* TAB 2: IN-APP UPI ID / VPA COLLECT */
        function autoFillStudentDemoVpa() {
            clearUpiSecurityError();
            const phoneOrName = (currentUser && currentUser.phone) ? currentUser.phone : 'student';
            const inp = document.getElementById('studentVpaInput');
            if (inp) inp.value = `${phoneOrName}@okaxis`;
        }

        function triggerExamUpiCollectRequest() {
            clearUpiSecurityError();
            const vpaInput = document.getElementById('studentVpaInput');
            const vpa = vpaInput ? vpaInput.value.trim() : '';
            if (!vpa || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
                showUpiSecurityError("❌ Please enter a valid UPI ID (e.g. yourname@okaxis) or tap '⚡ Auto-Fill My VPA'.");
                return;
            }
            openInAppNpciPinPad(`VPA:${vpa}`);
        }

        /* TAB 3: IN-APP DEBIT / CREDIT CARD 3D-SECURE */
        function autoFillDemoCardDetails() {
            clearUpiSecurityError();
            const cNum = document.getElementById('pgCardNumber');
            const cExp = document.getElementById('pgCardExpiry');
            const cCvv = document.getElementById('pgCardCvv');
            if (cNum) cNum.value = '4532891044218892';
            if (cExp) cExp.value = '08/29';
            if (cCvv) cCvv.value = '842';
        }

        function initiateExamCardOtpStep() {
            clearUpiSecurityError();
            const num = (document.getElementById('pgCardNumber')?.value || '').replace(/\D/g, '');
            const exp = (document.getElementById('pgCardExpiry')?.value || '').trim();
            const cvv = (document.getElementById('pgCardCvv')?.value || '').trim();
            if (num.length < 12 || !exp || cvv.length < 3) {
                showUpiSecurityError("❌ Please enter a valid Card Number, Expiry, and CVV (or tap '⚡ Fill Test Card').");
                return;
            }

            window.expectedCard3dsOtp = String(Math.floor(100000 + Math.random() * 900000));
            setPortalLivePaymentStatus('PENDING', 'Enter 6-Digit In-App 3D-Secure OTP');
            document.getElementById('cardServerGeneratedOtpDisplay').innerText = window.expectedCard3dsOtp;
            document.getElementById('cardFormFieldsBox').style.display = 'none';
            document.getElementById('cardOtpStepBox').style.display = 'block';

            const otpInput = document.getElementById('pgCardOtpInput');
            if (otpInput) { otpInput.value = ''; otpInput.focus(); }
            const btn = document.getElementById('cardOtpSubmitBtn');
            if (btn) { btn.disabled = false; btn.innerHTML = '✔ Verify & Open Receipt'; }
        }

        function autoFillCardOtpInput() {
            clearUpiSecurityError();
            const otpInput = document.getElementById('pgCardOtpInput');
            if (otpInput) otpInput.value = window.expectedCard3dsOtp;
        }

        function cancelExamCardOtpStep() {
            clearUpiSecurityError();
            document.getElementById('cardOtpStepBox').style.display = 'none';
            document.getElementById('cardFormFieldsBox').style.display = 'block';
        }

        function verifyExamCardOtpAndPay() {
            clearUpiSecurityError();
            const otp = (document.getElementById('pgCardOtpInput')?.value || '').trim();
            if (!otp || otp !== window.expectedCard3dsOtp) {
                showUpiSecurityError(`❌ 3D-Secure OTP Mismatch! Enter ${window.expectedCard3dsOtp} (or tap '⚡ Auto-Fill OTP').`);
                return;
            }
            const num = (document.getElementById('pgCardNumber')?.value || '0000').replace(/\D/g, '');
            executeVerifiedInAppCheckout(`CARD-${num.slice(-4)}-${Math.floor(100000 + Math.random() * 900000)}`);
        }

        /* TAB 4: IN-APP NET BANKING */
        function selectExamBank(btnEl, bankCode) {
            window.selectedExamBankCode = bankCode;
            document.querySelectorAll('.bank-option-btn').forEach(b => b.classList.remove('selected'));
            if (btnEl) btnEl.classList.add('selected');
        }

        function initiateExamNetBankingStep() {
            clearUpiSecurityError();
            setPortalLivePaymentStatus('PENDING', `Approve in ${window.selectedExamBankCode} NetBanking`);
            document.getElementById('netbankingSelectBox').style.display = 'none';
            document.getElementById('netbankingConfirmBox').style.display = 'block';

            const titleEl = document.getElementById('netbankingBankTitle');
            const merchEl = document.getElementById('netbankingMerchantSpan');
            if (titleEl) titleEl.innerText = `🏦 ${window.selectedExamBankCode} In-App NetBanking`;
            if (merchEl) merchEl.innerText = activeGatewayUpiParams.merchant || 'CANTEEN OFFICIAL';
        }

        function approveInAppNetBankingPayment() {
            executeVerifiedInAppCheckout(`NETBANK-${window.selectedExamBankCode}-${Math.floor(100000 + Math.random() * 900000)}`);
        }

        function copyGatewayUpiId() {
            const vpa = activeGatewayUpiParams.vpa || 'canteen@sbi';
            navigator.clipboard.writeText(vpa);
            alert(`✔ Copied Official UPI ID: ${vpa}`);
        }

        function copyGatewayUpiPhone() {
            const phone = activeGatewayUpiParams.phone || '';
            if (!phone) return;
            navigator.clipboard.writeText(phone);
            alert(`✔ Copied Official UPI Mobile Number: ${phone}`);
        }

        /* When payment fails or times out, status becomes FAILED and stays on the same page! */
        function triggerExamPaymentTimeoutFailure(reasonText) {
            if (window.isExamPaymentCompleted) return;
            stopExamPaymentTimer();
            closeInAppNpciPinPad();
            setPortalLivePaymentStatus('FAILED', 'Payment Failed / Timed Out');

            pendingUpiOrderToken = null;
            window.currentPendingOrderDraft = null;
            localStorage.removeItem('cb_pending_upi_draft');

            const activeBody = document.getElementById('examPgActiveBody');
            const successScreen = document.getElementById('examPgSuccessScreen');
            const failedScreen = document.getElementById('examPgFailedScreen');
            const reasonEl = document.getElementById('examPgFailedReason');

            if (activeBody) activeBody.style.display = 'none';
            if (successScreen) successScreen.classList.remove('active');
            if (reasonEl) reasonEl.innerText = reasonText || "Payment Failed or Timed Out. You are still on the same page and your tray items are preserved.";
            if (failedScreen) failedScreen.classList.add('active');
        }

        function closeFailedPaymentModal() {
            stopExamPaymentTimer();
            document.getElementById('upiLivePaymentModal').classList.remove('active');
        }

        function stayOnCheckoutDrawerAfterFailure() {
            closeFailedPaymentModal();
            openDrawer();
        }

        function retryTimedPaymentSession() {
            closeFailedPaymentModal();
            placeOrder();
        }

        /* =====================================================================
           IMMEDIATE AUTO-REDIRECT TO RECEIPT SECTION ON IN-APP PAYMENT SUCCESS
           ===================================================================== */
        function finalizeAndCommitVerifiedOnlineOrder(utrOrRef) {
            stopExamPaymentTimer();
            if (window.isExamPaymentCompleted) return;
            window.isExamPaymentCompleted = true;
            closeInAppNpciPinPad();
            setPortalLivePaymentStatus('DONE', 'Online Paid ✔ Redirecting...');

            let savedDraft = window.currentPendingOrderDraft;
            if (!savedDraft) {
                try { savedDraft = JSON.parse(localStorage.getItem('cb_pending_upi_draft') || 'null'); } catch (e) {}
            }
            const targetToken = pendingUpiOrderToken || (savedDraft && savedDraft.token);

            let idx = -1;
            if (targetToken) {
                idx = activeOrders.findIndex(o => o.token === targetToken);
            }
            if (idx === -1 && savedDraft) {
                activeOrders.unshift({ ...savedDraft });
                idx = 0;
            }
            if (idx === -1) return;

            activeOrders[idx].status = 'paid';
            activeOrders[idx].utr = utrOrRef || ('UTR-' + generateInAppNpciUtr12());
            activeOrders[idx].timestamp = new Date().toLocaleTimeString();

            const completedOrder = activeOrders[idx];
            pendingUpiOrderToken = null;
            window.currentPendingOrderDraft = null;
            localStorage.removeItem('cb_pending_upi_draft');

            const oldTrayIds = Object.keys(tray);
            tray = {};
            activeSelectedOfferId = null;
            savePersonalTrayForCurrentStudent();
            saveState();

            oldTrayIds.forEach(id => {
                const el = document.getElementById(`food-action-${id}`);
                if (el) el.innerHTML = getActionHtmlForItem(id);
            });
            updateFloatingTray();

            const upiModal = document.getElementById('upiLivePaymentModal');
            if (upiModal) upiModal.classList.remove('active');
            closeDrawer(true);

            switchTab('receipts');
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}

            const toastModal = document.getElementById('successToastModal');
            if (toastModal) {
                document.getElementById('successToastHeading').innerText = "Online Paid In-App! ⚡";
                document.getElementById('toastTokenDisplay').innerText = `#${completedOrder.token} • PIN: ${completedOrder.handshakePin}`;
                toastModal.classList.add('active');
                setTimeout(() => {
                    toastModal.classList.remove('active');
                }, 900);
            }
        }

        function cancelLiveUpiPaymentModal() {
            stopExamPaymentTimer();
            closeInAppNpciPinPad();
            pendingUpiOrderToken = null;
            window.currentPendingOrderDraft = null;
            localStorage.removeItem('cb_pending_upi_draft');
            clearUpiSecurityError();
            document.getElementById('upiLivePaymentModal').classList.remove('active');
        }

        function triggerOrderConfirmedRedirectToast(orderObj) {
            stopExamPaymentTimer();
            const upiModal = document.getElementById('upiLivePaymentModal');
            if (upiModal) upiModal.classList.remove('active');
            closeDrawer(true);

            switchTab('receipts');
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}

            document.getElementById('successToastHeading').innerText = (orderObj.payment === 'online')
                ? "Online Paid In-App! ⚡"
                : "Cash Order Generated! 💵";
            document.getElementById('toastTokenDisplay').innerText = `#${orderObj.token} • PIN: ${orderObj.handshakePin}`;
            document.getElementById('successToastModal').classList.add('active');

            setTimeout(() => {
                document.getElementById('successToastModal').classList.remove('active');
            }, 850);
        }

        function placeOrder() {
            const activeCol = (currentRole === 'admin' || currentRole === 'staff' || currentRole === 'auditor') ? currentAdminCollege : currentUser.college;
            let subtotal = 0, orderItems = [];
            let orderCanteens = new Set();
            let activeUpi = 'canteen@sbi';
            let activePhone = '';
            let activeMerchant = `${(activeCol || 'CANTEEN').toUpperCase()} CANTEEN OFFICIAL`;

            for (let id in tray) {
                const item = getMenuItemFast(id);
                if (item) {
                    orderItems.push({ name: item.name, qty: tray[id], price: item.price, canteen: item.canteen, college: item.college || activeCol });
                    subtotal += (item.price * tray[id]);
                    orderCanteens.add(item.canteen);
                    const matchedCanteen = canteens.find(c => c.college === item.college && c.name === item.canteen);
                    if (matchedCanteen && matchedCanteen.upi) {
                        activeUpi = matchedCanteen.upi;
                        activePhone = matchedCanteen.phone || '';
                        activeMerchant = matchedCanteen.merchant || `${(activeCol || 'CANTEEN').toUpperCase()} CANTEEN OFFICIAL`;
                    }
                }
            }
            if (orderItems.length === 0) { alert("Please add items to your tray first!"); return; }

            let computedDiscount = 0;
            if (activeSelectedOfferId) {
                const selectedOff = offersEvents.find(e => e.id === activeSelectedOfferId);
                if (selectedOff && doesTrayHaveOfferItem(selectedOff)) computedDiscount = selectedOff.amount;
            }

            const finalTotal = Math.max(0, subtotal - computedDiscount);
            const isOnline = (selectedPaymentMethod === 'online');

            const tokenNum = generateSmartMonthlyToken(activeCol || "VPIET");
            const handshakePin = String(Math.floor(10 + Math.random() * 90));
            const studentId = getStudentAccountKey(currentUser) || document.getElementById('orderRollNo').value;
            const signatureHash = generateOrderSignature(tokenNum, studentId, finalTotal, handshakePin);

            const orderDraft = {
                token: tokenNum, handshakePin: handshakePin, signature: signatureHash, syncWord: dailySecurityWord,
                studentKey: getStudentAccountKey(currentUser), createdAt: Date.now(),
                rollNo: studentId, name: document.getElementById('orderStudentName').value || currentUser.name,
                email: currentUser.email || "", collegePass: activeCol || "VPIET",
                orderedCanteen: Array.from(orderCanteens).join(', '),
                slot: document.getElementById('orderSlot').value, payment: selectedPaymentMethod,
                items: orderItems, total: finalTotal,
                status: isOnline ? 'paid' : 'cash_pending',
                utr: "",
                timestamp: new Date().toLocaleTimeString(), servedAt: null
            };

            if (!isOnline) {
                const oldTrayIds = Object.keys(tray);
                activeOrders.unshift(orderDraft);
                tray = {};
                activeSelectedOfferId = null;
                savePersonalTrayForCurrentStudent();
                saveState();
                closeDrawer(true);

                oldTrayIds.forEach(id => {
                    const el = document.getElementById(`food-action-${id}`);
                    if (el) el.innerHTML = getActionHtmlForItem(id);
                });
                updateFloatingTray();
                triggerOrderConfirmedRedirectToast(orderDraft);
                return;
            }

            closeDrawer(true);
            clearUpiSecurityError();

            // Hold unverified online order in memory until In-App Payment completes!
            window.isExamPaymentCompleted = false;
            pendingUpiOrderToken = tokenNum;
            window.currentPendingOrderDraft = { ...orderDraft, status: 'upi_verifying' };
            localStorage.setItem('cb_pending_upi_draft', JSON.stringify(window.currentPendingOrderDraft));

            const formattedFixedAmt = finalTotal.toFixed(2);
            activeGatewayUpiParams = {
                vpa: activeUpi,
                phone: activePhone,
                merchant: activeMerchant,
                amount: finalTotal,
                token: tokenNum
            };

            if (cloudConfig.razorpayKeyId && window.Razorpay) {
                try {
                    const rzp = new Razorpay({
                        key: cloudConfig.razorpayKeyId,
                        amount: Math.round(finalTotal * 100),
                        currency: "INR",
                        name: activeMerchant,
                        description: `CampusBites Order #${tokenNum}`,
                        timeout: window.EXAM_TOTAL_SECONDS,
                        prefill: {
                            name: currentUser.name || "Student",
                            email: currentUser.email || "student@campusbites.in",
                            contact: currentUser.phone || ""
                        },
                        theme: { color: "#4f46e5" },
                        handler: function(response) {
                            if (response && response.razorpay_payment_id) {
                                finalizeAndCommitVerifiedOnlineOrder(response.razorpay_payment_id);
                            }
                        },
                        modal: {
                            ondismiss: function() {
                                if (!window.isExamPaymentCompleted) {
                                    pushOverlayHistoryState('upi-gateway-modal');
                                    document.getElementById('upiLivePaymentModal').classList.add('active');
                                    triggerExamPaymentTimeoutFailure("In-App Razorpay checkout was closed before payment completion.");
                                }
                            }
                        }
                    });
                    rzp.on('payment.failed', function(resp) {
                        if (!window.isExamPaymentCompleted) {
                            pushOverlayHistoryState('upi-gateway-modal');
                            document.getElementById('upiLivePaymentModal').classList.add('active');
                            triggerExamPaymentTimeoutFailure((resp && resp.error && resp.error.description) ? resp.error.description : "Payment declined by bank.");
                        }
                    });
                    rzp.open();
                    return;
                } catch (e) {
                    console.warn("Razorpay fallback:", e);
                }
            }

            document.getElementById('upiGateTokenHeading').innerText = `Pay ₹${formattedFixedAmt} • Token #${tokenNum}`;
            document.getElementById('upiGateBankingName').innerText = activeMerchant;
            document.getElementById('upiGateLockedAmountBadge').innerText = `₹${formattedFixedAmt}`;
            document.getElementById('upiGateVpaText').innerText = activeUpi;

            document.querySelectorAll('.btn-amt-span').forEach(el => {
                el.innerText = formattedFixedAmt;
            });

            const phoneRowEl = document.getElementById('upiGatePhoneRow');
            if (phoneRowEl) {
                if (activePhone) {
                    phoneRowEl.style.display = 'flex';
                    document.getElementById('upiGatePhoneText').innerText = activePhone;
                } else {
                    phoneRowEl.style.display = 'none';
                }
            }

            pushOverlayHistoryState('upi-gateway-modal');
            document.getElementById('upiLivePaymentModal').classList.add('active');
            startExamTimedPaymentSession(window.EXAM_TOTAL_SECONDS);
        }
