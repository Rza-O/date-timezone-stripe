import Stripe from "stripe";
import { prisma } from "../../../../lib/prismaClient";

export const handleSuccessfulPayment = async (intent: Stripe.PaymentIntent) => {
	const metadata = intent.metadata;

	if (
		!metadata.userId ||
		!metadata.slotId ||
		!metadata.roomId ||
		!metadata.startTime ||
		!metadata.endTime ||
		!metadata.timezone
	) {
		throw new Error("Missing required metadata for booking creation.");
	}

	// Create the booking first
	const booking = await prisma.booking.create({
		data: {
			userId: Number(metadata.userId),
			slotId: Number(metadata.slotId),
			roomId: Number(metadata.roomId),
			startTime: new Date(metadata.startTime),
			endTime: new Date(metadata.endTime),
			timezone: metadata.timezone,
			status: "CONFIRMED", // Set the status to CONFIRMED
		},
	});

	console.log("Booking Created:", booking);

	const slotBooking = await prisma.slot.update({
		where: { id: booking.slotId },
		data: { isBooked: true },
	});

	console.log("slot updated=>", slotBooking);

	// Delete the old 'INTENT' entry in PaymentLog
	await prisma.paymentLog.deleteMany({
		where: {
			stripePaymentIntentId: intent.id,
			status: "INTENT",
		},
	});

	// Create a new entry in the Payment table
	await prisma.payment.create({
		data: {
			userId: Number(metadata.userId),
			bookingId: booking.id, // Use the newly created booking ID
			amount: intent.amount / 100,
			currency: "USD",
			status: "COMPLETED",
			method: "card",
			transactionId: intent.id,
		},
	});

	console.log("Payment Created Successfully");
};
