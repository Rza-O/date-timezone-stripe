"use client";
import { SignUp, useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DetectTimezone from "../components/sideEffects/DetectTimezone";

export default function CheckSignIn() {

  const { isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        axios.post("/api/updateTZ", { userId, timezone });
        router.push("/home");
      } catch (error) {
        console.error("Error updating time zone:", error);
      }
    }
  }, [isSignedIn, router, userId]);

  DetectTimezone();


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <SignUp />
      </main>
    </div>
  );
}
