/**
 * CampusBites - NEET / JEE Competitive Exam Style Timed Multi-Option Payment Portal (v3 - Strict Server Verification)
 * Fixes:
 *  - Clicking "Verify Payment on Server" (or returning from GPay/PhonePe/Paytm) NEVER marks an order as paid without real payment!
 *  - Pings the Server (MQTT + Firebase Realtime DB + Canteen Counter Server Ledger) and displays a live Server Verification Radar.
 *  - ONLY when the Server confirms the payment is really paid (or Razorpay signature / genuine 12-digit Bank UTR is verified)
 *    does it stop the timer and auto-redirect straight to My Digital Receipts (#tab-receipts).
 *  - If not paid yet, it stays on the payment portal and continues polling the server until confirmed or until the 05:00 timer expires.
 */
(function () {
    const PORTAL_CSS = '\n        /* =====================================================================\n           NEET / JEE COMPETITIVE EXAM STYLE TIMED MULTI-OPTION PAYMENT PORTAL\n           WITH STRICT SERVER VERIFICATION & AUTO-REDIRECT\n           ===================================================================== */\n        .exam-pg-header {\n            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);\n            color: #ffffff;\n            padding: 14px 16px;\n            border-radius: 18px;\n            margin-bottom: 10px;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            gap: 10px;\n            box-shadow: 0 8px 20px rgba(49, 46, 129, 0.28), inset 0 1px 1.5px rgba(255, 255, 255, 0.35);\n        }\n        .exam-timer-pill {\n            background: rgba(16, 185, 129, 0.22);\n            border: 1.5px solid #10b981;\n            color: #6ee7b7;\n            padding: 6px 12px;\n            border-radius: 12px;\n            font-family: monospace;\n            font-size: 16px;\n            font-weight: 900;\n            display: inline-flex;\n            align-items: center;\n            gap: 6px;\n            white-space: nowrap;\n        }\n        .exam-timer-pill.danger-zone {\n            background: rgba(239, 68, 68, 0.28);\n            border-color: #ef4444;\n            color: #fca5a5;\n            animation: examPulseDanger 1s infinite ease-in-out;\n        }\n        @keyframes examPulseDanger {\n            0%, 100% { transform: scale(1); }\n            50% { transform: scale(1.05); }\n        }\n        .exam-timer-bar-track {\n            width: 100%;\n            height: 6px;\n            background: rgba(148, 163, 184, 0.25);\n            border-radius: 6px;\n            overflow: hidden;\n            margin-bottom: 12px;\n        }\n        .exam-timer-bar-fill {\n            height: 100%;\n            width: 100%;\n            background: linear-gradient(90deg, #10b981, #4f46e5);\n            transition: width 1s linear, background 0.3s ease;\n        }\n        .exam-pg-tabs {\n            display: grid;\n            grid-template-columns: repeat(4, 1fr);\n            gap: 6px;\n            margin-bottom: 12px;\n        }\n        .exam-pg-tab {\n            background: var(--surface-sub-bg);\n            border: 1.5px solid var(--liquid-glass-border);\n            border-radius: 11px;\n            padding: 8px 4px;\n            font-size: 11px;\n            font-weight: 800;\n            color: var(--text-muted);\n            cursor: pointer;\n            text-align: center;\n            transition: 0.15s ease;\n        }\n        .exam-pg-tab.active {\n            background: rgba(79, 70, 229, 0.18);\n            border-color: var(--primary);\n            color: var(--primary);\n            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);\n        }\n        [data-theme="dark"] .exam-pg-tab.active {\n            color: #a5b4fc;\n        }\n        .exam-pg-pane { display: none; }\n        .exam-pg-pane.active { display: block; }\n        .bank-grid {\n            display: grid;\n            grid-template-columns: 1fr 1fr;\n            gap: 8px;\n            margin-bottom: 10px;\n        }\n        .bank-option-btn {\n            background: var(--surface-row-bg);\n            border: 1.5px solid var(--liquid-glass-border);\n            border-radius: 10px;\n            padding: 9px 10px;\n            font-size: 11.5px;\n            font-weight: 800;\n            color: var(--text-main);\n            cursor: pointer;\n            text-align: left;\n            transition: 0.15s ease;\n        }\n        .bank-option-btn.selected {\n            border-color: var(--primary);\n            background: rgba(79, 70, 229, 0.16);\n            color: var(--primary);\n        }\n        [data-theme="dark"] .bank-option-btn.selected {\n            color: #a5b4fc;\n        }\n        .pg-status-screen {\n            display: none;\n            text-align: center;\n            padding: 22px 12px;\n        }\n        .pg-status-screen.active { display: block; }\n        .qr-mode-switch-pill {\n            background: rgba(16, 185, 129, 0.14);\n            color: #059669;\n            border: 1px solid rgba(16, 185, 129, 0.45);\n            padding: 4px 10px;\n            border-radius: 20px;\n            font-size: 10px;\n            font-weight: 900;\n            cursor: pointer;\n            display: inline-flex;\n            align-items: center;\n            gap: 4px;\n            margin-top: 4px;\n        }\n        .server-verify-action-btn {\n            width: 100%;\n            margin-top: 8px;\n            background: linear-gradient(135deg, #4f46e5, #3730a3);\n            color: #ffffff;\n            border: 1.5px solid rgba(255, 255, 255, 0.6);\n            border-radius: 12px;\n            padding: 11px 12px;\n            font-size: 12.5px;\n            font-weight: 900;\n            cursor: pointer;\n            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.45);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 6px;\n            transition: 0.2s ease;\n        }\n        .server-verify-action-btn.verifying {\n            background: linear-gradient(135deg, #d97706, #b45309);\n        }\n        .server-verify-box {\n            display: none;\n            margin-top: 8px;\n            padding: 10px 12px;\n            border-radius: 12px;\n            background: rgba(245, 158, 11, 0.14);\n            border: 1.5px dashed #f59e0b;\n            text-align: left;\n            font-size: 11px;\n            font-weight: 700;\n            color: var(--text-main);\n            line-height: 1.4;\n        }\n        .server-verify-box.active {\n            display: block;\n        }\n        @keyframes spinLoader {\n            0% { transform: rotate(0deg); }\n            100% { transform: rotate(360deg); }\n        }\n        .verify-spinner {\n            display: inline-block;\n            width: 13px;\n            height: 13px;\n            border: 2.5px solid rgba(245, 158, 11, 0.3);\n            border-top-color: #d97706;\n            border-radius: 50%;\n            animation: spinLoader 0.8s linear infinite;\n            vertical-align: middle;\n            margin-right: 5px;\n        }\n';
    const PORTAL_HTML = '    <!-- NEET / JEE EXAM-STYLE TIMED MULTI-OPTION PAYMENT PORTAL (STRICT SERVER VERIFICATION) -->\n    <div class="toast-modal" id="upiLivePaymentModal">\n        <div class="toast-card" style="text-align: left; max-width: 475px; max-height: 93vh; overflow-y: auto; padding: 18px;">\n            \n            <!-- Portal Header with Live Countdown Timer -->\n            <div class="exam-pg-header">\n                <div>\n                    <span style="font-size: 9.5px; font-weight: 900; text-transform: uppercase; color: #a5b4fc; letter-spacing: 0.7px;">🔒 CampusBites Exam-Grade Payment Portal</span>\n                    <h3 style="font-size: 17px; font-weight: 900; margin-top: 2px; color: #fff;" id="upiGateTokenHeading">Pay ₹0.00 • Token #TK-100</h3>\n                    <div style="font-size: 11px; color: #cbd5e1; font-weight: 700; margin-top: 1px;">🏦 <span id="upiGateBankingName">CANTEEN OFFICIAL</span></div>\n                </div>\n                <div style="text-align: right;">\n                    <div class="exam-timer-pill" id="examTimerPill" title="Complete & verify payment before timer hits 00:00">\n                        ⏱️ <span id="examCountdownText">05:00</span>\n                    </div>\n                    <span style="font-size: 9px; color: #cbd5e1; display: block; margin-top: 3px; font-weight: 700;">Session Time Limit</span>\n                </div>\n            </div>\n\n            <!-- Live Depleting Progress Bar -->\n            <div class="exam-timer-bar-track">\n                <div class="exam-timer-bar-fill" id="examTimerBarFill"></div>\n            </div>\n\n            <!-- STATE 1: ACTIVE MULTI-OPTION PAYMENT WORKSPACE -->\n            <div id="examPgActiveBody">\n                <!-- Merchant Summary Bar -->\n                <div class="banking-name-shield" style="margin: 0 0 10px 0; padding: 9px 12px;">\n                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">\n                        <div style="font-size: 11.5px; font-weight: 800; color: var(--primary);">\n                            VPA: <span id="upiGateVpaText" style="font-family: monospace;">canteen@sbi</span>\n                            <button type="button" class="copy-chip-btn" onclick="copyGatewayUpiId()" style="padding: 3px 7px; font-size: 9.5px; margin-left: 4px;">📋 Copy</button>\n                        </div>\n                        <div style="background: #065f46; color: #fff; padding: 3px 9px; border-radius: 8px; font-size: 12px; font-weight: 900;">\n                            Fixed Amt: <strong id="upiGateLockedAmountBadge">₹0.00</strong>\n                        </div>\n                    </div>\n                    <div id="upiGatePhoneRow" style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 5px; border-top: 1px dashed rgba(16,185,129,0.35);">\n                        <div style="font-size: 11px; font-weight: 800; color: var(--text-main);">UPI Mobile #: <span id="upiGatePhoneText" style="font-family: monospace;">--</span></div>\n                        <button type="button" class="copy-chip-btn" style="background:#059669; padding: 3px 8px; font-size: 9.5px;" onclick="copyGatewayUpiPhone()">📋 Copy #</button>\n                    </div>\n                </div>\n\n                <!-- 4 Payment Option Tabs (NEET/JEE Portal Style) -->\n                <div class="exam-pg-tabs">\n                    <button type="button" class="exam-pg-tab active" onclick="switchExamPgTab(\'qr\')" id="pgTab_qr">📷 Fixed QR</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'vpa\')" id="pgTab_vpa">⚡ UPI ID</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'card\')" id="pgTab_card">💳 Card</button>\n                    <button type="button" class="exam-pg-tab" onclick="switchExamPgTab(\'netbanking\')" id="pgTab_netbanking">🏦 NetBank</button>\n                </div>\n\n                <!-- OPTION 1: FIXED-AMOUNT DYNAMIC QR & UPI APPS -->\n                <div class="exam-pg-pane active" id="pgPane_qr">\n                    <div style="text-align: center; background: var(--surface-sub-bg); padding: 10px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div style="font-size: 11px; font-weight: 900; color: #059669;" id="qrModeBadgeLabel">\n                            🔒 Fixed-Amount QR (Auto-Fills ₹<span class="btn-amt-span">0.00</span> on Scan)\n                        </div>\n                        <div class="qr-checkout-frame" style="width: 146px; height: 146px; margin: 6px auto;">\n                            <img id="upiGateQrImg" src="" alt="Fixed Amount UPI QR" />\n                        </div>\n                        <button type="button" class="qr-mode-switch-pill" onclick="toggleGatewayQrAmountMode()" id="qrModeToggleBtn">\n                            🔄 Switch to Static Store QR (If bank blocks dynamic QR)\n                        </button>\n\n                        <div class="upi-app-grid" style="margin-top: 8px;">\n                            <button type="button" class="upi-app-btn beam-qr" onclick="beamStaticQrToUpiApp()">\n                                📲 1-Tap Send Fixed ₹<span class="btn-amt-span">0.00</span> QR to GPay / PhonePe\n                            </button>\n                            <button type="button" class="upi-app-btn gpay" onclick="openUpiAppSafelyWithoutSecurityDecline(\'gpay\')">\n                                🔵 Pay ₹<span class="btn-amt-span">0.00</span> in GPay\n                            </button>\n                            <button type="button" class="upi-app-btn phonepe" onclick="openUpiAppSafelyWithoutSecurityDecline(\'phonepe\')">\n                                🟣 Pay ₹<span class="btn-amt-span">0.00</span> in PhonePe\n                            </button>\n                            <button type="button" class="upi-app-btn paytm" onclick="openUpiAppSafelyWithoutSecurityDecline(\'paytm\')">\n                                ⚡ Pay ₹<span class="btn-amt-span">0.00</span> in Paytm / BHIM\n                            </button>\n                        </div>\n\n                        <!-- STRICT SERVER VERIFICATION BUTTON: Never marks paid unless Server / Counter / UTR confirms! -->\n                        <button type="button" class="server-verify-action-btn" id="qrServerVerifyBtn" onclick="requestServerPaymentVerification(\'UPI-QR\')">\n                            🔍 I Have Paid ₹<span class="btn-amt-span">0.00</span> — Verify Payment on Server\n                        </button>\n                    </div>\n                </div>\n\n                <!-- OPTION 2: UPI ID / VPA COLLECT REQUEST -->\n                <div class="exam-pg-pane" id="pgPane_vpa">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div class="form-group">\n                            <label>Enter Your UPI ID (GPay / PhonePe / Paytm VPA) *</label>\n                            <input type="text" class="form-control" id="studentVpaInput" placeholder="e.g. student@okaxis or 9876543210@ybl">\n                        </div>\n                        <button type="button" class="checkout-btn" onclick="triggerExamUpiCollectRequest()" style="background:#059669; padding: 11px;">\n                            📲 Send ₹<span class="btn-amt-span">0.00</span> Collect Request\n                        </button>\n                        <div id="vpaCollectWaitingBox" style="display:none; margin-top:10px; padding:10px; background:rgba(16,185,129,0.14); border:1.5px dashed #10b981; border-radius:10px; text-align:center; font-size:11.5px; font-weight:700;">\n                            <div id="vpaCollectStatusText" style="color:var(--text-main);">⏳ Collect request for <b>₹<span class="btn-amt-span">0.00</span></b> sent! Complete payment in your UPI app, then click below to verify on server:</div>\n                            <button type="button" onclick="requestServerPaymentVerification(\'UPI-VPA\')" style="margin-top:8px; width:100%; background:#4f46e5; color:#fff; border:none; padding:10px 14px; border-radius:9px; font-weight:900; font-size:12px; cursor:pointer;">\n                                🔍 Verify VPA Payment Status on Server\n                            </button>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 3: DEBIT / CREDIT CARD WITH SERVER VERIFICATION -->\n                <div class="exam-pg-pane" id="pgPane_card">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="cardFormFieldsBox">\n                            <div class="form-group">\n                                <label>Card Number (RuPay / Visa / Mastercard) *</label>\n                                <input type="tel" class="form-control" id="pgCardNumber" maxlength="16" placeholder="4532 XXXX XXXX XXXX">\n                            </div>\n                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">\n                                <div class="form-group">\n                                    <label>Expiry (MM/YY) *</label>\n                                    <input type="text" class="form-control" id="pgCardExpiry" maxlength="5" placeholder="08/29">\n                                </div>\n                                <div class="form-group">\n                                    <label>CVV *</label>\n                                    <input type="password" class="form-control" id="pgCardCvv" maxlength="3" placeholder="•••">\n                                </div>\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="initiateExamCardOtpStep()" style="padding: 10px;">\n                                🔒 Proceed to 3D-Secure Bank Verification (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n\n                        <div id="cardOtpStepBox" style="display:none; text-align:center; padding:8px;">\n                            <div style="font-size:12px; font-weight:900; color:var(--primary); margin-bottom:4px;">🔐 Bank 3D-Secure & Server Verification</div>\n                            <p style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">Enter the 6-digit Bank OTP to submit <b>₹<span class="btn-amt-span">0.00</span></b> for Server Verification:</p>\n                            <input type="tel" class="form-control" id="pgCardOtpInput" maxlength="6" placeholder="Enter 6-Digit Bank OTP" style="text-align:center; font-family:monospace; font-size:15px; font-weight:900; letter-spacing:3px; margin-bottom:8px;">\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" onclick="verifyExamCardOtpAndPay()" style="background:#4f46e5; padding:9px;">🔍 Submit & Verify on Server</button>\n                                <button type="button" class="checkout-btn" onclick="cancelExamCardOtpStep()" style="background:#64748b; padding:9px; width:auto;">Back</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- OPTION 4: NET BANKING WITH SERVER VERIFICATION -->\n                <div class="exam-pg-pane" id="pgPane_netbanking">\n                    <div style="background: var(--surface-sub-bg); padding: 12px; border-radius: 14px; border: 1px solid var(--liquid-glass-border);">\n                        <div id="netbankingSelectBox">\n                            <label style="font-size:10.5px; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:6px;">Select Your Bank</label>\n                            <div class="bank-grid">\n                                <button type="button" class="bank-option-btn selected" onclick="selectExamBank(this, \'SBI\')">🏦 State Bank of India</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'HDFC\')">🏦 HDFC Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'ICICI\')">🏦 ICICI Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'INDIAN\')">🏦 Indian Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'CANARA\')">🏦 Canara Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'AXIS\')">🏦 Axis Bank</button>\n                            </div>\n                            <button type="button" class="checkout-btn" onclick="initiateExamNetBankingStep()" style="padding: 10px;">\n                                🏦 Proceed to Bank Gateway (₹<span class="btn-amt-span">0.00</span>)\n                            </button>\n                        </div>\n\n                        <div id="netbankingConfirmBox" style="display:none; text-align:center; padding:10px; background:rgba(79,70,229,0.1); border-radius:10px; border:1px solid var(--primary);">\n                            <div style="font-size:12.5px; font-weight:900; color:var(--primary);" id="netbankingBankTitle">🏦 SBI Corporate Gateway</div>\n                            <p style="font-size:11px; color:var(--text-muted); margin:4px 0 10px;">Complete payment of <b>₹<span class="btn-amt-span">0.00</span></b> to <b id="netbankingMerchantSpan">CANTEEN</b> and verify with server:</p>\n                            <div style="display:flex; gap:6px;">\n                                <button type="button" class="checkout-btn" onclick="requestServerPaymentVerification(\'NETBANK-\' + window.selectedExamBankCode)" style="background:#4f46e5; padding:9px;">🔍 Verify Bank Payment on Server</button>\n                                <button type="button" class="checkout-btn" onclick="triggerExamPaymentTimeoutFailure(window.selectedExamBankCode + \' NetBanking transaction was cancelled.\')" style="background:#ef4444; padding:9px; width:auto;">✕ Cancel</button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- LIVE SERVER VERIFICATION STATUS RADAR -->\n                <div class="server-verify-box" id="serverVerifyStatusBox">\n                    <div style="font-size: 11.5px; font-weight: 900; color: #b45309;" id="serverVerifyHeadline">\n                        <span class="verify-spinner"></span> Verifying Payment with Server...\n                    </div>\n                    <div style="margin-top: 4px; font-size: 10.5px; color: var(--text-muted);" id="serverVerifySubText">\n                        Checking Canteen Server Ledger & Bank Gateway for Token #TK-000. Do not close this window — you will be <b>automatically redirected to your Digital Receipt</b> the exact moment the server confirms your payment!\n                    </div>\n                </div>\n\n                <!-- Live Counter Soundbox Sync & 12-Digit Bank UTR Verifier -->\n                <div class="live-verify-radar" style="margin-top: 10px;">\n                    <div style="font-size: 11.5px; font-weight: 900; color: var(--primary);" id="upiLiveSyncStatusHeadline">\n                        🛡️ Strict Server Verification Active (No Fake Receipts)\n                    </div>\n                    <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600; margin-top: 2px; line-height: 1.35;" id="upiLiveSyncStatusSub">\n                        <b>Unpaid clicks will NEVER generate a receipt.</b><br>\n                        Auto-redirects to your Digital Receipt <b>immediately</b> once the Canteen Server confirms your ₹<span class="btn-amt-span">0.00</span> payment, OR when you verify your 12-digit Bank UPI UTR below:\n                    </div>\n\n                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 6px; margin-top: 8px;">\n                        <input type="tel" class="form-control" id="upiUtrInput" maxlength="12" placeholder="Enter 12-Digit Bank UPI UTR # to Verify" oninput="handleStrictUtrVerificationInput(this.value)" style="text-align: center; font-family: monospace; font-size: 12px; font-weight: 900; letter-spacing: 1px;">\n                        <button type="button" onclick="pasteAndVerifyClipboardUtr()" style="background: var(--primary); color: #fff; border: none; border-radius: 10px; padding: 0 11px; font-size: 11px; font-weight: 900; cursor: pointer; white-space: nowrap;">\n                            📋 Paste UTR\n                        </button>\n                    </div>\n                    <div id="upiSecurityErrorMsg" style="display: none; margin-top: 7px; font-size: 11px; font-weight: 800; color: var(--danger); background: #fee2e2; padding: 6px 9px; border-radius: 8px; border: 1px solid #fecaca;"></div>\n                </div>\n\n                <button type="button" onclick="cancelLiveUpiPaymentModal()" style="width:100%; margin-top:9px; background:transparent; border:1px solid var(--danger); color:var(--danger); padding:8px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">\n                    ✕ Cancel & Stay on Menu\n                </button>\n            </div>\n\n            <!-- STATE 2: PAYMENT DONE SCREEN (SERVER VERIFIED WITHIN TIME LIMIT) -->\n            <div class="pg-status-screen" id="examPgSuccessScreen">\n                <div style="width:58px; height:58px; background:#dcfce7; color:#059669; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:900; margin:0 auto 10px; border:2px solid #10b981;">✓</div>\n                <span style="font-size:10px; font-weight:900; text-transform:uppercase; color:#059669; background:#dcfce7; padding:3px 10px; border-radius:20px;">Server Verified Payment</span>\n                <h3 style="font-size:21px; font-weight:900; color:#059669; margin-top:8px;">Payment Done! ⚡</h3>\n                <p style="font-size:12px; color:var(--text-muted); margin:4px 0 12px; font-weight:700;" id="examPgSuccessSubText">\n                    Redirecting to your Digital Receipt...\n                </p>\n                <div style="background:var(--surface-sub-bg); border:1.5px solid #10b981; border-radius:12px; padding:10px; margin-bottom:12px; font-family:monospace; font-size:12.5px; font-weight:900; color:var(--text-main);" id="examPgSuccessRefBox">\n                    Ref ID: --\n                </div>\n            </div>\n\n            <!-- STATE 3: PAYMENT FAILED / TIMED OUT SCREEN (STAYS ON SAME PAGE) -->\n            <div class="pg-status-screen" id="examPgFailedScreen">\n                <div style="width:58px; height:58px; background:#fee2e2; color:#dc2626; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; margin:0 auto 10px; border:2px solid #ef4444;">✕</div>\n                <span style="font-size:10px; font-weight:900; text-transform:uppercase; color:#dc2626; background:#fee2e2; padding:3px 10px; border-radius:20px;">Server Verification Failed / Expired</span>\n                <h3 style="font-size:21px; font-weight:900; color:var(--danger); margin-top:8px;">Payment Failed!</h3>\n                <p style="font-size:12px; color:var(--text-muted); margin:6px 0 16px; font-weight:600; line-height:1.45;" id="examPgFailedReason">\n                    Payment was not verified by the server within the 05:00 portal time limit. You are still on the checkout page and your tray items are saved.\n                </p>\n                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">\n                    <button type="button" class="checkout-btn" onclick="retryTimedPaymentSession()" style="background:var(--primary); padding:10px;">🔄 Retry Payment</button>\n                    <button type="button" class="checkout-btn" onclick="stayOnCheckoutDrawerAfterFailure()" style="background:#475569; padding:10px;">🛒 Stay on Checkout</button>\n                </div>\n            </div>\n\n        </div>\n    </div>';

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
           NEET / JEE STYLE TIMED MULTI-OPTION PAYMENT PORTAL (STRICT SERVER VERIFY)
           - NEVER marks an order as 'Online Paid' when clicking a button without real payment!
           - Clicking "Verify Payment on Server" (or returning from a UPI app) queries
             the Server (Firebase DB + MQTT + Counter Ledger).
           - ONLY when the Server confirms the payment is really paid (or Razorpay
             signature / genuine 12-digit Bank UTR is verified) does it stop the timer
             and auto-redirect to #tab-receipts!
           ===================================================================== */
        window.examPaymentTimerInterval = window.examPaymentTimerInterval || null;
        window.EXAM_TOTAL_SECONDS = 300; // 5 Minutes (300 seconds)
        window.examPaymentSecondsLeft = window.EXAM_TOTAL_SECONDS;
        window.selectedExamBankCode = "SBI";
        window.useFixedAmountQrMode = true;
        window.isExamPaymentCompleted = false;
        window.isServerVerificationActive = false;
        window.upiAppLaunchTimestamp = 0;

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

        function resetServerVerificationBoxUI() {
            window.isServerVerificationActive = false;
            const verifyBox = document.getElementById('serverVerifyStatusBox');
            if (verifyBox) verifyBox.classList.remove('active');
            const qrBtn = document.getElementById('qrServerVerifyBtn');
            const fmtAmt = Number(activeGatewayUpiParams.amount || 0).toFixed(2);
            if (qrBtn) {
                qrBtn.classList.remove('verifying');
                qrBtn.innerHTML = `🔍 I Have Paid ₹<span class="btn-amt-span">${fmtAmt}</span> — Verify Payment on Server`;
            }
        }

        function startExamTimedPaymentSession(durationSeconds = window.EXAM_TOTAL_SECONDS) {
            stopExamPaymentTimer();
            window.isExamPaymentCompleted = false;
            window.upiAppLaunchTimestamp = 0;
            window.examPaymentSecondsLeft = durationSeconds;
            window.useFixedAmountQrMode = true;
            resetServerVerificationBoxUI();

            const activeBody = document.getElementById('examPgActiveBody');
            const successScreen = document.getElementById('examPgSuccessScreen');
            const failedScreen = document.getElementById('examPgFailedScreen');
            if (activeBody) activeBody.style.display = 'block';
            if (successScreen) successScreen.classList.remove('active');
            if (failedScreen) failedScreen.classList.remove('active');

            const vpaWait = document.getElementById('vpaCollectWaitingBox');
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

                // Every 3 seconds while server verification is active, pull fresh state from Cloud DB if configured
                if (window.isServerVerificationActive && cloudConfig.dbUrl && (window.examPaymentSecondsLeft % 3 === 0)) {
                    try { await pullFromCloudDatabase(); } catch (e) {}
                }

                // Check if Server / Counter confirmed the payment!
                const confirmedNow = checkIfPendingOrderApprovedByCounter();
                if (confirmedNow || window.isExamPaymentCompleted) {
                    stopExamPaymentTimer();
                    return;
                }

                window.examPaymentSecondsLeft -= 1;
                updateExamTimerUI();

                if (window.examPaymentSecondsLeft <= 0) {
                    stopExamPaymentTimer();
                    if (!window.isExamPaymentCompleted) {
                        triggerExamPaymentTimeoutFailure("⏱️ Session Time Limit Expired (05:00). Server could not verify any completed payment within the allowed time window.");
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
           STRICT SERVER PAYMENT VERIFICATION ENGINE
           - Clicking "Verify Payment on Server" NEVER marks the order as paid!
           - It pings the Server (Cloud DB + MQTT + Counter Ledger) and checks
             if the payment is genuinely marked 'paid'.
           - If NOT paid yet, it stays on the portal and shows a live server check
             status until the Server / Counter confirms it (or a valid UTR is entered).
           ===================================================================== */
        async function requestServerPaymentVerification(methodTag = 'UPI-QR', isAutoReturn = false) {
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before server verification.");
                return;
            }

            clearUpiSecurityError();
            window.isServerVerificationActive = true;

            const activeToken = pendingUpiOrderToken || (window.currentPendingOrderDraft && window.currentPendingOrderDraft.token);
            const fmtAmt = Number(activeGatewayUpiParams.amount || 0).toFixed(2);

            // Flag the order on the Server / Counter Ledger so Counter Staff see the student requested verification
            if (activeToken) {
                const ordIdx = activeOrders.findIndex(o => o.token === activeToken);
                if (ordIdx !== -1) {
                    activeOrders[ordIdx].verifyRequested = true;
                    activeOrders[ordIdx].verifyMethod = methodTag;
                }
                if (window.currentPendingOrderDraft && window.currentPendingOrderDraft.token === activeToken) {
                    window.currentPendingOrderDraft.verifyRequested = true;
                    window.currentPendingOrderDraft.verifyMethod = methodTag;
                    localStorage.setItem('cb_pending_upi_draft', JSON.stringify(window.currentPendingOrderDraft));
                }
                saveState();
            }

            const verifyBox = document.getElementById('serverVerifyStatusBox');
            const verifyHeadline = document.getElementById('serverVerifyHeadline');
            const verifySub = document.getElementById('serverVerifySubText');
            const qrBtn = document.getElementById('qrServerVerifyBtn');

            if (verifyBox) verifyBox.classList.add('active');
            if (qrBtn) {
                qrBtn.classList.add('verifying');
                qrBtn.innerHTML = `<span class="verify-spinner" style="border-top-color:#fff;"></span> Checking Server for ₹${fmtAmt} Payment...`;
            }
            if (verifyHeadline) {
                verifyHeadline.innerHTML = `<span class="verify-spinner"></span> Contacting Server to Verify Token #${activeToken || 'Order'}...`;
            }
            if (verifySub) {
                verifySub.innerHTML = `Querying Canteen Server Ledger & Bank Gateway for <b>₹${fmtAmt}</b> (${methodTag})...`;
            }

            // Pull latest state from Firebase Cloud DB if configured
            if (cloudConfig.dbUrl) {
                try { await pullFromCloudDatabase(); } catch (e) {}
            }

            // Check if the Server / Counter has already confirmed the payment
            const isConfirmed = checkIfPendingOrderApprovedByCounter();
            if (isConfirmed || window.isExamPaymentCompleted) {
                return; // Automatically redirected to receipt!
            }

            // Not confirmed on server yet -> Stay on page & keep live listener active!
            setTimeout(() => {
                if (window.isExamPaymentCompleted) return;
                const recheck = checkIfPendingOrderApprovedByCounter();
                if (recheck) return;

                if (verifyHeadline) {
                    verifyHeadline.innerHTML = `<span class="verify-spinner"></span> ⏳ Server Check: Payment Not Yet Confirmed on Server`;
                }
                if (verifySub) {
                    verifySub.innerHTML = isAutoReturn
                        ? `You returned from the payment app, but <b>₹${fmtAmt}</b> is <b>not yet confirmed on the server</b>.<br>• If you paid, wait a moment for the <b>Canteen Counter Server</b> to confirm (or paste your 12-digit Bank UTR below) — it will <b>auto-redirect to your Receipt immediately</b> once verified!<br>• If you have not paid yet, please complete the payment before the timer ends.`
                        : `Server checked Token <b>#${activeToken}</b>: <b>₹${fmtAmt} has NOT been confirmed yet.</b><br>• Clicking this button without paying will <b>never</b> generate a receipt.<br>• Listening live to the Server: the <b>exact second</b> the Canteen Server confirms your payment (or you enter a valid 12-digit Bank UTR below), you will be <b>automatically redirected to your Receipt!</b>`;
                }
                if (qrBtn) {
                    qrBtn.innerHTML = `🔄 Re-Check Server Payment Status (Listening Live...)`;
                }
            }, 700);
        }

        /* When payment fails or times out, NEVER redirect to receipt; stay on the same page! */
        function triggerExamPaymentTimeoutFailure(reasonText) {
            if (window.isExamPaymentCompleted) return;
            stopExamPaymentTimer();
            resetServerVerificationBoxUI();
            const tokToRemove = pendingUpiOrderToken || (window.currentPendingOrderDraft && window.currentPendingOrderDraft.token);
            if (tokToRemove) {
                activeOrders = activeOrders.filter(o => !(o.token === tokToRemove && o.status === 'upi_verifying'));
                pendingUpiOrderToken = null;
                window.currentPendingOrderDraft = null;
                localStorage.removeItem('cb_pending_upi_draft');
                saveState();
            }
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

        function triggerExamUpiCollectRequest() {
            clearUpiSecurityError();
            const vpaInput = document.getElementById('studentVpaInput');
            const vpa = vpaInput ? vpaInput.value.trim() : '';
            if (!vpa || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
                showUpiSecurityError("❌ Please enter a valid UPI ID (e.g. yourname@okaxis or 9876543210@ybl).");
                return;
            }
            const waitBox = document.getElementById('vpaCollectWaitingBox');
            const statusTxt = document.getElementById('vpaCollectStatusText');
            const fmtAmt = Number(activeGatewayUpiParams.amount || 0).toFixed(2);
            if (statusTxt) {
                statusTxt.innerHTML = `📲 Collect request of <b>₹${fmtAmt}</b> initiated for <code>${vpa}</code>! Complete the payment on your UPI app, then click below to verify with the server:`;
            }
            if (waitBox) waitBox.style.display = 'block';

            // Notify server that student initiated VPA collect
            requestServerPaymentVerification('UPI-VPA:' + vpa, true);
        }

        function initiateExamCardOtpStep() {
            clearUpiSecurityError();
            const num = (document.getElementById('pgCardNumber')?.value || '').replace(/\D/g, '');
            const exp = (document.getElementById('pgCardExpiry')?.value || '').trim();
            const cvv = (document.getElementById('pgCardCvv')?.value || '').trim();
            if (num.length < 12 || !exp || cvv.length < 3) {
                showUpiSecurityError("❌ Please enter a valid Card Number (12-16 digits), Expiry (MM/YY), and 3-digit CVV.");
                return;
            }
            document.getElementById('cardFormFieldsBox').style.display = 'none';
            document.getElementById('cardOtpStepBox').style.display = 'block';
            const otpInput = document.getElementById('pgCardOtpInput');
            if (otpInput) { otpInput.value = ''; otpInput.focus(); }
        }

        function cancelExamCardOtpStep() {
            document.getElementById('cardOtpStepBox').style.display = 'none';
            document.getElementById('cardFormFieldsBox').style.display = 'block';
        }

        function verifyExamCardOtpAndPay() {
            clearUpiSecurityError();
            const otp = (document.getElementById('pgCardOtpInput')?.value || '').trim();
            if (!/^\d{4,6}$/.test(otp)) {
                showUpiSecurityError("❌ Invalid OTP! Please enter the 6-digit Bank OTP.");
                return;
            }
            const num = (document.getElementById('pgCardNumber')?.value || '0000').replace(/\D/g, '');
            // Submit to server verification instead of blindly marking paid without server confirmation!
            requestServerPaymentVerification('CARD-' + num.slice(-4), false);
        }

        function selectExamBank(btnEl, bankCode) {
            window.selectedExamBankCode = bankCode;
            document.querySelectorAll('.bank-option-btn').forEach(b => b.classList.remove('selected'));
            if (btnEl) btnEl.classList.add('selected');
        }

        function initiateExamNetBankingStep() {
            clearUpiSecurityError();
            document.getElementById('netbankingSelectBox').style.display = 'none';
            document.getElementById('netbankingConfirmBox').style.display = 'block';
            const titleEl = document.getElementById('netbankingBankTitle');
            const merchEl = document.getElementById('netbankingMerchantSpan');
            if (titleEl) titleEl.innerText = `🏦 ${window.selectedExamBankCode} NetBanking Portal`;
            if (merchEl) merchEl.innerText = activeGatewayUpiParams.merchant || 'CANTEEN OFFICIAL';
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

        /* When returning from GPay / PhonePe / Paytm, NEVER mark paid without paying!
           Instead, automatically trigger a Server Verification check! */
        function handleReturnFromExternalUpiApp() {
            const modalEl = document.getElementById('upiLivePaymentModal');
            if (!modalEl || !modalEl.classList.contains('active')) return;
            if (window.isExamPaymentCompleted || window.examPaymentSecondsLeft <= 0) return;

            if (window.upiAppLaunchTimestamp > 0) {
                const elapsedMs = Date.now() - window.upiAppLaunchTimestamp;
                if (elapsedMs >= 1500) {
                    window.upiAppLaunchTimestamp = 0;
                    requestServerPaymentVerification('UPI-APP', true);
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

            const headline = document.getElementById('upiLiveSyncStatusHeadline');
            const sub = document.getElementById('upiLiveSyncStatusSub');
            if (headline) headline.innerHTML = `⏳ UPI App Opened — Will Verify with Server on Return`;
            if (sub) sub.innerHTML = `Copied <b>${copyTarget}</b>! Complete your <b>₹${Number(amount).toFixed(2)}</b> payment to <b>${merchant}</b> in ${appName.toUpperCase()}. When you return, the portal will <b>verify your payment with the Server</b> before opening your receipt.`;

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

        /* Shares Fixed-Amount QR Code directly to GPay / PhonePe */
        async function beamStaticQrToUpiApp() {
            clearUpiSecurityError();
            window.upiAppLaunchTimestamp = Date.now();
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

        function isValidNpciUtrNumber(utrStr) {
            if (!/^\d{12}$/.test(utrStr)) return false;
            if (/^(\d)\1{11}$/.test(utrStr)) return false;
            const blockedFakePatterns = [
                '123456789012', '123456789123', '987654321098', '012345678901',
                '101010101010', '121212121212', '123123123123', '000000000001'
            ];
            if (blockedFakePatterns.includes(utrStr)) return false;
            const uniqueDigits = new Set(utrStr.split('')).size;
            if (uniqueDigits < 4) return false;
            return true;
        }

        function handleStrictUtrVerificationInput(rawVal) {
            clearUpiSecurityError();
            const cleanDigits = String(rawVal || '').replace(/\D/g, '');
            const utrInputEl = document.getElementById('upiUtrInput');
            if (utrInputEl && utrInputEl.value !== cleanDigits) {
                utrInputEl.value = cleanDigits;
            }

            if (cleanDigits.length === 12) {
                if (window.examPaymentSecondsLeft <= 0 && !window.isExamPaymentCompleted) {
                    triggerExamPaymentTimeoutFailure("⏱️ Session expired before UTR verification.");
                    return;
                }
                if (!isValidNpciUtrNumber(cleanDigits)) {
                    showUpiSecurityError("❌ Invalid / Fake UTR! Please paste the genuine 12-digit UPI Reference / UTR Number from your GPay or PhonePe receipt.");
                    return;
                }

                const duplicateUtr = activeOrders.some(o => o.utr === ('UTR-' + cleanDigits) || o.utr === cleanDigits) || usedPaymentProofHashes.includes('UTR_' + cleanDigits);
                if (duplicateUtr) {
                    showUpiSecurityError("❌ Security Alert: This 12-digit UPI UTR has already been used! Duplicate UTRs are blocked.");
                    return;
                }

                usedPaymentProofHashes.push('UTR_' + cleanDigits);
                localStorage.setItem('cb_used_proof_hashes', JSON.stringify(usedPaymentProofHashes));
                finalizeAndCommitVerifiedOnlineOrder('UTR-' + cleanDigits);
            }
        }

        async function pasteAndVerifyClipboardUtr() {
            clearUpiSecurityError();
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                showUpiSecurityError("Please long-press inside the box and tap Paste to enter your 12-digit UPI UTR.");
                return;
            }
            try {
                const text = await navigator.clipboard.readText();
                const match12 = String(text || '').match(/\b\d{12}\b/);
                if (match12 && match12[0]) {
                    document.getElementById('upiUtrInput').value = match12[0];
                    handleStrictUtrVerificationInput(match12[0]);
                } else {
                    showUpiSecurityError("❌ No 12-digit UPI UTR found in clipboard! Copy the 12-digit UPI transaction ID from GPay/PhonePe after paying.");
                }
            } catch (e) {
                showUpiSecurityError("Please long-press inside the input box and paste your 12-digit UPI UTR.");
            }
        }

        /* =====================================================================
           IMMEDIATE AUTO-REDIRECT TO RECEIPT SECTION ONCE SERVER CONFIRMS PAID
           Stops timer immediately, commits order as 'paid', closes modal,
           and switches straight to My Digital Receipts (#tab-receipts)!
           ===================================================================== */
        function finalizeAndCommitVerifiedOnlineOrder(utrOrRef) {
            stopExamPaymentTimer();
            if (window.isExamPaymentCompleted) return;
            window.isExamPaymentCompleted = true;
            window.isServerVerificationActive = false;
            window.upiAppLaunchTimestamp = 0;

            let savedDraft = window.currentPendingOrderDraft;
            if (!savedDraft) {
                try { savedDraft = JSON.parse(localStorage.getItem('cb_pending_upi_draft') || 'null'); } catch (e) {}
            }
            const targetToken = pendingUpiOrderToken || (savedDraft && savedDraft.token);

            let idx = -1;
            if (targetToken) {
                idx = activeOrders.findIndex(o => o.token === targetToken);
            }
            if (idx === -1) {
                idx = activeOrders.findIndex(o => o.status === 'upi_verifying');
            }
            if (idx === -1 && savedDraft) {
                activeOrders.unshift({ ...savedDraft });
                idx = 0;
            }
            if (idx === -1) return;

            activeOrders[idx].status = 'paid';
            activeOrders[idx].utr = utrOrRef || 'SERVER-VERIFIED';
            activeOrders[idx].verifyRequested = false;
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
                document.getElementById('successToastHeading').innerText = "Server Verified — Payment Done! ⚡";
                document.getElementById('toastTokenDisplay').innerText = `#${completedOrder.token} • PIN: ${completedOrder.handshakePin}`;
                toastModal.classList.add('active');
                setTimeout(() => {
                    toastModal.classList.remove('active');
                }, 900);
            }
        }

        function cancelLiveUpiPaymentModal() {
            stopExamPaymentTimer();
            resetServerVerificationBoxUI();
            window.upiAppLaunchTimestamp = 0;
            const tokToCancel = pendingUpiOrderToken || (window.currentPendingOrderDraft && window.currentPendingOrderDraft.token);
            if (tokToCancel && !window.isExamPaymentCompleted) {
                activeOrders = activeOrders.filter(o => !(o.token === tokToCancel && o.status === 'upi_verifying'));
                pendingUpiOrderToken = null;
                window.currentPendingOrderDraft = null;
                localStorage.removeItem('cb_pending_upi_draft');
                saveState();
            }
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
                ? "Server Verified — Payment Done! ⚡"
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
                status: isOnline ? 'upi_verifying' : 'cash_pending',
                verifyRequested: false,
                verifyMethod: "",
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

            // Persist unverified draft ('upi_verifying') to Server / Counter Ledger
            window.isExamPaymentCompleted = false;
            pendingUpiOrderToken = tokenNum;
            window.currentPendingOrderDraft = { ...orderDraft };
            localStorage.setItem('cb_pending_upi_draft', JSON.stringify(orderDraft));
            activeOrders.unshift(orderDraft);
            saveState();

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
                                    triggerExamPaymentTimeoutFailure("Razorpay checkout was closed or timed out before server payment verification.");
                                }
                            }
                        }
                    });
                    rzp.on('payment.failed', function(resp) {
                        if (!window.isExamPaymentCompleted) {
                            pushOverlayHistoryState('upi-gateway-modal');
                            document.getElementById('upiLivePaymentModal').classList.add('active');
                            triggerExamPaymentTimeoutFailure((resp && resp.error && resp.error.description) ? resp.error.description : "Payment failed at bank gateway.");
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
