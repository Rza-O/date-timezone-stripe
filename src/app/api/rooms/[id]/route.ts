import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prismaClient";


export async function PATCH(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const roomId = parseInt(params.id);

	if (!roomId) {
		return NextResponse.json(
			{ error: "Room ID is required" },
			{ status: 400 }
		);
	}

	try {
		await prisma.room.update({
			where: { id: roomId },
			data: { isDeleted: true },
		});

		return NextResponse.json(
			{ message: "Room marked as deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error marking room as deleted:", error);
		return NextResponse.json(
			{ error: "Failed to delete room" },
			{ status: 500 }
		);
	}
}
