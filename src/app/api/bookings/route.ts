import { formatInTimeZone } from "date-fns-tz";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prismaClient";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get("userId");
		const userTimezone = searchParams.get("timezone");

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Fetch bookings with room details
		const bookings = await prisma.booking.findMany({
			where: { userId: parseInt(userId) },
			select: {
				id: true,
				startTime: true,
				endTime: true,
				timezone: true,
				Room: { select: { name: true, timezone: true } },
			},
		});

		if (!bookings.length) {
			return NextResponse.json(
				{ message: "No bookings found" },
				{ status: 200 }
			);
		}

		// Format bookings with dynamic timezone conversion and day of the week
		const formattedBookings = bookings.map((booking) => {
			const targetTimezone = userTimezone || booking.timezone || "UTC";

			// Format the start time and end time with day of the week
			const formattedStartTime = formatInTimeZone(
				booking.startTime,
				targetTimezone,
				"hh:mm a"
			);
			const formattedEndTime = formatInTimeZone(
				booking.endTime,
				targetTimezone,
				"hh:mm a"
			);
			console.log("formattedStartTime=> ", formattedStartTime);

			// Get the day of the week
			const dayOfWeek = formatInTimeZone(
				booking.startTime,
				targetTimezone,
				"EEEE"
			);

			return {
				id: booking.id,
				roomName: booking.Room?.name || "No Room Assigned",
				startTime: formattedStartTime,
				endTime: formattedEndTime,
				timezone: targetTimezone,
				dayOfWeek: dayOfWeek,
			};
		});

		return NextResponse.json(
			{ bookings: formattedBookings },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching bookings:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
