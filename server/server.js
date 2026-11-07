import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your CampusBites frontend to contact this server.
// For production, replace "*" with your real domain.
app.use(cors());

// Parse normal JSON requests.
// Webhook handling will be added separately later.
app.use(express.json());

/* =========================================================
   RAZORPAY CONFIGURATION
   ========================================================= */

if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
) {
    console.error(
        "ERROR: Razorpay credentials are missing in .env"
    );
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "CampusBites Payment Server",
        status: "running"
    });
});


/* =========================================================
   CREATE PAYMENT ORDER
   ========================================================= */

app.post("/api/payments/create", async (req, res) => {
    try {

        const {
            orderId,
            foodAmount,
            canteenId
        } = req.body;


        // Basic validation
        if (!orderId || !canteenId) {
            return res.status(400).json({
                success: false,
                message:
                    "orderId and canteenId are required"
            });
        }


        // IMPORTANT:
        // For the first integration test, we accept the
        // amount from the frontend.
        //
        // In the next step, this will be replaced with
        // server/database-calculated prices.

        const amountInRupees =
            Number(foodAmount);

        if (
            !Number.isFinite(amountInRupees) ||
            amountInRupees <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid food amount"
            });
        }


        /* =============================================
           CONVENIENCE FEE

           This is an example calculation.

           Do NOT assume this exactly matches your
           final Razorpay pricing. Configure the final
           fee only after confirming your gateway plan.
           ============================================= */

        const convenienceFee =
            Math.round(
                amountInRupees * 0.0236 * 100
            ) / 100;


        const totalAmount =
            amountInRupees + convenienceFee;


        // Razorpay uses paise, not rupees.
        const amountInPaise =
            Math.round(totalAmount * 100);


        // Create the official Razorpay order
        const gatewayOrder =
            await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",

                receipt:
                    String(orderId)
                        .slice(0, 40),

                notes: {
                    campusbites_order_id:
                        String(orderId),

                    canteen_id:
                        String(canteenId)
                }
            });


        console.log(
            "Payment order created:",
            gatewayOrder.id
        );


        // Send only safe information back to frontend.
        res.json({
            success: true,

            razorpayOrderId:
                gatewayOrder.id,

            amount:
                gatewayOrder.amount,

            currency:
                gatewayOrder.currency,

            foodAmount:
                amountInRupees,

            convenienceFee,

            totalAmount,

            orderId
        });

    } catch (error) {

        console.error(
            "Payment order creation error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to create payment order"
        });
    }
});


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {
    console.log(
        `CampusBites payment server running on port ${PORT}`
    );
});
