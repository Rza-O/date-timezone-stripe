import { NextResponse } from "next/server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prismaClient";

const roomSchema = z.object({
	name: z.string().min(3, "Room name must be at least 3 characters"),
	capacity: z.number().min(1, "Capacity must be at least 1"),
	location: z.string().min(3, "Location is required"),
	timezone: z.string().default("UTC"),
	availability: z.record(
		z.string(), // Day of the week (e.g., "Sunday", "Monday")
		z.record(
			z.string(), // Time slot (e.g., "12:00", "14:00")
			z.boolean() // Availability status
		)
	),
});

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const POST = async (req: Request) => {
	try {
		const user = await currentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const dbUser = await prisma.user.findUnique({
			where: { clerkId: user.id },
		});

		if (!dbUser || dbUser.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const requestData = await req.json();
		const parsedData = roomSchema.parse(requestData);

		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth();
		const currentDate = today.getDate();

		const room = await prisma.room.create({
			data: {
				name: parsedData.name,
				capacity: parsedData.capacity,
				location: parsedData.location,
				timezone: parsedData.timezone,
				availabilities: {
					create: Object.entries(parsedData.availability).flatMap(
						([day, slots]) =>
							Array.from({ length: 12 }).flatMap((_, weekOffset) => {
								const dayOfWeek = days.indexOf(day); // Get the index of the current day in the 'days' array (0 for "Sun", 1 for "Mon", etc.)
								const startDate = new Date(
									currentYear,
									currentMonth,
									currentDate
								); // Create a new Date object using the current year, month, and day.

								startDate.setDate(
									startDate.getDate() +
										((dayOfWeek - startDate.getDay() + 7) % 7) + // Calculate how many days to add to reach the target day of the week
										weekOffset * 7 // Adjust for each of the next 12 weeks (weekOffset ranges from 0 to 11)
								);

								// Example output of startDate:
								// Let's assume current date is March 18, 2025 (Tuesday)
								// If `dayOfWeek` is 2 (for "Tue"), and `startDate` is already a Tuesday,
								// this will calculate the next Tuesday from March 18th, and for the second week, it will set the date to March 25th, etc.

								return Object.entries(slots).map(
									([timeSlot, isAvailable]) => {
										const cleanedTimeSlot = timeSlot
											.replace(/AM|PM/g, "") // Remove AM/PM if present (we assume it's 24-hour format without AM/PM)
											.trim();
										const [hours, minutes] = cleanedTimeSlot
											.split(":")
											.map(Number); // Split the time into hours and minutes as numbers.

										if (
											isNaN(hours) ||
											isNaN(minutes) ||
											hours > 23 ||
											minutes > 59
										) {
											throw new Error(
												`Invalid time format: ${timeSlot}` // If hours or minutes are invalid, throw an error
											);
										}

										const startTime = new Date(startDate);
										startTime.setHours(hours, minutes, 0, 0); // Set the start time of the availability slot.

										const endTime = new Date(startTime);
										endTime.setHours(startTime.getHours() + 1); // The end time is 1 hour after the start time.

										return {
											date: startDate, // The date for this availability slot.
											timezone: parsedData.timezone, // Timezone from the parsed data.
											user: { connect: { id: dbUser.id } }, // User that created this availability slot.
											slots: {
												create: {
													startTime, // The computed start time for the slot.
													endTime, // The computed end time for the slot.
													isBooked: !isAvailable, // If the slot is available, it’s not booked (isBooked: false); if not available, it’s booked (isBooked: true).
												},
											},
										};
									}
								);
							})
					),
				},
			},
		});


		return NextResponse.json(
			{ message: "Room created successfully", room },
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating room:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to create room";
		return NextResponse.json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
};
