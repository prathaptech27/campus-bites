/**
 * CampusBites - PhonePe-Style 100% In-App Multi-Method Payment Portal (v7)
 * Includes ALL Payment Methods inside a single PhonePe Checkout Sheet:
 *  1. UPI Linked Bank Accounts (SBI, HDFC, Indian Bank + Live Balance Check) -> Official NPCI 4-Digit UPI PIN Screen
 *  2. PhonePe Wallet / UPI Lite (1-Tap Zero-PIN Instant Pay + Instant ₹200 Top-Up)
 *  3. In-App Dynamic Fixed-Amount UPI QR Code
 *  4. Other UPI ID / VPA (@ybl, @ibl, @axl, @okaxis + VPA Verification)
 *  5. Debit / Credit Cards (RuPay, Visa, Mastercard + Inline 3D-Secure Bank SMS OTP)
 *  6. Net Banking (SBI, HDFC, ICICI, Indian Bank, Canara, Axis)
 */
(function () {
    const PORTAL_CSS = '\n        /* =====================================================================\n           PHONEPE-STYLE IN-APP MULTI-METHOD PAYMENT PORTAL & NPCI UPI PIN PAD\n           ===================================================================== */\n        .pp-modal-card {\n            background: #f8fafc;\n            color: #0f172a;\n            width: 100%;\n            max-width: 450px;\n            max-height: 94vh;\n            border-radius: 26px;\n            overflow: hidden;\n            display: flex;\n            flex-direction: column;\n            box-shadow: 0 24px 54px rgba(0, 0, 0, 0.55);\n            border: 1.5px solid rgba(255, 255, 255, 0.35);\n            margin: auto;\n            text-align: left;\n        }\n        [data-theme="dark"] .pp-modal-card {\n            background: #0f172a;\n            color: #f8fafc;\n        }\n        .pp-top-bar {\n            background: linear-gradient(135deg, #5f259f 0%, #431677 100%);\n            color: #ffffff;\n            padding: 14px 16px 12px;\n            position: relative;\n        }\n        .pp-top-row1 {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            margin-bottom: 10px;\n        }\n        .pp-brand-badge {\n            display: inline-flex;\n            align-items: center;\n            gap: 7px;\n            font-size: 13px;\n            font-weight: 900;\n            letter-spacing: -0.2px;\n        }\n        .pp-logo-circle {\n            width: 26px;\n            height: 26px;\n            border-radius: 50%;\n            background: #ffffff;\n            color: #5f259f;\n            font-weight: 900;\n            font-size: 15px;\n            display: inline-flex;\n            align-items: center;\n            justify-content: center;\n            box-shadow: 0 2px 6px rgba(0,0,0,0.25);\n        }\n        .pp-timer-chip {\n            background: rgba(255, 255, 255, 0.16);\n            border: 1px solid rgba(255, 255, 255, 0.35);\n            color: #ffffff;\n            padding: 4px 10px;\n            border-radius: 20px;\n            font-family: monospace;\n            font-size: 13px;\n            font-weight: 900;\n            display: inline-flex;\n            align-items: center;\n            gap: 5px;\n        }\n        .pp-timer-chip.danger-zone {\n            background: #ef4444;\n            border-color: #fca5a5;\n            animation: ppPulse 1s infinite;\n        }\n        @keyframes ppPulse {\n            0%, 100% { transform: scale(1); }\n            50% { transform: scale(1.05); }\n        }\n        .pp-merchant-box {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            background: rgba(255, 255, 255, 0.12);\n            border: 1px solid rgba(255, 255, 255, 0.22);\n            border-radius: 14px;\n            padding: 10px 12px;\n            gap: 10px;\n        }\n        .pp-merch-left {\n            display: flex;\n            align-items: center;\n            gap: 10px;\n            min-width: 0;\n        }\n        .pp-merch-avatar {\n            width: 38px;\n            height: 38px;\n            border-radius: 12px;\n            background: #ffffff;\n            color: #5f259f;\n            font-weight: 900;\n            font-size: 18px;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            flex-shrink: 0;\n        }\n        .pp-amount-pill {\n            background: #ffffff;\n            color: #5f259f;\n            padding: 6px 12px;\n            border-radius: 11px;\n            text-align: right;\n            flex-shrink: 0;\n            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);\n        }\n        .pp-progress-track {\n            width: 100%;\n            height: 4px;\n            background: rgba(255, 255, 255, 0.2);\n        }\n        .pp-progress-fill {\n            height: 100%;\n            width: 100%;\n            background: #00d09c;\n            transition: width 1s linear;\n        }\n        .pp-scroll-body {\n            padding: 12px 14px;\n            overflow-y: auto;\n            flex: 1;\n        }\n        .pp-section-label {\n            font-size: 10.5px;\n            font-weight: 900;\n            text-transform: uppercase;\n            letter-spacing: 0.6px;\n            color: var(--text-muted);\n            margin: 6px 0 6px 2px;\n        }\n        .pp-method-card {\n            background: #ffffff;\n            border: 1.5px solid #e2e8f0;\n            border-radius: 14px;\n            padding: 11px 12px;\n            margin-bottom: 8px;\n            cursor: pointer;\n            transition: 0.15s ease;\n        }\n        [data-theme="dark"] .pp-method-card {\n            background: #1e293b;\n            border-color: rgba(255, 255, 255, 0.12);\n        }\n        .pp-method-card.selected {\n            border-color: #5f259f;\n            background: rgba(95, 37, 159, 0.05);\n            box-shadow: 0 4px 14px rgba(95, 37, 159, 0.12);\n        }\n        [data-theme="dark"] .pp-method-card.selected {\n            border-color: #a855f7;\n            background: rgba(168, 85, 247, 0.14);\n        }\n        .pp-method-head {\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n            gap: 10px;\n        }\n        .pp-method-left {\n            display: flex;\n            align-items: center;\n            gap: 10px;\n        }\n        .pp-radio-circle {\n            width: 19px;\n            height: 19px;\n            border-radius: 50%;\n            border: 2px solid #94a3b8;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            flex-shrink: 0;\n        }\n        .pp-method-card.selected .pp-radio-circle {\n            border-color: #5f259f;\n        }\n        [data-theme="dark"] .pp-method-card.selected .pp-radio-circle {\n            border-color: #a855f7;\n        }\n        .pp-radio-dot {\n            width: 10px;\n            height: 10px;\n            border-radius: 50%;\n            background: transparent;\n        }\n        .pp-method-card.selected .pp-radio-dot {\n            background: #5f259f;\n        }\n        [data-theme="dark"] .pp-method-card.selected .pp-radio-dot {\n            background: #a855f7;\n        }\n        .pp-method-icon {\n            width: 34px;\n            height: 34px;\n            border-radius: 9px;\n            background: #f1f5f9;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 17px;\n            flex-shrink: 0;\n        }\n        [data-theme="dark"] .pp-method-icon {\n            background: #0f172a;\n        }\n        .pp-method-title {\n            font-size: 13px;\n            font-weight: 800;\n            color: var(--text-main);\n        }\n        .pp-method-sub {\n            font-size: 11px;\n            color: var(--text-muted);\n            font-weight: 600;\n        }\n        .pp-method-Drawer {\n            display: none;\n            margin-top: 10px;\n            padding-top: 10px;\n            border-top: 1px dashed rgba(148, 163, 184, 0.35);\n        }\n        .pp-method-card.selected .pp-method-Drawer {\n            display: block;\n        }\n        .pp-bank-subrow {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            padding: 8px 10px;\n            border-radius: 10px;\n            background: var(--surface-sub-bg);\n            border: 1.5px solid transparent;\n            margin-bottom: 6px;\n            cursor: pointer;\n        }\n        .pp-bank-subrow.active-bank {\n            border-color: #5f259f;\n            background: rgba(95, 37, 159, 0.08);\n        }\n        [data-theme="dark"] .pp-bank-subrow.active-bank {\n            border-color: #a855f7;\n            background: rgba(168, 85, 247, 0.18);\n        }\n        .pp-bottom-bar {\n            padding: 11px 14px;\n            background: #ffffff;\n            border-top: 1px solid #e2e8f0;\n            display: flex;\n            flex-direction: column;\n            gap: 6px;\n        }\n        [data-theme="dark"] .pp-bottom-bar {\n            background: #1e293b;\n            border-top-color: rgba(255, 255, 255, 0.12);\n        }\n        .pp-pay-main-btn {\n            width: 100%;\n            background: linear-gradient(135deg, #5f259f 0%, #431677 100%);\n            color: #ffffff;\n            border: none;\n            padding: 13px;\n            border-radius: 14px;\n            font-size: 14.5px;\n            font-weight: 900;\n            cursor: pointer;\n            box-shadow: 0 8px 20px rgba(95, 37, 159, 0.35);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 8px;\n        }\n        .pp-pay-main-btn:active {\n            transform: scale(0.99);\n        }\n\n        /* OFFICIAL NPCI FULL-SCREEN UPI PIN PAD OVERLAY */\n        .npci-official-pin-overlay {\n            display: none;\n            background: #ffffff;\n            color: #0f172a;\n            flex-direction: column;\n            justify-content: space-between;\n            min-height: 450px;\n        }\n        .npci-official-pin-overlay.active {\n            display: flex;\n        }\n        .npci-top-header {\n            background: #f8fafc;\n            border-bottom: 1px solid #cbd5e1;\n            padding: 12px 16px;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n        }\n        .npci-payee-strip {\n            background: #1e3a8a;\n            color: #ffffff;\n            padding: 10px 16px;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            font-size: 12.5px;\n            font-weight: 800;\n        }\n        .npci-pin-center {\n            padding: 22px 16px 14px;\n            text-align: center;\n            flex: 1;\n        }\n        .npci-pin-boxes {\n            display: flex;\n            justify-content: center;\n            gap: 12px;\n            margin: 16px 0 10px;\n        }\n        .npci-pin-slot {\n            width: 44px;\n            height: 46px;\n            border-bottom: 3px solid #64748b;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 26px;\n            font-weight: 900;\n            color: #1e3a8a;\n        }\n        .npci-pin-slot.filled {\n            border-bottom-color: #1e3a8a;\n        }\n        .npci-numpad {\n            background: #f1f5f9;\n            border-top: 1px solid #cbd5e1;\n            display: grid;\n            grid-template-columns: repeat(3, 1fr);\n        }\n        .npci-num-key {\n            background: transparent;\n            border: 0.5px solid #e2e8f0;\n            padding: 14px 0;\n            font-size: 20px;\n            font-weight: 700;\n            color: #0f172a;\n            cursor: pointer;\n            user-select: none;\n        }\n        .npci-num-key:active {\n            background: #cbd5e1;\n        }\n        .npci-num-key.submit-key {\n            background: #1e3a8a;\n            color: #ffffff;\n            font-size: 16px;\n            font-weight: 900;\n        }\n\n        /* PHONEPE PROCESSING, SUCCESS & FAILED FULL SCREENS */\n        .pp-state-screen {\n            display: none;\n            padding: 32px 20px;\n            text-align: center;\n            flex-direction: column;\n            align-items: center;\n            justify-content: center;\n            min-height: 380px;\n        }\n        .pp-state-screen.active {\n            display: flex;\n        }\n        .pp-success-circle {\n            width: 72px;\n            height: 72px;\n            border-radius: 50%;\n            background: #00b970;\n            color: #ffffff;\n            font-size: 38px;\n            font-weight: 900;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            margin-bottom: 14px;\n            box-shadow: 0 10px 25px rgba(0, 185, 112, 0.35);\n        }\n        .pp-failed-circle {\n            width: 72px;\n            height: 72px;\n            border-radius: 50%;\n            background: #ef4444;\n            color: #ffffff;\n            font-size: 36px;\n            font-weight: 900;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            margin-bottom: 14px;\n            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.35);\n        }\n        .pp-big-spinner {\n            width: 56px;\n            height: 56px;\n            border: 5px solid rgba(95, 37, 159, 0.2);\n            border-top-color: #5f259f;\n            border-radius: 50%;\n            animation: ppSpin 0.75s linear infinite;\n            margin-bottom: 16px;\n        }\n        @keyframes ppSpin {\n            0% { transform: rotate(0deg); }\n            100% { transform: rotate(360deg); }\n        }\n';
    const PORTAL_HTML = '    <!-- PHONEPE-STYLE 100% IN-APP MULTI-METHOD PAYMENT PORTAL -->\n    <div class="toast-modal" id="upiLivePaymentModal">\n        <div class="pp-modal-card">\n            \n            <!-- PhonePe Purple Header with Live Timer & Merchant Info -->\n            <div class="pp-top-bar">\n                <div class="pp-top-row1">\n                    <div class="pp-brand-badge">\n                        <span class="pp-logo-circle">पे</span>\n                        <span>PhonePe • CampusBites In-App Pay</span>\n                    </div>\n                    <div style="display: flex; align-items: center; gap: 6px;">\n                        <div class="pp-timer-chip" id="examTimerPill" title="Complete payment within time limit">\n                            ⏱️ <span id="examCountdownText">05:00</span>\n                        </div>\n                        <button type="button" onclick="cancelLiveUpiPaymentModal()" style="background:rgba(255,255,255,0.18); color:#fff; border:none; width:26px; height:26px; border-radius:50%; font-weight:900; cursor:pointer;">×</button>\n                    </div>\n                </div>\n\n                <div class="pp-merchant-box">\n                    <div class="pp-merch-left">\n                        <div class="pp-merch-avatar">🍴</div>\n                        <div style="min-width: 0;">\n                            <div style="font-size: 13.5px; font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\n                                <span id="upiGateBankingName">CANTEEN OFFICIAL</span> <span style="color:#4ade80;">✔</span>\n                            </div>\n                            <div style="font-size: 11px; color: #e9d5ff; font-family: monospace;" id="upiGateVpaText">canteen@sbi</div>\n                            <div style="font-size: 10px; color: #cbd5e1; font-weight: 700;" id="upiGateTokenHeading">Token #TK-100</div>\n                            <div id="upiGatePhoneRow" style="display:none;"><span id="upiGatePhoneText"></span></div>\n                        </div>\n                    </div>\n                    <div class="pp-amount-pill">\n                        <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; display: block; color: #64748b;">Payable Now</span>\n                        <strong style="font-size: 17px; font-weight: 900;" id="upiGateLockedAmountBadge">₹0.00</strong>\n                    </div>\n                </div>\n            </div>\n\n            <div class="pp-progress-track">\n                <div class="pp-progress-fill" id="examTimerBarFill"></div>\n            </div>\n\n            <!-- =============================================================\n                 VIEW 1: PHONEPE ALL-IN-ONE PAYMENT METHODS SHEET\n                 ============================================================= -->\n            <div id="examPgActiveBody" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">\n                <div class="pp-scroll-body">\n\n                    <div class="pp-section-label">⚡ Recommended In-App UPI &amp; Wallet</div>\n\n                    <!-- METHOD 1: PHONEPE UPI LINKED BANK ACCOUNTS -->\n                    <div class="pp-method-card selected" id="ppCard_upi_bank" onclick="selectPhonePeMethod(\'upi_bank\')">\n                        <div class="pp-method-head">\n                            <div class="pp-method-left">\n                                <div class="pp-radio-circle"><div class="pp-radio-dot"></div></div>\n                                <div class="pp-method-icon">🏦</div>\n                                <div>\n                                    <div class="pp-method-title">UPI Linked Bank Accounts</div>\n                                    <div class="pp-method-sub">Pay directly using 4-Digit In-App UPI PIN</div>\n                                </div>\n                            </div>\n                            <span style="font-size:10px; font-weight:900; background:#dcfce7; color:#166534; padding:3px 8px; border-radius:12px;">INSTANT</span>\n                        </div>\n\n                        <div class="pp-method-Drawer" onclick="event.stopPropagation();">\n                            <div class="pp-bank-subrow active-bank" id="ppBankRow_SBI" onclick="selectLinkedUpiBank(\'SBI\', \'State Bank of India ••4821\')">\n                                <div>\n                                    <div style="font-size:12px; font-weight:800; color:var(--text-main);">🏦 State Bank of India - ••4821</div>\n                                    <div style="font-size:10.5px; color:var(--text-muted);" id="ppBalText_SBI">UPI Linked • Primary Account</div>\n                                </div>\n                                <button type="button" onclick="event.stopPropagation(); checkSimulatedBankBalance(\'SBI\', \'₹4,850.00\')" style="background:none; border:1px solid #5f259f; color:#5f259f; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:800; cursor:pointer;">Check Bal</button>\n                            </div>\n\n                            <div class="pp-bank-subrow" id="ppBankRow_HDFC" onclick="selectLinkedUpiBank(\'HDFC\', \'HDFC Bank ••9012\')">\n                                <div>\n                                    <div style="font-size:12px; font-weight:800; color:var(--text-main);">🏦 HDFC Bank - ••9012</div>\n                                    <div style="font-size:10.5px; color:var(--text-muted);" id="ppBalText_HDFC">UPI Linked • Savings Account</div>\n                                </div>\n                                <button type="button" onclick="event.stopPropagation(); checkSimulatedBankBalance(\'HDFC\', \'₹8,240.00\')" style="background:none; border:1px solid #5f259f; color:#5f259f; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:800; cursor:pointer;">Check Bal</button>\n                            </div>\n\n                            <div class="pp-bank-subrow" id="ppBankRow_INDIAN" onclick="selectLinkedUpiBank(\'INDIAN\', \'Indian Bank ••3319\')">\n                                <div>\n                                    <div style="font-size:12px; font-weight:800; color:var(--text-main);">🏦 Indian Bank - ••3319</div>\n                                    <div style="font-size:10.5px; color:var(--text-muted);" id="ppBalText_INDIAN">UPI Linked • Campus Account</div>\n                                </div>\n                                <button type="button" onclick="event.stopPropagation(); checkSimulatedBankBalance(\'INDIAN\', \'₹2,190.00\')" style="background:none; border:1px solid #5f259f; color:#5f259f; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:800; cursor:pointer;">Check Bal</button>\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- METHOD 2: PHONEPE WALLET / UPI LITE (1-TAP ZERO-PIN INSTANT PAY) -->\n                    <div class="pp-method-card" id="ppCard_wallet" onclick="selectPhonePeMethod(\'wallet\')">\n                        <div class="pp-method-head">\n                            <div class="pp-method-left">\n                                <div class="pp-radio-circle"><div class="pp-radio-dot"></div></div>\n                                <div class="pp-method-icon">👛</div>\n                                <div>\n                                    <div class="pp-method-title">PhonePe Wallet / UPI Lite</div>\n                                    <div class="pp-method-sub">Available Balance: <strong style="color:#059669;" id="ppWalletBalText">₹500.00</strong> (No PIN Needed)</div>\n                                </div>\n                            </div>\n                            <button type="button" onclick="event.stopPropagation(); topUpPhonePeWallet(200)" style="background:rgba(95,37,159,0.12); color:#5f259f; border:1px solid #5f259f; padding:4px 8px; border-radius:8px; font-size:10px; font-weight:900; cursor:pointer;">+ Add ₹200</button>\n                        </div>\n                        <div class="pp-method-Drawer" onclick="event.stopPropagation();">\n                            <div style="font-size:11px; color:#059669; font-weight:700;">\n                                ⚡ 1-Tap Instant Checkout: Tapping <b>Pay</b> below immediately deducts ₹<span class="btn-amt-span">0.00</span> from your wallet without needing a PIN!\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class="pp-section-label">💳 Other In-App Payment Options</div>\n\n                    <!-- METHOD 3: IN-APP DYNAMIC QR SCANNER -->\n                    <div class="pp-method-card" id="ppCard_qr" onclick="selectPhonePeMethod(\'qr\')">\n                        <div class="pp-method-head">\n                            <div class="pp-method-left">\n                                <div class="pp-radio-circle"><div class="pp-radio-dot"></div></div>\n                                <div class="pp-method-icon">📷</div>\n                                <div>\n                                    <div class="pp-method-title">In-App Dynamic UPI QR</div>\n                                    <div class="pp-method-sub">Fixed ₹<span class="btn-amt-span">0.00</span> embedded QR code</div>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="pp-method-Drawer" onclick="event.stopPropagation();" style="text-align:center;">\n                            <div class="qr-checkout-frame" style="width: 132px; height: 132px; margin: 4px auto;">\n                                <img id="upiGateQrImg" src="" alt="Fixed Amount UPI QR" />\n                            </div>\n                            <div style="font-size:10.5px; color:var(--text-muted); font-weight:700;">Tap <b>Pay ₹<span class="btn-amt-span">0.00</span></b> below to authorize this QR in-app</div>\n                        </div>\n                    </div>\n\n                    <!-- METHOD 4: OTHER UPI ID / VPA -->\n                    <div class="pp-method-card" id="ppCard_vpa" onclick="selectPhonePeMethod(\'vpa\')">\n                        <div class="pp-method-head">\n                            <div class="pp-method-left">\n                                <div class="pp-radio-circle"><div class="pp-radio-dot"></div></div>\n                                <div class="pp-method-icon">🆔</div>\n                                <div>\n                                    <div class="pp-method-title">Other UPI ID / VPA</div>\n                                    <div class="pp-method-sub">Pay using @ybl, @ibl, @axl, @okaxis</div>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="pp-method-Drawer" onclick="event.stopPropagation();">\n                            <div style="display:flex; gap:6px; margin-bottom:6px;">\n                                <input type="text" class="form-control" id="studentVpaInput" placeholder="yourname@ybl" style="font-size:12px;">\n                                <button type="button" onclick="verifyInAppStudentVpa()" style="background:#5f259f; color:#fff; border:none; border-radius:10px; padding:0 12px; font-size:11px; font-weight:800; cursor:pointer; white-space:nowrap;">Verify</button>\n                            </div>\n                            <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:4px;">\n                                <span onclick="appendVpaHandle(\'@ybl\')" style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); padding:2px 8px; border-radius:12px; font-size:10px; font-weight:800; cursor:pointer;">@ybl</span>\n                                <span onclick="appendVpaHandle(\'@ibl\')" style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); padding:2px 8px; border-radius:12px; font-size:10px; font-weight:800; cursor:pointer;">@ibl</span>\n                                <span onclick="appendVpaHandle(\'@axl\')" style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); padding:2px 8px; border-radius:12px; font-size:10px; font-weight:800; cursor:pointer;">@axl</span>\n                                <span onclick="appendVpaHandle(\'@okaxis\')" style="background:var(--surface-sub-bg); border:1px solid var(--liquid-glass-border); padding:2px 8px; border-radius:12px; font-size:10px; font-weight:800; cursor:pointer;">@okaxis</span>\n                            </div>\n                            <div id="vpaVerifiedBadgeText" style="display:none; font-size:11px; color:#059669; font-weight:800; margin-top:4px;">✔ Verified UPI Account</div>\n                        </div>\n                    </div>\n\n                    <!-- METHOD 5: DEBIT / CREDIT CARDS -->\n                    <div class="pp-method-card" id="ppCard_card" onclick="selectPhonePeMethod(\'card\')">\n                        <div class="pp-method-head">\n                            <div class="pp-method-left">\n                                <div class="pp-radio-circle"><div class="pp-radio-dot"></div></div>\n                                <div class="pp-method-icon">💳</div>\n                                <div>\n                                    <div class="pp-method-title">Debit / Credit Card</div>\n                                    <div class="pp-method-sub">RuPay, Visa, Mastercard (In-App 3D-Secure)</div>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="pp-method-Drawer" onclick="event.stopPropagation();">\n                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">\n                                <span style="font-size:10px; font-weight:800; color:var(--text-muted);">ENTER CARD DETAILS</span>\n                                <button type="button" onclick="autoFillDemoCardDetails()" style="background:rgba(95,37,159,0.12); color:#5f259f; border:1px solid #5f259f; border-radius:6px; padding:2px 7px; font-size:9.5px; font-weight:900; cursor:pointer;">⚡ Fill Saved Card</button>\n                            </div>\n                            <input type="tel" class="form-control" id="pgCardNumber" maxlength="16" placeholder="4532 XXXX XXXX 8892" style="margin-bottom:6px; font-size:12px;">\n                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">\n                                <input type="text" class="form-control" id="pgCardExpiry" maxlength="5" placeholder="MM/YY (08/29)" style="font-size:12px;">\n                                <input type="password" class="form-control" id="pgCardCvv" maxlength="3" placeholder="CVV (•••)" style="font-size:12px;">\n                            </div>\n                            <div id="cardInlineOtpBox" style="display:none; margin-top:8px; padding:8px; background:rgba(16,185,129,0.12); border:1px dashed #10b981; border-radius:10px; text-align:center;">\n                                <div style="font-size:11px; font-weight:800; color:#059669; margin-bottom:4px;">\n                                    📲 Bank SMS OTP: <code id="cardServerGeneratedOtpDisplay" style="font-size:14px; font-weight:900;">------</code>\n                                    <button type="button" onclick="autoFillCardOtpInput()" style="background:#059669; color:#fff; border:none; border-radius:5px; padding:2px 7px; font-size:9.5px; font-weight:900; cursor:pointer; margin-left:4px;">Tap to Fill</button>\n                                </div>\n                                <input type="tel" class="form-control" id="pgCardOtpInput" maxlength="6" placeholder="Enter 6-Digit Bank OTP" style="text-align:center; font-family:monospace; font-weight:900; letter-spacing:2px;">\n                            </div>\n                        </div>\n                    </div>\n\n                    <!-- METHOD 6: NET BANKING -->\n                    <div class="pp-method-card" id="ppCard_netbanking" onclick="selectPhonePeMethod(\'netbanking\')">\n                        <div class="pp-method-head">\n                            <div class="pp-method-left">\n                                <div class="pp-radio-circle"><div class="pp-radio-dot"></div></div>\n                                <div class="pp-method-icon">🏛️</div>\n                                <div>\n                                    <div class="pp-method-title">Net Banking</div>\n                                    <div class="pp-method-sub">SBI, HDFC, ICICI, Indian Bank, Canara, Axis</div>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="pp-method-Drawer" onclick="event.stopPropagation();">\n                            <div class="bank-grid" style="margin-bottom:4px;">\n                                <button type="button" class="bank-option-btn selected" onclick="selectExamBank(this, \'SBI\')">🏦 SBI</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'HDFC\')">🏦 HDFC</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'ICICI\')">🏦 ICICI</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'INDIAN\')">🏦 Indian Bank</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'CANARA\')">🏦 Canara</button>\n                                <button type="button" class="bank-option-btn" onclick="selectExamBank(this, \'AXIS\')">🏦 Axis Bank</button>\n                            </div>\n                        </div>\n                    </div>\n\n                    <div id="upiSecurityErrorMsg" style="display: none; margin-top: 6px; font-size: 11px; font-weight: 800; color: var(--danger); background: #fee2e2; padding: 7px 10px; border-radius: 8px; border: 1px solid #fecaca;"></div>\n                </div>\n\n                <!-- Sticky PhonePe Bottom Pay Action Bar -->\n                <div class="pp-bottom-bar">\n                    <button type="button" class="pp-pay-main-btn" id="ppMainPayActionBtn" onclick="handlePhonePePrimaryPayClick()">\n                        🔒 PAY ₹<span class="btn-amt-span">0.00</span>\n                    </button>\n                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--text-muted); font-weight:700; padding:0 2px;">\n                        <span>🛡️ 100% Secure In-App PhonePe Checkout</span>\n                        <button type="button" onclick="triggerExamPaymentTimeoutFailure(\'Transaction was declined / simulated failed by user.\')" style="background:none; border:none; color:var(--danger); font-size:10px; font-weight:800; cursor:pointer; text-decoration:underline;">Test Payment Fail</button>\n                    </div>\n                </div>\n            </div>\n\n            <!-- =============================================================\n                 VIEW 2: OFFICIAL NPCI FULL-SCREEN 4-DIGIT UPI PIN SCREEN\n                 ============================================================= -->\n            <div class="npci-official-pin-overlay" id="inAppNpciPinScreen">\n                <div>\n                    <div class="npci-top-header">\n                        <div>\n                            <div style="font-size: 12.5px; font-weight: 900; color: #0f172a;" id="npciBankHeaderName">State Bank of India ••4821</div>\n                            <div style="font-size: 10px; color: #64748b; font-weight: 700;">NPCI Unified Payments Interface</div>\n                        </div>\n                        <div style="font-size: 12px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px;">UPI™</div>\n                    </div>\n                    <div class="npci-payee-strip">\n                        <span id="npciPayeeMerchantTitle">To: CANTEEN OFFICIAL</span>\n                        <span>₹<span class="btn-amt-span">0.00</span></span>\n                    </div>\n                </div>\n\n                <div class="npci-pin-center">\n                    <div style="font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">\n                        ENTER 4-DIGIT UPI PIN\n                    </div>\n                    <div class="npci-pin-boxes">\n                        <div class="npci-pin-slot" id="npciDot_0"></div>\n                        <div class="npci-pin-slot" id="npciDot_1"></div>\n                        <div class="npci-pin-slot" id="npciDot_2"></div>\n                        <div class="npci-pin-slot" id="npciDot_3"></div>\n                    </div>\n                    <div style="font-size: 11px; color: #64748b; margin-top: 8px;">\n                        Enter your 4-digit PIN (<strong style="color:#1e3a8a;" id="npciHintPinText">1234</strong>) or\n                        <button type="button" onclick="autoFillInAppUpiPin()" style="background:#dbeafe; color:#1e3a8a; border:1px solid #93c5fd; border-radius:6px; padding:2px 8px; font-size:10px; font-weight:900; cursor:pointer;">⚡ Auto-Fill &amp; Pay</button>\n                    </div>\n                    <div id="npciPinErrorText" style="display:none; margin-top:8px; font-size:11px; font-weight:800; color:#dc2626;"></div>\n                </div>\n\n                <div>\n                    <div style="display:flex; justify-content:space-between; padding:6px 12px; background:#e2e8f0; font-size:11px; font-weight:800;">\n                        <button type="button" onclick="closeInAppNpciPinPad()" style="background:none; border:none; color:#475569; font-weight:800; cursor:pointer;">← Back to Methods</button>\n                        <button type="button" onclick="triggerExamPaymentTimeoutFailure(\'UPI Payment declined on NPCI PIN screen.\')" style="background:none; border:none; color:#dc2626; font-weight:800; cursor:pointer;">✕ Cancel / Fail</button>\n                    </div>\n                    <div class="npci-numpad">\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'1\')">1</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'2\')">2</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'3\')">3</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'4\')">4</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'5\')">5</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'6\')">6</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'7\')">7</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'8\')">8</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'9\')">9</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'BACK\')">⌫</button>\n                        <button type="button" class="npci-num-key" onclick="pressNpciPinKey(\'0\')">0</button>\n                        <button type="button" class="npci-num-key submit-key" onclick="submitInAppNpciPinPayment()">✓</button>\n                    </div>\n                </div>\n            </div>\n\n            <!-- =============================================================\n                 VIEW 3: PHONEPE PROCESSING SPINNER SCREEN\n                 ============================================================= -->\n            <div class="pp-state-screen" id="examPgProcessingScreen">\n                <div class="pp-big-spinner"></div>\n                <h3 style="font-size: 18px; font-weight: 900; color: var(--text-main);">Processing Payment...</h3>\n                <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px; font-weight: 600;" id="examPgProcessingSub">\n                    Connecting securely to bank server. Please do not press back.\n                </p>\n            </div>\n\n            <!-- =============================================================\n                 VIEW 4: PHONEPE GREEN PAYMENT SUCCESSFUL SCREEN\n                 ============================================================= -->\n            <div class="pp-state-screen" id="examPgSuccessScreen" style="background: rgba(0, 185, 112, 0.06);">\n                <div class="pp-success-circle">✓</div>\n                <span style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; color: #059669; background: #dcfce7; padding: 4px 12px; border-radius: 20px;">PhonePe Payment Successful</span>\n                <h3 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 10px;" id="examPgSuccessTitle">Paid ₹0.00</h3>\n                <p style="font-size: 12.5px; color: var(--text-main); margin: 4px 0 12px; font-weight: 800;" id="examPgSuccessSubText">\n                    To CANTEEN OFFICIAL\n                </p>\n                <div style="background: var(--surface-sub-bg); border: 1.5px solid #10b981; border-radius: 12px; padding: 10px 16px; margin-bottom: 12px; font-family: monospace; font-size: 12px; font-weight: 900; color: var(--text-main);" id="examPgSuccessRefBox">\n                    UTR: --\n                </div>\n                <p style="font-size: 11.5px; color: #5f259f; font-weight: 900;">⚡ Auto-opening your Digital Receipt...</p>\n            </div>\n\n            <!-- =============================================================\n                 VIEW 5: PHONEPE RED PAYMENT FAILED / TIMED OUT SCREEN\n                 ============================================================= -->\n            <div class="pp-state-screen" id="examPgFailedScreen" style="background: rgba(239, 68, 68, 0.05);">\n                <div class="pp-failed-circle">✕</div>\n                <span style="font-size: 10.5px; font-weight: 900; text-transform: uppercase; color: #dc2626; background: #fee2e2; padding: 4px 12px; border-radius: 20px;">Transaction Failed</span>\n                <h3 style="font-size: 21px; font-weight: 900; color: var(--danger); margin-top: 10px;">Payment Failed!</h3>\n                <p style="font-size: 12px; color: var(--text-muted); margin: 6px 0 18px; font-weight: 600; line-height: 1.45;" id="examPgFailedReason">\n                    Payment was not completed within the 05:00 portal time limit. Your tray items are safe.\n                </p>\n                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;">\n                    <button type="button" class="pp-pay-main-btn" onclick="retryTimedPaymentSession()" style="padding: 11px; font-size: 13px;">🔄 Retry Payment</button>\n                    <button type="button" class="checkout-btn" onclick="stayOnCheckoutDrawerAfterFailure()" style="background: #475569; padding: 11px; font-size: 13px;">🛒 Back to Tray</button>\n                </div>\n            </div>\n\n        </div>\n    </div>';

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
           PHONEPE-STYLE 100% IN-APP MULTI-METHOD PAYMENT PORTAL (v7)
           Includes ALL Payment Methods inside the PhonePe Checkout Sheet:
             1. UPI Linked Bank Accounts (SBI, HDFC, Indian Bank + Check Balance)
                -> Opens Official NPCI Full-Screen 4-Digit UPI PIN Pad
             2. PhonePe Wallet / UPI Lite (1-Tap Zero-PIN Instant Checkout!)
             3. In-App Dynamic Fixed-Amount UPI QR Code
             4. Other UPI ID / VPA (@ybl, @ibl, @axl, @okaxis + Verify VPA)
             5. Debit / Credit Cards (Visa, Mastercard, RuPay + In-App 3D-Secure OTP)
             6. Net Banking (SBI, HDFC, ICICI, Indian Bank, Canara, Axis)
           Features:
             - Synthesized PhonePe Payment Success Audio Chime (Web Audio API)
             - PhonePe Green Payment Successful Screen -> Auto-Redirects to Receipt!
             - PhonePe Red Payment Failed Screen on Timeout / Decline -> Stays on Page!
             - Counter Staff NEVER verify UPI manually; only Paid orders enter Ledger.
           ===================================================================== */
        window.examPaymentTimerInterval = window.examPaymentTimerInterval || null;
        window.EXAM_TOTAL_SECONDS = 300; // 5 Minutes (300 seconds)
        window.examPaymentSecondsLeft = window.EXAM_TOTAL_SECONDS;
        window.selectedPhonePeMethod = "upi_bank"; // 'upi_bank' | 'wallet' | 'qr' | 'vpa' | 'card' | 'netbanking'
        window.selectedLinkedBankCode = "SBI";
        window.selectedLinkedBankLabel = "State Bank of India ••4821";
        window.selectedExamBankCode = "SBI";
        window.isExamPaymentCompleted = false;

        // NPCI UPI PIN Pad & Card 3D-Secure State
        window.currentNpciEnteredPin = "";
        window.expectedInAppUpiPin = "1234";
        window.npciPinWrongAttempts = 0;
        window.expectedCard3dsOtp = "";
        window.isCardOtpStepActive = false;

        /* Synthesizes the signature PhonePe-style payment success chime using Web Audio API */
        function playPhonePeSuccessChime() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
                    gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.11);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.11);
                    osc.stop(ctx.currentTime + idx * 0.11 + 0.36);
                });
            } catch (e) {}
        }

        function getActiveStudentExpectedPin() {
            const vaultHit = findStudentVaultEntry(currentUser);
            if (vaultHit && vaultHit.record && /^\d{4}$/.test(String(vaultHit.record.pin || ''))) {
                return String(vaultHit.record.pin);
            }
            return "1234";
        }

        /* Student PhonePe Wallet / UPI Lite Balance (Default ₹500.00 per student) */
        function getStudentPhonePeWalletBalance() {
            const key = getStudentAccountKey(currentUser) || 'guest';
            const raw = localStorage.getItem('cb_pp_wallet_' + key);
            if (raw === null || isNaN(Number(raw))) {
                localStorage.setItem('cb_pp_wallet_' + key, '500');
                return 500;
            }
            return Number(raw);
        }

        function setStudentPhonePeWalletBalance(newBal) {
            const key = getStudentAccountKey(currentUser) || 'guest';
            const cleanBal = Math.max(0, Number(newBal) || 0);
            localStorage.setItem('cb_pp_wallet_' + key, String(cleanBal));
            updatePhonePeWalletUI();
        }

        function updatePhonePeWalletUI() {
            const bal = getStudentPhonePeWalletBalance();
            const el = document.getElementById('ppWalletBalText');
            if (el) el.innerText = `₹${bal.toFixed(2)}`;
        }

        function topUpPhonePeWallet(addAmt = 200) {
            clearUpiSecurityError();
            const currentBal = getStudentPhonePeWalletBalance();
            setStudentPhonePeWalletBalance(currentBal + Number(addAmt));
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
            const npciErr = document.getElementById('npciPinErrorText');
            if (npciErr) npciErr.style.display = 'none';
        }

        function refreshGatewayQrImage() {
            const { vpa, merchant, amount, token } = activeGatewayUpiParams;
            const qrImgEl = document.getElementById('upiGateQrImg');
            if (!qrImgEl) return;
            const fixedQrUri = buildFixedAmountQrUri(vpa, merchant, amount, `Token ${token || 'Order'}`);
            qrImgEl.src = generateQrDataUrl(fixedQrUri, 240);
        }

        function selectPhonePeMethod(methodKey) {
            clearUpiSecurityError();
            window.selectedPhonePeMethod = methodKey;
            ['upi_bank', 'wallet', 'qr', 'vpa', 'card', 'netbanking'].forEach(k => {
                const card = document.getElementById('ppCard_' + k);
                if (card) card.classList.toggle('selected', k === methodKey);
            });
            updatePhonePeBottomPayButtonText();
        }

        function updatePhonePeBottomPayButtonText() {
            const btn = document.getElementById('ppMainPayActionBtn');
            if (!btn) return;
            const fmtAmt = Number(activeGatewayUpiParams.amount || 0).toFixed(2);
            const m = window.selectedPhonePeMethod;
            if (m === 'wallet') {
                btn.innerHTML = `⚡ 1-TAP WALLET PAY ₹<span class="btn-amt-span">${fmtAmt}</span>`;
            } else if (m === 'upi_bank') {
                btn.innerHTML = `🔒 PAY ₹<span class="btn-amt-span">${fmtAmt}</span> VIA ${window.selectedLinkedBankCode} UPI`;
            } else if (m === 'qr') {
                btn.innerHTML = `📷 AUTHORIZE QR PAY ₹<span class="btn-amt-span">${fmtAmt}</span>`;
            } else if (m === 'vpa') {
                btn.innerHTML = `🆔 VERIFY &amp; PAY ₹<span class="btn-amt-span">${fmtAmt}</span>`;
            } else if (m === 'card') {
                btn.innerHTML = window.isCardOtpStepActive
                    ? `✔ VERIFY CARD OTP &amp; PAY ₹<span class="btn-amt-span">${fmtAmt}</span>`
                    : `💳 PROCEED WITH CARD ₹<span class="btn-amt-span">${fmtAmt}</span>`;
            } else if (m === 'netbanking') {
                btn.innerHTML = `🏛️ PAY ₹<span class="btn-amt-span">${fmtAmt}</span> VIA ${window.selectedExamBankCode} NETBANKING`;
            }
        }

        function selectLinkedUpiBank(bankCode, bankLabel) {
            clearUpiSecurityError();
            window.selectedLinkedBankCode = bankCode;
            window.selectedLinkedBankLabel = bankLabel;
            ['SBI', 'HDFC', 'INDIAN'].forEach(code => {
                const row = document.getElementById('ppBankRow_' + code);
                if (row) row.classList.toggle('active-bank', code === bankCode);
            });
            updatePhonePeBottomPayButtonText();
        }

        function checkSimulatedBankBalance(bankCode, balFormatted) {
            const el = document.getElementById('ppBalText_' + bankCode);
            if (el) {
                el.innerHTML = `<span style="color:#059669; font-weight:900;">✔ Available Balance: ${balFormatted}</span>`;
            }
        }

        function appendVpaHandle(handleStr) {
            clearUpiSecurityError();
            const inp = document.getElementById('studentVpaInput');
            if (!inp) return;
            let val = inp.value.trim();
            if (!val) val = (currentUser && currentUser.phone) ? currentUser.phone : 'student';
            val = val.split('@')[0] + handleStr;
            inp.value = val;
            verifyInAppStudentVpa();
        }

        function verifyInAppStudentVpa() {
            clearUpiSecurityError();
            const inp = document.getElementById('studentVpaInput');
            const badge = document.getElementById('vpaVerifiedBadgeText');
            const vpa = inp ? inp.value.trim() : '';
            if (!vpa || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
                if (badge) badge.style.display = 'none';
                showUpiSecurityError("❌ Please enter a valid UPI ID (e.g. name@ybl) or tap one of the @ybl / @ibl chips.");
                return false;
            }
            if (badge) {
                badge.style.display = 'block';
                badge.innerText = `✔ Verified Account: ${(currentUser && currentUser.name) ? currentUser.name.toUpperCase() : 'VERIFIED STUDENT'} (${vpa})`;
            }
            return true;
        }

        function autoFillDemoCardDetails() {
            clearUpiSecurityError();
            const cNum = document.getElementById('pgCardNumber');
            const cExp = document.getElementById('pgCardExpiry');
            const cCvv = document.getElementById('pgCardCvv');
            if (cNum) cNum.value = '4532891044218892';
            if (cExp) cExp.value = '08/29';
            if (cCvv) cCvv.value = '842';
        }

        function autoFillCardOtpInput() {
            clearUpiSecurityError();
            const otpInput = document.getElementById('pgCardOtpInput');
            if (otpInput) otpInput.value = window.expectedCard3dsOtp;
        }

        function selectExamBank(btnEl, bankCode) {
            clearUpiSecurityError();
            window.selectedExamBankCode = bankCode;
            document.querySelectorAll('.bank-option-btn').forEach(b => b.classList.remove('selected'));
            if (btnEl) btnEl.classList.add('selected');
            updatePhonePeBottomPayButtonText();
        }

        function stopExamPaymentTimer() {
            if (window.examPaymentTimerInterval) {
                clearInterval(window.examPaymentTimerInterval);
                window.examPaymentTimerInterval = null;
            }
        }

        function showPhonePeModalView(viewName) {
            const activeBody = document.getElementById('examPgActiveBody');
            const npciScreen = document.getElementById('inAppNpciPinScreen');
            const procScreen = document.getElementById('examPgProcessingScreen');
            const succScreen = document.getElementById('examPgSuccessScreen');
            const failScreen = document.getElementById('examPgFailedScreen');

            if (activeBody) activeBody.style.display = (viewName === 'methods') ? 'flex' : 'none';
            if (npciScreen) npciScreen.classList.toggle('active', viewName === 'npci');
            if (procScreen) procScreen.classList.toggle('active', viewName === 'processing');
            if (succScreen) succScreen.classList.toggle('active', viewName === 'success');
            if (failScreen) failScreen.classList.toggle('active', viewName === 'failed');
        }

        function startExamTimedPaymentSession(durationSeconds = window.EXAM_TOTAL_SECONDS) {
            stopExamPaymentTimer();
            window.isExamPaymentCompleted = false;
            window.examPaymentSecondsLeft = durationSeconds;
            window.npciPinWrongAttempts = 0;
            window.isCardOtpStepActive = false;
            window.expectedInAppUpiPin = getActiveStudentExpectedPin();

            const otpBox = document.getElementById('cardInlineOtpBox');
            if (otpBox) otpBox.style.display = 'none';
            const vpaBadge = document.getElementById('vpaVerifiedBadgeText');
            if (vpaBadge) vpaBadge.style.display = 'none';

            updatePhonePeWalletUI();
            refreshGatewayQrImage();
            selectPhonePeMethod('upi_bank');
            selectLinkedUpiBank('SBI', 'State Bank of India ••4821');
            showPhonePeModalView('methods');
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
                barEl.style.background = safeSecs <= 60 ? '#ef4444' : '#00d09c';
            }
        }

        /* =====================================================================
           MAIN PHONEPE "PAY ₹XX.XX" BUTTON HANDLER FOR ALL 6 METHODS
           ===================================================================== */
        function handlePhonePePrimaryPayClick() {
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before payment authorization.");
                return;
            }
            clearUpiSecurityError();
            const amount = Number(activeGatewayUpiParams.amount || 0);
            const m = window.selectedPhonePeMethod;

            // 1. PHONEPE WALLET / UPI LITE (1-Tap Instant Zero-PIN Pay)
            if (m === 'wallet') {
                const bal = getStudentPhonePeWalletBalance();
                if (bal < amount) {
                    showUpiSecurityError(`❌ Insufficient PhonePe Wallet Balance (₹${bal.toFixed(2)}). Tap '+ Add ₹200' on the Wallet card to top up!`);
                    return;
                }
                setStudentPhonePeWalletBalance(bal - amount);
                runPhonePeProcessingAndComplete(`PP-WALLET-${generateInAppNpciUtr12().slice(-8)}`, 'PhonePe Wallet / UPI Lite');
                return;
            }

            // 2. LINKED UPI BANK ACCOUNT -> Open Official NPCI UPI PIN Pad
            if (m === 'upi_bank') {
                openInAppNpciPinPad(window.selectedLinkedBankLabel, `UPI-${window.selectedLinkedBankCode}`);
                return;
            }

            // 3. IN-APP DYNAMIC QR -> Open Official NPCI UPI PIN Pad
            if (m === 'qr') {
                openInAppNpciPinPad('PhonePe QR Scan • SBI ••4821', 'UPI-QR');
                return;
            }

            // 4. OTHER UPI ID / VPA -> Validate VPA then Open Official NPCI UPI PIN Pad
            if (m === 'vpa') {
                if (!verifyInAppStudentVpa()) return;
                const vpa = document.getElementById('studentVpaInput').value.trim();
                openInAppNpciPinPad(`UPI VPA (${vpa})`, 'UPI-VPA');
                return;
            }

            // 5. DEBIT / CREDIT CARD -> 2-step inline 3D-Secure OTP
            if (m === 'card') {
                const num = (document.getElementById('pgCardNumber')?.value || '').replace(/\D/g, '');
                const exp = (document.getElementById('pgCardExpiry')?.value || '').trim();
                const cvv = (document.getElementById('pgCardCvv')?.value || '').trim();
                if (num.length < 12 || !exp || cvv.length < 3) {
                    showUpiSecurityError("❌ Please enter Card Number, Expiry, and CVV (or tap '⚡ Fill Saved Card').");
                    return;
                }
                if (!window.isCardOtpStepActive) {
                    window.isCardOtpStepActive = true;
                    window.expectedCard3dsOtp = String(Math.floor(100000 + Math.random() * 900000));
                    document.getElementById('cardServerGeneratedOtpDisplay').innerText = window.expectedCard3dsOtp;
                    document.getElementById('cardInlineOtpBox').style.display = 'block';
                    const otpInp = document.getElementById('pgCardOtpInput');
                    if (otpInp) { otpInp.value = ''; otpInp.focus(); }
                    updatePhonePeBottomPayButtonText();
                    return;
                } else {
                    const enteredOtp = (document.getElementById('pgCardOtpInput')?.value || '').trim();
                    if (!enteredOtp || enteredOtp !== window.expectedCard3dsOtp) {
                        showUpiSecurityError(`❌ Invalid 3D-Secure OTP! Enter ${window.expectedCard3dsOtp} (or tap 'Tap to Fill').`);
                        return;
                    }
                    runPhonePeProcessingAndComplete(`CARD-${num.slice(-4)}-${generateInAppNpciUtr12().slice(-6)}`, 'Debit / Credit Card 3D-Secure');
                    return;
                }
            }

            // 6. NET BANKING -> Process via Selected Bank
            if (m === 'netbanking') {
                runPhonePeProcessingAndComplete(`NETBANK-${window.selectedExamBankCode}-${generateInAppNpciUtr12().slice(-6)}`, `${window.selectedExamBankCode} NetBanking`);
                return;
            }
        }

        /* =====================================================================
           OFFICIAL NPCI FULL-SCREEN 4-DIGIT UPI PIN PAD CONTROLLER
           ===================================================================== */
        function openInAppNpciPinPad(bankHeaderLabel, methodPrefix) {
            clearUpiSecurityError();
            window.currentNpciEnteredPin = "";
            window.currentNpciMethodPrefix = methodPrefix || 'UPI';
            window.expectedInAppUpiPin = getActiveStudentExpectedPin();

            const bankHdr = document.getElementById('npciBankHeaderName');
            const payeeTitle = document.getElementById('npciPayeeMerchantTitle');
            const hintEl = document.getElementById('npciHintPinText');

            if (bankHdr) bankHdr.innerText = bankHeaderLabel || 'State Bank of India ••4821';
            if (payeeTitle) payeeTitle.innerText = `To: ${activeGatewayUpiParams.merchant || 'CANTEEN OFFICIAL'}`;
            if (hintEl) hintEl.innerText = window.expectedInAppUpiPin;

            renderNpciPinDots();
            showPhonePeModalView('npci');
        }

        function closeInAppNpciPinPad() {
            window.currentNpciEnteredPin = "";
            showPhonePeModalView('methods');
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
            submitInAppNpciPinPayment();
        }

        function submitInAppNpciPinPayment() {
            const errEl = document.getElementById('npciPinErrorText');
            if (window.currentNpciEnteredPin.length !== 4) {
                if (errEl) {
                    errEl.innerText = "⚠️ Please enter all 4 digits of your UPI PIN (or tap '⚡ Auto-Fill & Pay').";
                    errEl.style.display = 'block';
                }
                return;
            }
            // Accept either the student's 4-digit PIN OR '1234' (universal demo UPI PIN)
            if (window.currentNpciEnteredPin !== window.expectedInAppUpiPin && window.currentNpciEnteredPin !== '1234') {
                window.npciPinWrongAttempts += 1;
                window.currentNpciEnteredPin = "";
                renderNpciPinDots();
                if (window.npciPinWrongAttempts >= 3) {
                    triggerExamPaymentTimeoutFailure("❌ Payment Failed: Incorrect UPI PIN entered 3 times.");
                    return;
                }
                if (errEl) {
                    errEl.innerText = `❌ Incorrect UPI PIN! Enter ${window.expectedInAppUpiPin} (${3 - window.npciPinWrongAttempts} attempts left).`;
                    errEl.style.display = 'block';
                }
                return;
            }

            const utr12 = generateInAppNpciUtr12();
            runPhonePeProcessingAndComplete(`UTR-${utr12}`, 'PhonePe UPI');
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

        /* =====================================================================
           PHONEPE PROCESSING -> GREEN SUCCESS SCREEN + CHIME -> AUTO-REDIRECT
           ===================================================================== */
        function runPhonePeProcessingAndComplete(verifiedRefId, methodLabel) {
            if (window.isExamPaymentCompleted) return;
            if (window.examPaymentSecondsLeft <= 0) {
                triggerExamPaymentTimeoutFailure("⏱️ Session expired before payment completion.");
                return;
            }

            const procSub = document.getElementById('examPgProcessingSub');
            if (procSub) procSub.innerText = `Authorizing ₹${Number(activeGatewayUpiParams.amount || 0).toFixed(2)} via ${methodLabel}...`;
            showPhonePeModalView('processing');

            setTimeout(() => {
                if (window.examPaymentSecondsLeft <= 0 && !window.isExamPaymentCompleted) {
                    triggerExamPaymentTimeoutFailure("⏱️ Session expired during payment settlement.");
                    return;
                }

                // Show PhonePe Green Success Screen & Play Chime!
                stopExamPaymentTimer();
                playPhonePeSuccessChime();

                const fmtAmt = Number(activeGatewayUpiParams.amount || 0).toFixed(2);
                const succTitle = document.getElementById('examPgSuccessTitle');
                const succSub = document.getElementById('examPgSuccessSubText');
                const succRef = document.getElementById('examPgSuccessRefBox');

                if (succTitle) succTitle.innerText = `Paid ₹${fmtAmt}`;
                if (succSub) succSub.innerText = `To ${activeGatewayUpiParams.merchant || 'CANTEEN OFFICIAL'} (${activeGatewayUpiParams.vpa || 'canteen@sbi'})`;
                if (succRef) succRef.innerText = `Transaction Ref: ${verifiedRefId}`;

                showPhonePeModalView('success');

                // Auto-redirect straight to My Digital Receipts after 850ms!
                setTimeout(() => {
                    finalizeAndCommitVerifiedOnlineOrder(verifiedRefId);
                }, 850);
            }, 650);
        }

        function copyGatewayUpiId() {
            const vpa = activeGatewayUpiParams.vpa || 'canteen@sbi';
            navigator.clipboard.writeText(vpa);
        }

        function copyGatewayUpiPhone() {
            const phone = activeGatewayUpiParams.phone || '';
            if (!phone) return;
            navigator.clipboard.writeText(phone);
        }

        /* When payment fails or times out, show PhonePe Red Failed Screen & stay on same page! */
        function triggerExamPaymentTimeoutFailure(reasonText) {
            if (window.isExamPaymentCompleted) return;
            stopExamPaymentTimer();

            pendingUpiOrderToken = null;
            window.currentPendingOrderDraft = null;
            localStorage.removeItem('cb_pending_upi_draft');

            const reasonEl = document.getElementById('examPgFailedReason');
            if (reasonEl) reasonEl.innerText = reasonText || "Payment Failed or Timed Out. You are still on the same page and your tray items are preserved.";
            showPhonePeModalView('failed');
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
           COMMIT VERIFIED ONLINE ORDER & SWITCH TO MY DIGITAL RECEIPTS
           ===================================================================== */
        function finalizeAndCommitVerifiedOnlineOrder(utrOrRef) {
            stopExamPaymentTimer();
            if (window.isExamPaymentCompleted) return;
            window.isExamPaymentCompleted = true;

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
                document.getElementById('successToastHeading').innerText = "PhonePe Online Paid! ⚡";
                document.getElementById('toastTokenDisplay').innerText = `#${completedOrder.token} • PIN: ${completedOrder.handshakePin}`;
                toastModal.classList.add('active');
                setTimeout(() => {
                    toastModal.classList.remove('active');
                }, 850);
            }
        }

        function cancelLiveUpiPaymentModal() {
            stopExamPaymentTimer();
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
                ? "PhonePe Online Paid! ⚡"
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

            // Hold unverified online order in memory until In-App PhonePe Payment completes!
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
                        theme: { color: "#5f259f" },
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
                                    triggerExamPaymentTimeoutFailure("Checkout was closed before payment completion.");
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

            document.getElementById('upiGateTokenHeading').innerText = `Token #${tokenNum} • Canteen Pass`;
            document.getElementById('upiGateBankingName').innerText = activeMerchant;
            document.getElementById('upiGateLockedAmountBadge').innerText = `₹${formattedFixedAmt}`;
            document.getElementById('upiGateVpaText').innerText = activeUpi;

            document.querySelectorAll('.btn-amt-span').forEach(el => {
                el.innerText = formattedFixedAmt;
            });

            pushOverlayHistoryState('upi-gateway-modal');
            document.getElementById('upiLivePaymentModal').classList.add('active');
            startExamTimedPaymentSession(window.EXAM_TOTAL_SECONDS);
        }
