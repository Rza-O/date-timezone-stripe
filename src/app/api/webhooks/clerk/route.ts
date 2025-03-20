import { WebhookEvent } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

const prisma = new PrismaClient();

export const POST = async (req: Request) => {
	const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		console.error("Clerk webhook secret is not set");
		return NextResponse.json("Clerk webhook secret is not set", {
			status: 500,
		});
	}

	try {
		const payload = await req.json();
		const headerPayload = headers();
		const svixHeaders = {
			"svix-id": headerPayload.get("svix-id")!,
			"svix-signature": headerPayload.get("svix-signature")!,
			"svix-timestamp": headerPayload.get("svix-timestamp")!,
		};

		console.log("Received headers:", svixHeaders);
		console.log("Received payload:", payload);

		// Check if headers are correctly formatted
		if (
			!svixHeaders["svix-id"] ||
			!svixHeaders["svix-signature"] ||
			!svixHeaders["svix-timestamp"]
		) {
			throw new Error("Missing required Svix headers");
		}

		const wh = new Webhook(WEBHOOK_SECRET);
		const event = wh.verify(
			JSON.stringify(payload),
			svixHeaders
		) as WebhookEvent;

		console.log("Verified event:", event);

		if (event.type === "user.created") {
			const { id, email_addresses, first_name, last_name } = event.data;

			const user = await prisma.user.create({
				data: {
					clerkId: id,
					email: email_addresses[0].email_address,
					name: `${first_name} ${last_name}`,
				},
			});
			console.log("User created:", user);
			console.log(
				`✅ User ${email_addresses[0].email_address} saved to database.`
			);
		}
		return NextResponse.json(
			{ message: "User created", success: true },
			{ status: 200 }
		);
	} catch (error) {
		console.error("❌ Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 400 }
		);
	}
};
