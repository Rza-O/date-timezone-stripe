import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prismaClient";
import { stripe } from "../../../../lib/stripe";

export const POST = async (req: NextRequest) => {
	try {
		const loggedInUser = await currentUser();

		if (!loggedInUser) {
			return NextResponse.json(
				{ error: "Unauthorized Access" },
				{ status: 401 }
			);
		}

		const { amount = 2300, metadata } = await req.json();
		console.log("Received Metadata in intent:", metadata);

		const user = await prisma.user.findUnique({
			where: { clerkId: loggedInUser.id },
		});

		if (!user) {
			return NextResponse.json({ error: "User Not Found" }, { status: 404 });
		}

		// find or create stripe customer
		let customerId = user.stripeCustomerId;

		if (!customerId) {
			const newCustomer = await stripe.customers.create({
				email: loggedInUser.emailAddresses[0].emailAddress,
				name: loggedInUser.firstName ?? "Unknown",
			});
			await prisma.user.update({
				where: { id: user.id },
				data: { stripeCustomerId: newCustomer.id },
			});
			customerId = newCustomer.id;
		}

		// creating payment intent
		const paymentIntent = await stripe.paymentIntents.create({
			amount,
			currency: "usd",
			customer: customerId,
			metadata,
			automatic_payment_methods: { enabled: true },
		});

		await prisma.paymentLog.create({
			data: {
				userId: user.id,
				
				amount: amount / 100,
				currency: "USD",
				status: "INTENT",
				method: "card",
				stripePaymentIntentId: paymentIntent.id,
			},
		});
		console.log("this is client secret =>", paymentIntent.client_secret);

		return NextResponse.json({
			clientSecret: paymentIntent.client_secret,
			paymentIntentId: paymentIntent.id,
		});
	} catch (error) {
		console.error("Internal Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
};
