"use client";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import { IoAdd } from "react-icons/io5";
import RoomForm from "../../components/admin/AddForm";
import AllRooms from "../../components/shared/AllRoms";
import DetectTimezone from "../../components/sideEffects/DetectTimezone";
import { useUser } from "../../hooks/useUser";
import BookingTable from "../../components/shared/BookingTable";

export default function Home() {

   const [isFormShown, setIsFormShown] = useState(false);
   const { user } = useUser();

   return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
         <h1 className="text-4xl font-bold">Welcome Room Booking</h1>
         <SignOutButton />
         <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
            {/* <DetectTimezone /> */}
            {user?.role === "ADMIN" && <button onClick={() => setIsFormShown(!isFormShown)} className="btn"><IoAdd />Add Room</button>}
            {isFormShown && <RoomForm />}
            <div>
               <h1>Here are all the room added</h1>
               <AllRooms />
            </div>
            <div>
               <BookingTable />
            </div>
         </main>
      </div>
   );
}
