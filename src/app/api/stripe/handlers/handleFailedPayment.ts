/* eslint-disable @typescript-eslint/no-unused-vars */

import Stripe from "stripe";
import { prisma } from "../../../../lib/prismaClient";

export const handleFailedPayment = async (intent: Stripe.PaymentIntent) => {
	const { bookingId, userId } = intent.metadata;

	// Update Payment Log to 'FAILED'
	await prisma.paymentLog.updateMany({
		where: { stripePaymentIntentId: intent.id },
		data: { status: "FAILED" },
	});

	// Update Booking Status to CANCELLED
	await prisma.booking.update({
		where: { id: bookingId },
		data: { status: "CANCELLED" },
	});
};
