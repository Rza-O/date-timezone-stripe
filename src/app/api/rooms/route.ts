/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prismaClient";

export const GET = async (req: NextRequest) => {
	try {
		const rooms = await prisma.room.findMany({
			where: { isDeleted: false },
			select: {
				id: true,
				name: true,
				capacity: true,
				location: true,
				availabilities: {
					select: {
						date: true,
						slots: {
							select: {
								id: true,
								startTime: true,
								endTime: true,
							},
							where: { isBooked: false },
						},
					},
				},
			},
		});
		return NextResponse.json({ rooms });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch rooms", message: error },
			{ status: 500 }
		);
	}
};
