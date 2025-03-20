import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)",
	"/api/webhooks(.*)",
	"/api/stripe(.*)", // ✅ Allow Stripe webhooks
]);

export default clerkMiddleware(async (auth, request) => {
	// check if the request is to root 
	if (request.nextUrl.pathname === "/") { 
		const { userId } = await auth();

		// redirect login user to home
		if (userId) {
			return NextResponse.redirect(new URL('/home', request.url));
		}
	}

	if (!isPublicRoute(request)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// Apply middleware to all routes except static files and Next.js internals
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
