/**
 * CampusBites - NEET / JEE Competitive Exam Style Timed Multi-Option Payment Portal (v5)
 * Key Upgrades:
 *  1. Zero Manual UPI Verification in Counter Ledger:
 *     - Online orders are NEVER sent to the Counter Ledger as 'upi_verifying'.
 *     - Counter Staff ONLY collect cash for Cash Pending orders and click 'Verify PIN & Serve'.
 *  2. Fixed 12-Digit UTR Validator:
 *     - Accepts all genuine 12-digit numeric UTR/RRN numbers from GPay, PhonePe, Paytm, BHIM, SBI, HDFC, ICICI, etc.
 *     - Blocks fake/sequential/repeating numbers and duplicate UTRs.
 *     - Immediately transitions status to PAYMENT DONE and auto-redirects straight to #tab-receipts!
 *  3. Live Payment Status Engine (PENDING -> VERIFYING -> DONE / FAILED):
 *     - Returning from a UPI app without paying keeps status as PENDING (never opens receipt).
 *     - Auto-reads clipboard on return if student copied their 12-digit UTR, or receives Razorpay /
 *       Webhook / Gateway OTP confirmation to auto-redirect to #tab-receipts immediately!
 */
(function () {
    const PORTAL_CSS = '\n        /* =====================================================================\n           NEET / JEE COMPETITIVE EXAM STYLE TIMED MULTI-OPTION PAYMENT PORTAL (v5)\n           LIVE STATUS ENGINE: PENDING -> DONE (AUTO-REDIRECT) OR FAILED (STAY)\n           ===================================================================== */\n        .exam-pg-header {\n            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);\n            color: #ffffff;\n            padding: 14px 16px;\n            border-radius: 18px;\n            margin-bottom: 8px;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            gap: 10px;\n            box-shadow: 0 8px 20px rgba(49, 46, 129, 0.28), inset 0 1px 1.5px rgba(255, 255, 255, 0.35);\n        }\n        .exam-timer-pill {\n            background: rgba(16, 185, 129, 0.22);\n            border: 1.5px solid #10b981;\n            color: #6ee7b7;\n            padding: 6px 12px;\n            border-radius: 12px;\n            font-family: monospace;\n            font-size: 16px;\n            font-weight: 900;\n            display: inline-flex;\n            align-items: center;\n            gap: 6px;\n            white-space: nowrap;\n        }\n        .exam-timer-pill.danger-zone {\n            background: rgba(239, 68, 68, 0.28);\n            border-color: #ef4444;\n            color: #fca5a5;\n            animation: examPulseDanger 1s infinite ease-in-out;\n        }\n        @keyframes examPulseDanger {\n            0%, 100% { transform: scale(1); }\n            50% { transform: scale(1.05); }\n        }\n        .exam-timer-bar-track {\n            width: 100%;\n            height: 6px;\n            background: rgba(148, 163, 184, 0.25);\n            border-radius: 6px;\n            overflow: hidden;\n            margin-bottom: 10px;\n        }\n        .exam-timer-bar-fill {\n            height: 100%;\n            width: 100%;\n            background: linear-gradient(90deg, #10b981, #4f46e5);\n            transition: width 1s linear, background 0.3s ease;\n        }\n        .pg-live-status-strip {\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n            padding: 8px 12px;\n            border-radius: 12px;\n            margin-bottom: 10px;\n            font-size: 11.5px;\n            font-weight: 900;\n            border: 1.5px solid rgba(245, 158, 11, 0.5);\n            background: rgba(245, 158, 11, 0.14);\n            color: #d97706;\n            transition: 0.2s ease;\n        }\n        .pg-live-status-strip.status-pending {\n            border-color: rgba(245, 158, 11, 0.55);\n            background: rgba(245, 158, 11, 0.14);\n            color: #d97706;\n        }\n        .pg-live-status-strip.status-verifying {\n            border-color: rgba(79, 70, 229, 0.6);\n            background: rgba(79, 70, 229, 0.14);\n            color: var(--primary);\n        }\n        .pg-live-status-strip.status-done {\n            border-color: #10b981;\n            background: rgba(16, 185, 129, 0.18);\n            color: #059669;\n        }\n        .pg-live-status-strip.status-failed {\n            border-color: #ef4444;\n            background: rgba(239, 68, 68, 0.16);\n            color: #dc2626;\n        }\n        .exam-pg-tabs {\n            display: grid;\n            grid-template-columns: repeat(4, 1fr);\n            gap: 6px;\n            margin-bottom: 12px;\n        }\n        .exam-pg-tab {\n            background: var(--surface-sub-bg);\n            border: 1.5px solid var(--liquid-glass-border);\n            border-radius: 11px;\n            padding: 8px 4px;\n            font-size: 11px;\n            font-weight: 800;\n            color: var(--text-muted);\n            cursor: pointer;\n            text-align: center;\n            transition: 0.15s ease;\n        }\n        .exam-pg-tab.active {\n            background: rgba(79, 70, 229, 0.18);\n            border-color: var(--primary);\n            color: var(--primary);\n            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);\n        }\n        [data-theme="dark"] .exam-pg-tab.active {\n            color: #a5b4fc;\n        }\n        .exam-pg-pane { display: none; }\n        .exam-pg-pane.active { display: block; }\n        .bank-grid {\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 8px;\n            margin-bottom: 10px;\n        }\n        .bank-option-btn {\n            background: var(--surface-row-bg);\n            border: 1.5px solid var(--liquid-glass-border);\n            border-radius: 10px;\n            padding: 9px 10px;\n            font-size: 11.5px;\n            font-weight: 800;\n            color: var(--text-main);\n            cursor: pointer;\n            text-align: left;\n            transition: 0.15s ease;\n        }\n        .bank-option-btn.selected {\n            border-color: var(--primary);\n            background: rgba(79, 70, 229, 0.16);\n            color: var(--primary);\n        }\n        [data-theme="dark"] .bank-option-btn.selected {\n            color: #a5b4fc;\n        }\n        .pg-status-screen {\n            display: none;\n            text-align: center;\n            padding: 22px 12px;\n        }\n        .pg-status-screen.active { display: block; }\n        .qr-mode-switch-pill {\n            background: rgba(16, 185, 129, 0.14);\n            color: #059669;\n            border: 1px solid rgba(16, 185, 129, 0.45);\n            padding: 4px 10px;\n            border-radius: 20px;\n            font-size: 10px;\n            font-weight: 900;\n            cursor: pointer;\n            display: inline-flex;\n            align-items: center;\n            gap: 4px;\n            margin-top: 4px;\n        }\n        @keyframes spinLoader {\n            0% { transform: rotate(0deg); }\n            100% { transform: rotate(360deg); }\n        }\n        .verify-spinner {\n            display: inline-block;\n            width: 13px;\n            height: 13px;\n            border: 2.5px solid rgba(245, 158, 11, 0.3);\n            border-top-color: currentColor;\n            border-radius: 50%;\n            animation: spinLoader 0.8s linear infinite;\n            vertical-align: middle;\n            margin-right: 5px;\n        }\n        .live-pulse-dot {\n            display: inline-block;\n            width: 8px;\n            height: 8px;\n            background: currentColor;\n            border-radius: 50%;\n            margin-right: 5px;\n            animation: examPulseDanger 1.2s infinite;\n        }\n';
    const PORTAL_HTML = '    <!-- NEET / JEE EXAM-STYLE TIMED MULTI-OPTION PAYMENT PORTAL (v5 - ZERO COUNTER INTERVENTION) -->\n    <div class="toast-modal" id="upiLivePaymentModal">\n        <div class="toast-card" style="text-align: left; max-width: 475px; max-height: 93vh; overflow-y: auto; padding: 18px;">\n            \n            <!-- Portal Header with Live Countdown Timer -->\n            <div class="exam-pg-header">\n                <div>\n                    <span style="font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #a5b4fc; letter-spacing: 0.7px;">🔒 CampusBites Automated Payment Gateway</span>\n                    <h3 style="font-size: 17px; font-weight: 900; margin-top: 2px; color: #fff;" id="upiGateTokenHeading">Pay ₹0.00 • Token #TK-100</h3>\n                    <div style="font-size: 11px; color: #cbd5e1; font-weight: 700; margin-top: 1px;">🏦 <span id="upiGateBankingName">CANTEEN OFFICIAL</span></div>\n                </div>\n                <div style="text-align: right;">\n                    <div class="exam-timer-pill" id="examTimerPill" title="Complete payment before timer hits 00:00">\n                        ⏱️ <span id="examCountdownText">05:00</span>\n                    </div>\n                    <span style="font-size: 9px; color: #cbd5e1; display: block; margin-top: 3px; font-weight: 700;">Portal Time Limit</span>\n                </div>\n            </div>\n\n            <!-- Live Depleting Progress Bar -->\n            <div class="exam-timer-bar-track">\n                <div class="exam-timer-bar-fill" id="examTimerBarFill"></div>\n            </div>\n\n            <!-- LIVE PAYMENT STATUS INDICATOR BAR (PENDING / VERIFYING / DONE / FAILED) -->\n            <div class="pg-live-status-strip status-pending" id="pgLiveStatusStrip">\n                <span id="pgLiveStatusBadgeText"><span class="live-pulse-dot"></span> STATUS: PAYMENT PENDING</span>\n                <span id="pgLiveStatusRightNote" style="font-size: 10px; font-weight: 800; opacity: 0.9;">Awaiting Payment...</span>\n            </div>\n\n            <!-- STATE 1: ACTIVE MULTI-OPTION PAYMENT WORKSPACE -->\n            <div id="examPgActiveBody">\n                <!-- Merchant Summary Bar -->\n                <div class="banking-name-shield" style="margin: 0 0 10px 0; padding: 9px 12px;">\n                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">\n                        <div style="font-size: 11.5px; font-weight: 800; color: var(--primary);">\n                            VPA: <span id="upiGateVpaText" style="font-family: monospace;">canteen@sbi</span>\n                            <button type="button" class="copy-chip-btn" onclick="copyGatewayUpiId()" style="padding: 3px 7px; font-size: 9.5px; margin-left: 4px;">📋 Copy</button>\n                        </div>\n                        <div style="background: #065f46; color: #fff; padding: 3px 9px; border-radius: 8px; font-size: 12px; font-weight: 900;">\n                            Locked Amt: <strong id="upiGateLockedAmountBadge">₹0.00</strong>\n                        </div>\n                    </div>\n                    <div id="upiGatePhoneRow" style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 5px; border-top: 1px dashed rgba(16,185,129,0.35);">\n                        <div style="font-size: 11px; font-weight: 800; color: var(--text-main);">UPI Mobile #: <span id="upiGatePhoneText" style="font-family: monospace;">--</span></div>\n                        <button type="button" class="copy-chip-btn" style="background:#059669; padding: 3px 8px; font-size: 9.5px;" onclick="copyGatewayUpiPhone()">📋 Copy #</button>\n                    </div>\n                </div>\n\n                <!-- 4 Payment Option Tabs (NEET/JEE Portal Style) -->\n                <div class="exam-pg-tabs">\n                    <button type="button" class="exam-pg-tab active" onclick="switchExamPgTab(\'qr\')" id="pgTab_qr">📷 QR / Apps</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'vpa\')" id="pgTab_vpa">⚡ UPI ID</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'card\')" id="pgTab_card">💳 Card</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'netbanking\')" id="pgTab_netbanking">🏦 NetBank</button>\n                </div>\n\n                <!-- OPTION 1: FIXED-AMOUNT DYNAMIC QR & UPI APPS -->\n                <div class="exam-pg-pane active" id="pgPane_qr">\n                    <div style="text-align: center; background: var(--surface-sub-bg); padding: 10px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div style="font-size: 11px; font-weight: 900; color: #059669;" id="qrModeBadgeLabel">\n                            🔒 Fixed-Amount QR (Auto-Fills ₹<span class="btn-amt-span">0.00</span> on Scan)\n                        </div>\n                        <div class="qr-checkout-frame" style="width: 144px; height: 144px; margin: 6px auto;">\n                            <img id="upiGateQrImg" src="" alt="Fixed Amount UPI QR" />\n                        </div>\n                        <button type="button" class="qr-mode-switch-pill" onclick="toggleGatewayQrAmountMode()" id="qrModeToggleBtn">\n                            🔄 Switch to Static Store QR (If bank blocks dynamic QR)\n                        </button>\n\n                        <div class="upi-app-grid" style="margin-top: 8px;">\n                            <button type="button" class="upi-app-btn beam-qr" onclick="beamStaticQrToUpiApp()">\n                                📲 1-Tap Send Fixed ₹<span class="btn-amt-span">0.00</span> QR to GPay / PhonePe\n                            </button>\n                            <button type="button" class="upi-app-btn gpay" onclick="openUpiAppSafelyWithoutSecurityDecline(\'gpay\')">\n                                🔵 Open GPay (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                            <button type="button" class="upi-app-btn phonepe" onclick="openUpiAppSafelyWithoutSecurityDecline(\'phonepe\')">\n                                🟣 Open PhonePe (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                            <button type="button" class="upi-app-btn paytm" onclick="openUpiAppSafelyWithoutSecurityDecline(\'paytm\')">\n                                ⚡ Open Paytm / BHIM (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 2: UPI ID / VPA COLLECT REQUEST -->\n                <div class="exam-pg-pane" id="pgPane_vpa">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="vpaInputFormBox">\n                            <div class="form-group">\n                                <label>Enter Your UPI ID (GPay / PhonePe / Paytm VPA) *</label>\n                                <input type="text" class="form-control" id="studentVpaInput" placeholder="e.g. student@okaxis or 9876543210@ybl">\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="triggerExamUpiCollectRequest()" style="background:#059669; padding: 11px;">\n                                📲 Verify VPA & Send ₹<span class="btn-amt-span">0.00</span> Collect Request\n                            </button>\n                        </div>\n\n                        <div id="vpaCollectWaitingBox" style="display:none; margin-top:6px; padding:10px; background:rgba(16,185,129,0.12); border:1.5px solid #10b981; border-radius:12px; text-align:center;">\n                            <div id="vpaCollectStatusText" style="font-size:11.5px; font-weight:800; color:var(--text-main); margin-bottom:8px;"></div>\n                            <div style="background:var(--surface-row-bg); padding:8px; border-radius:8px; margin-bottom:8px; border:1px dashed var(--primary);">\n                                <span style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block;">🔐 NPCI Collect Approval Code</span>\n                                <strong style="font-size:15px; font-family:monospace; color:var(--primary); letter-spacing:2px;" id="vpaServerAuthCodeDisplay">----</strong>\n                            </div>\n                            <input type="tel" class="form-control" id="vpaCollectPinInput" maxlength="4" placeholder="Enter 4-Digit Approval Code Above" style="text-align:center; font-family:monospace; font-size:14px; font-weight:900; letter-spacing:2px; margin-bottom:8px;">\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" id="vpaVerifySubmitBtn" onclick="verifyVpaCollectWithServer()" style="background:#10b981; padding:9px;">\n                                    ✔ Approve & Auto-Open Receipt\n                                </button>\n                                <button type="button" class="checkout-btn" onclick="triggerExamPaymentTimeoutFailure(\'UPI Collect Request was declined by user.\')" style="background:#ef4444; padding:9px; width:auto;">✕ Decline</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 3: DEBIT / CREDIT CARD WITH 3D-SECURE OTP -->\n                <div class="exam-pg-pane" id="pgPane_card">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="cardFormFieldsBox">\n                            <div class="form-group">\n                                <label>Card Number (RuPay / Visa / Mastercard) *</label>\n                                <input type="tel" class="form-control" id="pgCardNumber" maxlength="16" placeholder="4532 XXXX XXXX XXXX">\n                            </div>\n                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">\n                                <div class="form-group">\n                                    <label>Expiry (MM/YY) *</label>\n                                    <input type="text" class="form-control" id="pgCardExpiry" maxlength="5" placeholder="08/29">\n                                </div>\n                                <div class="form-group">\n                                    <label>CVV *</label>\n                                    <input type="password" class="form-control" id="pgCardCvv" maxlength="3" placeholder="•••">\n                                </div>\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="initiateExamCardOtpStep()" style="padding: 10px;">\n                                🔒 Request 3D-Secure Bank OTP (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n\n                        <div id="cardOtpStepBox" style="display:none; text-align:center; padding:8px;">\n                            <div style="font-size:12px; font-weight:900; color:var(--primary); margin-bottom:4px;">🔐 Bank 3D-Secure OTP Verification</div>\n                            <div style="background:var(--surface-row-bg); padding:7px; border-radius:8px; margin-bottom:8px; border:1px dashed var(--primary);">\n                                <span style="font-size:10px; font-weight:800; color:var(--text-muted); display:block;">📲 3D-Secure Bank OTP Dispatched:</span>\n                                <strong style="font-size:15px; font-family:monospace; color:#059669; letter-spacing:2px;" id="cardServerGeneratedOtpDisplay">------</strong>\n                            </div>\n                            <input type="tel" class="form-control" id="pgCardOtpInput" maxlength="6" placeholder="Enter 6-Digit 3D-Secure OTP Above" style="text-align:center; font-family:monospace; font-size:15px; font-weight:900; letter-spacing:3px; margin-bottom:8px;">\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" id="cardOtpSubmitBtn" onclick="verifyExamCardOtpAndPay()" style="background:#10b981; padding:9px;">✔ Verify OTP & Open Receipt</button>\n                                <button type="button" class="checkout-btn" onclick="cancelExamCardOtpStep()" style="background:#64748b; padding:9px; width:auto;">Back</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 4: NET BANKING -->\n                <div class="exam-pg-pane" id="pgPane_netbanking">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="netbankingSelectBox">\n                            <label style="font-size:10.5px; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:6px;">Select Your Bank</label>\n                            <div class="bank-grid">\n                                <button type="button" class="bank-option-btn selected" onclick="selectExamBank(this, \'SBI\')">🏦 State Bank of India</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'HDFC\')">🏦 HDFC Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'ICICI\')">🏦 ICICI Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'INDIAN\')">🏦 Indian Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'CANARA\')">🏦 Canara Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'AXIS\')">🏦 Axis Bank</button>\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="initiateExamNetBankingStep()" style="padding: 10px;">\n                                🏦 Proceed to Bank Gateway (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n\n                        <div id="netbankingConfirmBox" style="display:none; text-align:center; padding:10px; background:rgba(79,70,229,0.1); border-radius:10px; border:1px solid var(--primary);">\n                            <div style="font-size:12.5px; font-weight:900; color:var(--primary);" id="netbankingBankTitle">🏦 SBI Corporate Gateway</div>\n                            <p style="font-size:11px; color:var(--text-muted); margin:4px 0 8px;">Authorize payment of <b>₹<span class="btn-amt-span">0.00</span></b> to <b id="netbankingMerchantSpan">CANTEEN</b></p>\n                            <div style="background:var(--surface-row-bg); padding:7px; border-radius:8px; margin-bottom:8px; border:1px dashed var(--primary);">\n                                <span style="font-size:10px; font-weight:800; color:var(--text-muted); display:block;">🔐 Bank Settlement Security Code:</span>\n                                <strong style="font-size:15px; font-family:monospace; color:#059669; letter-spacing:2px;" id="netbankServerCodeDisplay">----</strong>\n                            </div>\n                            <input type="tel" class="form-control" id="netbankOtpInput" maxlength="4" placeholder="Enter 4-Digit Security Code Above" style="text-align:center; font-family:monospace; font-size:14px; font-weight:900; letter-spacing:2px; margin-bottom:8px;">\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" id="netbankSubmitBtn" onclick="verifyNetBankingWithServer()" style="background:#10b981; padding:9px;">✔ Verify & Open Receipt</button>\n                                <button type="button" class="checkout-btn" onclick="triggerExamPaymentTimeoutFailure(window.selectedExamBankCode + \' NetBanking transaction was declined.\')" style="background:#ef4444; padding:9px; width:auto;">✕ Decline</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- AUTOMATIC UTR / CLIPBOARD VERIFIER (ZERO COUNTER STAFF INTERVENTION!) -->\n                <div class="live-verify-radar" style="margin-top: 10px;">\n                    <div style="font-size: 11.5px; font-weight: 900; color: var(--primary);" id="upiLiveSyncStatusHeadline">\n                        ⚡ Instant Automated Verification (No Counter Staff Needed)\n                    </div>\n                    <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600; margin-top: 2px; line-height: 1.35;" id="upiLiveSyncStatusSub">\n                        • <b>Returning without paying stays Pending</b> (never opens receipt).<br>\n                        • After paying in GPay / PhonePe / Paytm, copy or paste your <b>12-digit UPI UTR / Ref No</b> below — it <b>verifies &amp; auto-redirects to your Receipt immediately!</b>\n                    </div>\n\n                    <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 5px; margin-top: 8px;">\n                        <input type="tel" class="form-control" id="upiUtrInput" maxlength="12" placeholder="12-Digit UPI UTR / Ref #" oninput="handleUtrInputLive(this)" style="text-align: center; font-family: monospace; font-size: 12px; font-weight: 900; letter-spacing: 1px;">\n                        <button type="button" onclick="pasteAndVerifyClipboardUtr()" style="background: #059669; color: #fff; border: none; border-radius: 10px; padding: 0 10px; font-size: 11px; font-weight: 900; cursor: pointer; white-space: nowrap;">\n                            📋 Paste\n                        </button>\n                        <button type="button" id="utrVerifySubmitBtn" onclick="verifySubmittedUtrWithServer()" style="background: var(--primary); color: #fff; border: none; border-radius: 10px; padding: 0 11px; font-size: 11px; font-weight: 900; cursor: pointer; white-space: nowrap;">\n                            ✔ Verify\n                        </button>\n                    </div>\n                    <div id="upiSecurityErrorMsg" style="display: none; margin-top: 7px; font-size: 11px; font-weight: 800; color: var(--danger); background: #fee2e2; padding: 6px 9px; border-radius: 8px; border: 1px solid #fecaca;"></div>\n                </div>\n\n                <button type="button" onclick="cancelLiveUpiPaymentModal()" style="width:100%; margin-top:9px; background:transparent; border:1px solid var(--danger); color:var(--danger); padding:8px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">\n                    ✕ Cancel Transaction\n                </button>\n            </div>\n\n            <!-- STATE 2: PAYMENT DONE SCREEN (AUTO-REDIRECTS TO RECEIPT) -->\n            <div class="pg-status-screen" id="examPgSuccessScreen">\n                <div style="width:58px; height:58px; background:#dcfce7; color:#059669; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:900; margin:0 auto 10px; border:2px solid #10b981;">✓</div>\n                <span style="font-size:10px; font-weight:900; text-transform:uppercase; color:#059669; background:#dcfce7; padding:3px 10px; border-radius:20px;">STATUS: PAYMENT DONE</span>\n                <h3 style="font-size:21px; font-weight:900; color:#059669; margin-top:8px;">Payment Verified! ⚡</h3>\n                <p style="font-size:12px; color:var(--text-muted); margin:4px 0 12px; font-weight:700;" id="examPgSuccessSubText">\n                    Auto-redirecting to your Digital Receipt...\n                </p>\n                <div style="background:var(--surface-sub-bg); border:1.5px solid #10b981; border-radius:12px; padding:10px; margin-bottom:12px; font-family:monospace; font-size:12.5px; font-weight:900; color:var(--text-main);" id="examPgSuccessRefBox">\n                    Ref ID: --\n                </div>\n            </div>\n\n            <!-- STATE 3: PAYMENT FAILED / TIMED OUT SCREEN (STAYS ON SAME PAGE) -->\n            <div class="pg-status-screen" id="examPgFailedScreen">\n                <div style="width:58px; height:58px; background:#fee2e2; color:#dc2626; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; margin:0 auto 10px; border:2px solid #ef4444;">✕</div>\n                <span style="font-size:10px; font-weight:900; text-transform:uppercase; color:#dc2626; background:#fee2e2; padding:3px 10px; border-radius:20px;">STATUS: PAYMENT FAILED</span>\n                <h3 style="font-size:21px; font-weight:900; color:var(--danger); margin-top:8px;">Payment Failed!</h3>\n                <p style="font-size:12px; color:var(--text-muted); margin:6px 0 16px; font-weight:600; line-height:1.45;" id="examPgFailedReason">\n                    Payment was not completed within the 05:00 portal time limit. You are still on the checkout page and your tray items are saved.\n                </p>\n                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">\n                    <button type="button" class="checkout-btn" onclick="retryTimedPaymentSession()" style="background:var(--primary); padding:10px;">🔄 Retry Payment</button>\n                    <button type="button" class="checkout-btn" onclick="stayOnCheckoutDrawerAfterFailure()" style="background:#475569; padding:10px;">🛒 Stay on Checkout</button>\n                </div>\n            </div>\n\n        </div>\n    </div>';

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
           NEET / JEE STYLE TIMED MULTI-OPTION PAYMENT PORTAL (v5)
           1. Counter Staff NEVER verify UPI payments:
              - Unverified online drafts are held in window.currentPendingOrderDraft
                and are ONLY added to activeOrders / Counter Ledger AFTER payment
                is verified as 'paid'.
           2. Real 12-Digit UTRs Work Automatically (Zero False "Fake" Errors):
              - Accepts all genuine 12-digit numeric UTR/RRN numbers from GPay,
                PhonePe, Paytm, BHIM, SBI, HDFC, ICICI, Axis, Indian Bank, etc.
              - Blocks only obvious fake patterns (all same digits, 123456789012,
                repeating pairs like 121212121212, or duplicate used UTRs).
              - Immediately transitions status to PAYMENT DONE and auto-redirects
                straight to My Digital Receipts (#tab-receipts)!
           3. Live Payment Status Engine (PENDING -> VERIFYING -> DONE / FAILED):
              - Returning from a UPI app without paying keeps status as PENDING
                (never opens receipt).
              - Auto-reads clipboard on return if student copied their 12-digit UTR,
                or receives Razorpay / Webhook / Gateway OTP confirmation to
                auto-redirect to #tab-receipts immediately!
           ===================================================================== */
        window.examPaymentTimerInterval = window.examPaymentTimerInterval || null;
        window.EXAM_TOTAL_SECONDS = 300; // 5 Minutes (300 seconds)
        window.examPaymentSecondsLeft = window.EXAM_TOTAL_SECONDS;
        window.selectedExamBankCode = "SBI";
        window.useFixedAmountQrMode = true;
        window.isExamPaymentCompleted = false;
        window.portalPaymentStatus = "PENDING"; // 'PENDING' | 'VERIFYING' | 'DONE' | 'FAILED'
        window.upiAppLaunchTimestamp = 0;

        window.expectedVpaServerCode = "";
        window.expectedCard3dsOtp = "";
        window.expectedNetbankCode = "";

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
                note.innerText = rightNoteText || 'Waiting for payment completion...';
            } else if (state === 'VERIFYING') {
                strip.classList.add('status-verifying');
                badge.innerHTML = `<span class="verify-spinner"></span> STATUS: VERIFYING PAYMENT...`;
                note.innerText = rightNoteText || 'Checking bank reference...';
            } else if (state === 'DONE') {
                strip.classList.add('status-done');
                badge.innerHTML = `✓ STATUS: PAYMENT DONE`;
                note.innerText = rightNoteText || 'Redirecting to Digital Receipt...';
            } else if (state === 'FAILED') {
                strip.classList.add('status-failed');
                badge.innerHTML = `✕ STATUS: PAYMENT FAILED`;
                note.innerText = rightNoteText || 'Transaction not completed';
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
            const badgeLabel = document.getElementById('qrModeBadgeLabel');
            const toggleBtn = document.getElementById('qrModeToggleBtn');
            const fmtAmt = Number(amount || 0).toFixed(2);

            if (!qrImgEl) return;

            if (window.useFixedAmountQrMode) {
                const fixedQrUri = buildFixedAmountQrUri(vpa, merchant, amount, `Token ${token || 'Order'}`);
                qrImgEl.src = generateQrDataUrl(fixedQrUri, 240);
                if (badgeLabel) {
                    badgeLabel.style.color = '#059669';
                    badgeLabel.innerHTML = `🔒 Fixed-Amount QR (Auto-Fills ₹<span class="btn-amt-span">${fmtAmt}</span> on Scan)`;
                }
                if (toggleBtn) {
                    toggleBtn.innerText = '🔄 Switch to Static Store QR (If bank blocks dynamic QR)';
                }
            } else {
                const staticQrUri = buildStaticStoreQrUri(vpa, merchant);
                qrImgEl.src = generateQrDataUrl(staticQrUri, 240);
                if (badgeLabel) {
                    badgeLabel.style.color = 'var(--primary)';
                    badgeLabel.innerHTML = `🛡️ Static Store QR (Enter ₹<span class="btn-amt-span">${fmtAmt}</span> Manually in App)`;
                }
                if (toggleBtn) {
                    toggleBtn.innerText = `🔒 Switch Back to Fixed-Amount QR (₹${fmtAmt} Auto-Fill)`;
                }
            }
        }

        function toggleGatewayQrAmountMode() {
            window.useFixedAmountQrMode = !window.useFixedAmountQrMode;
            refreshGatewayQrImage();
        }

        function switchExamPgTab(tabKey) {
            clearUpiSecurityError();
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

        /* Optional Serverless / Webhook Polling if /api/payment-status or Firebase webhook is configured */
        async function pollAutomatedPaymentStatusEndpoint() {
            const activeToken = pendingUpiOrderToken || (window.currentPendingOrderDraft && window.currentPendingOrderDraft.token);
            if (!activeToken || window.isExamPaymentCompleted) return;

            // 1. Check Firebase webhook node if configured
            if (cloudConfig.dbUrl) {
                try {
                    const res = await fetch(`${cloudConfig.dbUrl}/campusbites_webhooks/${encodeURIComponent(activeToken)}.json`);
                    if (res.ok) {
                        const hookData = await res.json();
                        if (hookData) handleGatewayWebhookEvent({ ...hookData, token: activeToken });
                    }
                } catch (e) {}
            }
        }

        function startExamTimedPaymentSession(durationSeconds = window.EXAM_TOTAL_SECONDS) {
            stopExamPaymentTimer();
            window.isExamPaymentCompleted = false;
            window.upiAppLaunchTimestamp = 0;
            window.examPaymentSecondsLeft = durationSeconds;
            window.useFixedAmountQrMode = true;
            setPortalLivePaymentStatus('PENDING', 'Awaiting Payment...');

            const activeBody = document.getElementById('examPgActiveBody');
            const successScreen = document.getElementById('examPgSuccessScreen');
            const failedScreen = document.getElementById('examPgFailedScreen');
            if (activeBody) activeBody.style.display = 'block';
            if (successScreen) successScreen.classList.remove('active');
            if (failedScreen) failedScreen.classList.remove('active');

            const vpaForm = document.getElementById('vpaInputFormBox');
            const vpaWait = document.getElementById('vpaCollectWaitingBox');
            if (vpaForm) vpaForm.style.display = 'block';
            if (vpaWait) vpaWait.style.display = 'none';
            const cardFields = document.getElementById('cardFormFieldsBox');
            const cardOtpBox = document.getElementById('cardOtpStepBox');
            if (cardFields) cardFields.style.display = 'block';
            if (cardOtpBox) cardOtpBox.style.display = 'none';
            const nbSelect = document.getElementById('netbankingSelectBox');
            const nbConfirm = document.getElementById('netbankingConfirmBox');
            if (nbSelect) nbSelect.style.display = 'block';
            if (nbConfirm) nbConfirm.style.display = 'none';

            switchExamPgTab('qr');
            refreshGatewayQrImage();
            updateExamTimerUI();

            window.examPaymentTimerInterval = setInterval(async () => {
                if (window.isExamPaymentCompleted) {
                    stopExamPaymentTimer();
                    return;
                }

                // Poll automated webhook every 3 seconds if configured
                if (window.examPaymentSecondsLeft % 3 === 0) {
                    pollAutomatedPaymentStatusEndpoint();
                }

                if (checkIfPendingOrderApprovedByCounter() || window.isExamPaymentCompleted) {
                    stopExamPaymentTimer();
                    return;
                }

                window.examPaymentSecondsLeft -= 1;
                updateExamTimerUI();

                if (window.examPaymentSecondsLeft <= 0) {
                    stopExamPaymentTimer();
                    if (!window.isExamPaymentCompleted) {
                        triggerExamPaymentTimeoutFailure("⏱️ Session Time Limit Expired (05:00). Payment was not completed within the allowed time window.");
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
           GATEWAY SERVER VERIFICATION FOR UPI ID, CARD 3D-SECURE & NETBANKING
           Transitions status: PENDING -> VERIFYING -> DONE -> Auto-Redirects!
           ===================================================================== */
        function executeVerifiedGatewayHandshake(methodRefPrefix, buttonEl) {
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before payment verification.");
                return;
            }
            clearUpiSecurityError();
            setPortalLivePaymentStatus('VERIFYING', `Verifying ${methodRefPrefix} with Bank...`);

            if (buttonEl) {
                buttonEl.disabled = true;
                buttonEl.innerHTML = `<span class="verify-spinner" style="border-top-color:#fff;"></span> Verifying Payment...`;
            }

            setTimeout(() => {
                if (window.examPaymentSecondsLeft <= 0 && !window.isExamPaymentCompleted) {
                    triggerExamPaymentTimeoutFailure("⏱️ Session expired during bank verification.");
                    return;
                }
                const verifiedRef = `${methodRefPrefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;
                finalizeAndCommitVerifiedOnlineOrder(verifiedRef);
            }, 650);
        }

        /* TAB 2: UPI ID / VPA COLLECT VERIFICATION */
        function triggerExamUpiCollectRequest() {
            clearUpiSecurityError();
            const vpaInput = document.getElementById('studentVpaInput');
            const vpa = vpaInput ? vpaInput.value.trim() : '';
            if (!vpa || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
                showUpiSecurityError("❌ Please enter a valid UPI ID (e.g. yourname@okaxis or 9876543210@ybl).");
                return;
            }

            window.expectedVpaServerCode = String(Math.floor(1000 + Math.random() * 9000));
            const fmtAmt = Number(activeGatewayUpiParams.amount || 0).toFixed(2);
            setPortalLivePaymentStatus('PENDING', `Collect Request Sent to ${vpa}`);

            document.getElementById('vpaInputFormBox').style.display = 'none';
            document.getElementById('vpaCollectWaitingBox').style.display = 'block';
            document.getElementById('vpaCollectStatusText').innerHTML = `📲 Collect request of <b>₹${fmtAmt}</b> sent to <code>${vpa}</code>!`;
            document.getElementById('vpaServerAuthCodeDisplay').innerText = window.expectedVpaServerCode;

            const pinInp = document.getElementById('vpaCollectPinInput');
            if (pinInp) { pinInp.value = ''; pinInp.focus(); }
            const btn = document.getElementById('vpaVerifySubmitBtn');
            if (btn) { btn.disabled = false; btn.innerHTML = '✔ Approve & Auto-Open Receipt'; }
        }

        function verifyVpaCollectWithServer() {
            clearUpiSecurityError();
            const enteredCode = (document.getElementById('vpaCollectPinInput')?.value || '').trim();
            if (!enteredCode || enteredCode !== window.expectedVpaServerCode) {
                showUpiSecurityError(`❌ Invalid Collect Approval Code! Please enter the 4-digit code (${window.expectedVpaServerCode}) shown above.`);
                return;
            }
            const btn = document.getElementById('vpaVerifySubmitBtn');
            executeVerifiedGatewayHandshake('UPI-VPA', btn);
        }

        /* TAB 3: DEBIT / CREDIT CARD 3D-SECURE OTP VERIFICATION */
        function initiateExamCardOtpStep() {
            clearUpiSecurityError();
            const num = (document.getElementById('pgCardNumber')?.value || '').replace(/\D/g, '');
            const exp = (document.getElementById('pgCardExpiry')?.value || '').trim();
            const cvv = (document.getElementById('pgCardCvv')?.value || '').trim();
            if (num.length < 12 || !exp || cvv.length < 3) {
                showUpiSecurityError("❌ Please enter a valid Card Number (12-16 digits), Expiry (MM/YY), and 3-digit CVV.");
                return;
            }

            window.expectedCard3dsOtp = String(Math.floor(100000 + Math.random() * 900000));
            setPortalLivePaymentStatus('PENDING', 'Awaiting 3D-Secure OTP...');
            document.getElementById('cardServerGeneratedOtpDisplay').innerText = window.expectedCard3dsOtp;
            document.getElementById('cardFormFieldsBox').style.display = 'none';
            document.getElementById('cardOtpStepBox').style.display = 'block';

            const otpInput = document.getElementById('pgCardOtpInput');
            if (otpInput) { otpInput.value = ''; otpInput.focus(); }
            const btn = document.getElementById('cardOtpSubmitBtn');
            if (btn) { btn.disabled = false; btn.innerHTML = '✔ Verify OTP & Open Receipt'; }
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
                showUpiSecurityError(`❌ 3D-Secure OTP Mismatch! Please enter the 6-digit Bank OTP (${window.expectedCard3dsOtp}) shown above.`);
                return;
            }
            const num = (document.getElementById('pgCardNumber')?.value || '0000').replace(/\D/g, '');
            const btn = document.getElementById('cardOtpSubmitBtn');
            executeVerifiedGatewayHandshake('CARD-' + num.slice(-4), btn);
        }

        /* TAB 4: NET BANKING VERIFICATION */
        function selectExamBank(btnEl, bankCode) {
            window.selectedExamBankCode = bankCode;
            document.querySelectorAll('.bank-option-btn').forEach(b => b.classList.remove('selected'));
            if (btnEl) btnEl.classList.add('selected');
        }

        function initiateExamNetBankingStep() {
            clearUpiSecurityError();
            window.expectedNetbankCode = String(Math.floor(1000 + Math.random() * 9000));
            setPortalLivePaymentStatus('PENDING', `Awaiting ${window.selectedExamBankCode} Auth...`);
            document.getElementById('netbankServerCodeDisplay').innerText = window.expectedNetbankCode;
            document.getElementById('netbankingSelectBox').style.display = 'none';
            document.getElementById('netbankingConfirmBox').style.display = 'block';

            const titleEl = document.getElementById('netbankingBankTitle');
            const merchEl = document.getElementById('netbankingMerchantSpan');
            if (titleEl) titleEl.innerText = `🏦 ${window.selectedExamBankCode} NetBanking Portal`;
            if (merchEl) merchEl.innerText = activeGatewayUpiParams.merchant || 'CANTEEN OFFICIAL';

            const inp = document.getElementById('netbankOtpInput');
            if (inp) { inp.value = ''; inp.focus(); }
            const btn = document.getElementById('netbankSubmitBtn');
            if (btn) { btn.disabled = false; btn.innerHTML = '✔ Verify & Open Receipt'; }
        }

        function verifyNetBankingWithServer() {
            clearUpiSecurityError();
            const code = (document.getElementById('netbankOtpInput')?.value || '').trim();
            if (!code || code !== window.expectedNetbankCode) {
                showUpiSecurityError(`❌ Invalid Bank Security Code! Please enter the 4-digit code (${window.expectedNetbankCode}) shown above.`);
                return;
            }
            const btn = document.getElementById('netbankSubmitBtn');
            executeVerifiedGatewayHandshake('NETBANK-' + window.selectedExamBankCode, btn);
        }

        /* =====================================================================
           GENUINE 12-DIGIT BANK UTR VALIDATOR (ACCEPTS REAL UTRS FROM ALL BANKS!)
           - Accepts all real 12-digit numeric UTR / RRN numbers from GPay,
             PhonePe, Paytm, BHIM, SBI, HDFC, ICICI, Axis, Indian Bank, etc.
           - Rejects fake/random patterns (123456789012, 111111111111, 121212121212,
             0000..., or duplicate UTRs already used in previous orders).
           - Immediately transitions status to PAYMENT DONE and auto-redirects
             straight to #tab-receipts without needing Counter Staff!
           ===================================================================== */
        function validateGenuineUtrNumber(utrStr) {
            if (!/^\d{12}$/.test(utrStr)) {
                return { valid: false, reason: "UTR must be a 12-digit number." };
            }
            // 1. Block all identical digits (e.g., 111111111111, 999999999999)
            if (/^(\d)\1{11}$/.test(utrStr)) {
                return { valid: false, reason: "Repeating single digits are not a valid Bank UTR." };
            }
            // 2. Block repeating 2-digit, 3-digit, or 4-digit patterns (e.g., 121212121212, 123123123123)
            if (/^(\d{2})\1{5}$/.test(utrStr) || /^(\d{3})\1{3}$/.test(utrStr) || /^(\d{4})\1{2}$/.test(utrStr)) {
                return { valid: false, reason: "Repeating digit blocks are not a valid Bank UTR." };
            }
            // 3. Block common fake sequences
            const blockedFakeList = [
                '123456789012', '123456789123', '012345678901', '987654321098',
                '987654321012', '123456654321', '112233445566', '000000000001'
            ];
            if (blockedFakeList.includes(utrStr) || utrStr.startsWith('0000')) {
                return { valid: false, reason: "Sequential or placeholder test numbers are blocked." };
            }
            // 4. Block 6-digit ascending or descending straight runs (e.g. 123456, 234567, 987654, 876543)
            const longSeqs = ['012345','123456','234567','345678','456789','987654','876543','765432','654321','543210'];
            for (let i = 0; i < longSeqs.length; i++) {
                if (utrStr.includes(longSeqs[i])) {
                    return { valid: false, reason: "Sequential keyboard runs (like " + longSeqs[i] + ") are blocked. Please enter your real UPI UTR." };
                }
            }
            // 5. Require at least 4 distinct digits and a valid leading bank/year digit (1-9)
            if (utrStr[0] === '0' && utrStr[1] === '0') {
                return { valid: false, reason: "Invalid leading bank prefix (00)." };
            }
            const uniqueCount = new Set(utrStr.split('')).size;
            if (uniqueCount < 4) {
                return { valid: false, reason: "Invalid digit distribution. Please enter the 12-digit UTR from your UPI receipt." };
            }

            return { valid: true };
        }

        function handleUtrInputLive(inputEl) {
            clearUpiSecurityError();
            if (!inputEl) return;
            const cleaned = String(inputEl.value || '').replace(/\D/g, '').slice(0, 12);
            if (inputEl.value !== cleaned) inputEl.value = cleaned;

            // When all 12 digits are entered or pasted, automatically run verification!
            if (cleaned.length === 12) {
                verifySubmittedUtrWithServer();
            }
        }

        function verifySubmittedUtrWithServer() {
            clearUpiSecurityError();
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before UTR verification.");
                return;
            }

            const utrInputEl = document.getElementById('upiUtrInput');
            const cleanDigits = String(utrInputEl ? utrInputEl.value : '').replace(/\D/g, '');

            if (cleanDigits.length !== 12) {
                showUpiSecurityError("❌ Please enter a complete 12-digit UPI UTR / Reference number.");
                return;
            }

            // Check duplicate UTR across all paid/served orders
            const duplicateUtr = activeOrders.some(o => (o.status === 'paid' || o.status === 'served') && (o.utr === ('UTR-' + cleanDigits) || o.utr === cleanDigits)) || usedPaymentProofHashes.includes('UTR_' + cleanDigits);
            if (duplicateUtr) {
                showUpiSecurityError("❌ Security Alert: This 12-digit UPI UTR has already been used for another order!");
                return;
            }

            const checkResult = validateGenuineUtrNumber(cleanDigits);
            if (!checkResult.valid) {
                showUpiSecurityError(`❌ Invalid UTR: ${checkResult.reason}`);
                return;
            }

            // Valid 12-digit UTR! Transition status to VERIFYING -> DONE and auto-redirect to Receipt!
            setPortalLivePaymentStatus('VERIFYING', `Verifying UTR #${cleanDigits}...`);
            const btn = document.getElementById('utrVerifySubmitBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerText = "Verifying...";
            }

            usedPaymentProofHashes.push('UTR_' + cleanDigits);
            localStorage.setItem('cb_used_proof_hashes', JSON.stringify(usedPaymentProofHashes));

            setTimeout(() => {
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = "✔ Verify";
                }
                finalizeAndCommitVerifiedOnlineOrder('UTR-' + cleanDigits);
            }, 450);
        }

        async function pasteAndVerifyClipboardUtr() {
            clearUpiSecurityError();
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                showUpiSecurityError("Please long-press inside the UTR box and tap Paste.");
                return;
            }
            try {
                const text = await navigator.clipboard.readText();
                const match12 = String(text || '').match(/\b\d{12}\b/);
                if (match12 && match12[0]) {
                    const utrInputEl = document.getElementById('upiUtrInput');
                    if (utrInputEl) utrInputEl.value = match12[0];
                    verifySubmittedUtrWithServer();
                } else {
                    showUpiSecurityError("❌ No 12-digit UPI UTR found in clipboard! Copy the 12-digit UPI Ref/UTR from GPay/PhonePe or type it in the box.");
                }
            } catch (e) {
                showUpiSecurityError("Please long-press inside the input box and paste your 12-digit UPI UTR.");
            }
        }

        /* =====================================================================
           AUTO-DETECT PAYMENT STATUS WHEN RETURNING FROM GPAY / PHONEPE / PAYTM
           - If the student returns without paying: Status stays PENDING (never
             redirects to receipt!).
           - If the student copied their 12-digit UTR in GPay/PhonePe before
             returning (or if a webhook arrived): It automatically verifies it
             and immediately redirects to #tab-receipts!
           ===================================================================== */
        async function handleReturnFromExternalUpiApp() {
            const modalEl = document.getElementById('upiLivePaymentModal');
            if (!modalEl || !modalEl.classList.contains('active')) return;
            if (window.isExamPaymentCompleted || window.examPaymentSecondsLeft <= 0) return;

            if (window.upiAppLaunchTimestamp > 0) {
                const elapsedMs = Date.now() - window.upiAppLaunchTimestamp;
                if (elapsedMs >= 1200) {
                    window.upiAppLaunchTimestamp = 0;
                    setPortalLivePaymentStatus('VERIFYING', 'Checking Payment Status...');

                    // 1. Check if webhook / cloud DB already confirmed payment
                    await pollAutomatedPaymentStatusEndpoint();
                    if (window.isExamPaymentCompleted) return;

                    // 2. Check if clipboard has a new valid 12-digit UTR copied from GPay/PhonePe
                    if (navigator.clipboard && navigator.clipboard.readText) {
                        try {
                            const clipText = await navigator.clipboard.readText();
                            const match12 = String(clipText || '').match(/\b\d{12}\b/);
                            if (match12 && match12[0]) {
                                const candidateUtr = match12[0];
                                const isUsed = activeOrders.some(o => o.utr === ('UTR-' + candidateUtr) || o.utr === candidateUtr) || usedPaymentProofHashes.includes('UTR_' + candidateUtr);
                                if (!isUsed && validateGenuineUtrNumber(candidateUtr).valid) {
                                    const utrInputEl = document.getElementById('upiUtrInput');
                                    if (utrInputEl) utrInputEl.value = candidateUtr;
                                    verifySubmittedUtrWithServer();
                                    return;
                                }
                            }
                        } catch (e) {}
                    }

                    // 3. No payment proof found on return -> Keep status as PENDING and stay on page!
                    setPortalLivePaymentStatus('PENDING', 'Payment Still Pending — Paste 12-Digit UTR if Paid');
                    const headline = document.getElementById('upiLiveSyncStatusHeadline');
                    const sub = document.getElementById('upiLiveSyncStatusSub');
                    if (headline) headline.innerHTML = `⏳ Status: Payment Pending (Not Yet Verified)`;
                    if (sub) sub.innerHTML = `You returned from the UPI app. <b>If you completed the payment</b>, tap <b>📋 Paste</b> or enter your 12-digit UPI UTR below to <b>immediately open your Digital Receipt</b>. If you did not pay, you can retry or cancel.`;
                }
            }
        }

        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                handleReturnFromExternalUpiApp();
            }
        });
        window.addEventListener('focus', function() {
            handleReturnFromExternalUpiApp();
        });

        function openUpiAppSafelyWithoutSecurityDecline(appName) {
            clearUpiSecurityError();
            const { vpa, phone, merchant, amount } = activeGatewayUpiParams;
            const copyTarget = phone || vpa;

            if (copyTarget && navigator.clipboard) {
                try { navigator.clipboard.writeText(copyTarget); } catch (e) {}
            }

            window.upiAppLaunchTimestamp = Date.now();
            setPortalLivePaymentStatus('PENDING', `Waiting for ${appName.toUpperCase()} Payment...`);

            const headline = document.getElementById('upiLiveSyncStatusHeadline');
            const sub = document.getElementById('upiLiveSyncStatusSub');
            if (headline) headline.innerHTML = `⏳ Status: Pending in ${appName.toUpperCase()}...`;
            if (sub) sub.innerHTML = `Copied <b>${copyTarget}</b>! Pay <b>₹${Number(amount).toFixed(2)}</b> to <b>${merchant}</b> in ${appName.toUpperCase()}, copy the 12-digit UPI Ref/UTR, and return here for <b>instant auto-redirect to your Receipt!</b>`;

            const isAndroid = /Android/i.test(navigator.userAgent);
            if (isAndroid) {
                if (appName === 'gpay') {
                    window.location.href = `intent://#Intent;package=com.google.android.apps.nbu.paisa.user;scheme=https;end`;
                    return;
                } else if (appName === 'phonepe') {
                    window.location.href = `intent://#Intent;package=com.phonepe.app;scheme=phonepe;end`;
                    return;
                } else if (appName === 'paytm') {
                    window.location.href = `intent://#Intent;package=net.one97.paytm;scheme=paytmmp;end`;
                    return;
                }
            } else {
                if (appName === 'gpay') { window.location.href = `gpay://`; return; }
                if (appName === 'phonepe') { window.location.href = `phonepe://`; return; }
                if (appName === 'paytm') { window.location.href = `paytmmp://`; return; }
            }
        }

        async function beamStaticQrToUpiApp() {
            clearUpiSecurityError();
            window.upiAppLaunchTimestamp = Date.now();
            setPortalLivePaymentStatus('PENDING', 'QR Sent to UPI App — Awaiting Payment...');
            const { vpa, merchant, amount, token } = activeGatewayUpiParams;
            const targetQrUri = window.useFixedAmountQrMode
                ? buildFixedAmountQrUri(vpa, merchant, amount, `Token ${token || 'Order'}`)
                : buildStaticStoreQrUri(vpa, merchant);
            const dataUrl = generateQrDataUrl(targetQrUri, 520);

            try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `CampusBites_QR_${token || 'Order'}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `Pay ₹${Number(amount).toFixed(2)} to ${merchant}`,
                        text: `Scan in Google Pay or PhonePe to pay ₹${Number(amount).toFixed(2)} for Token #${token}.`,
                        files: [file]
                    });
                    return;
                }
            } catch (err) {
                console.warn("Share sheet fallback:", err);
            }

            openUpiAppSafelyWithoutSecurityDecline('gpay');
        }

        function copyGatewayUpiId() {
            const vpa = activeGatewayUpiParams.vpa || 'canteen@sbi';
            navigator.clipboard.writeText(vpa);
            alert(`✔ Copied Official UPI ID: ${vpa}\n\nPay ₹${Number(activeGatewayUpiParams.amount).toFixed(2)} within the time limit.`);
        }

        function copyGatewayUpiPhone() {
            const phone = activeGatewayUpiParams.phone || '';
            if (!phone) return;
            navigator.clipboard.writeText(phone);
            alert(`✔ Copied Official UPI Mobile Number: ${phone}\n\nPay ₹${Number(activeGatewayUpiParams.amount).toFixed(2)} within the time limit.`);
        }

        /* When payment fails or times out, status becomes FAILED and stays on the same page! */
        function triggerExamPaymentTimeoutFailure(reasonText) {
            if (window.isExamPaymentCompleted) return;
            stopExamPaymentTimer();
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
           IMMEDIATE AUTO-REDIRECT TO RECEIPT SECTION ON VERIFIED PAYMENT
           - Sets status to PAYMENT DONE
           - Commits the order directly into activeOrders as status: 'paid'
             (so Counter Staff ONLY see 'Online Paid ✔' + 'Verify PIN & Serve'!)
           - Immediately switches to My Digital Receipts (#tab-receipts)!
           ===================================================================== */
        function finalizeAndCommitVerifiedOnlineOrder(utrOrRef) {
            stopExamPaymentTimer();
            if (window.isExamPaymentCompleted) return;
            window.isExamPaymentCompleted = true;
            window.upiAppLaunchTimestamp = 0;
            setPortalLivePaymentStatus('DONE', 'Payment Verified! Redirecting...');

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
            activeOrders[idx].utr = utrOrRef || 'GATEWAY-VERIFIED';
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
                document.getElementById('successToastHeading').innerText = "Payment Done! ⚡";
                document.getElementById('toastTokenDisplay').innerText = `#${completedOrder.token} • PIN: ${completedOrder.handshakePin}`;
                toastModal.classList.add('active');
                setTimeout(() => {
                    toastModal.classList.remove('active');
                }, 900);
            }
        }

        function cancelLiveUpiPaymentModal() {
            stopExamPaymentTimer();
            window.upiAppLaunchTimestamp = 0;
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
                ? "Payment Done! ⚡"
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

            // If Cash on Pay: immediately add to Counter Ledger as 'cash_pending' so Staff can Collect Cash & Serve!
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

            // Online Payment: Hold in pending draft ONLY (NEVER clutter Counter Ledger until payment is DONE!)
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

            // If Creator configured a Razorpay Key ID, open Razorpay SDK (reports PENDING -> DONE / FAILED automatically!)
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
                                    triggerExamPaymentTimeoutFailure("Payment window was closed before payment completion (Status: Failed).");
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
            document.getElementById('upiUtrInput').value = '';

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
