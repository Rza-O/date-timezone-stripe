/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format, isSameDay, isWeekend } from "date-fns";
import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import toast from "react-hot-toast";
import { useUser } from "../../hooks/useUser";
import DetectTimezone from "../sideEffects/DetectTimezone";
import { Button } from "../ui/button";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BookingModalProps {
   room: any;
   onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ room, onClose }) => {
   const queryClient = useQueryClient();
   const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
   const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
   const [clientSecret, setClientSecret] = useState<string | null>(null);
   const { user } = useUser();
   // const timezone = DetectTimezone();
   // const userId = user.clerkId;
   // console.log(user.clerkId)

   const handleSlotSelection = (slotId: number) => setSelectedSlot(slotId);

   const isDateAvailable = (date: Date) => !isWeekend(date);

   // Get all available slots for the selected date
   const selectedAvailability = selectedDate
      ? room.availabilities.filter((availability: any) =>
         isSameDay(new Date(availability.date), selectedDate)
      )
      : [];

   const createBookingMutation = useMutation({
      mutationFn: async () => {
         try {
            if (!selectedSlot) {
               toast.error("Please select a slot before booking.");
               throw new Error("No slot selected.");
            }

            const selectedSlotData = selectedAvailability
               .flatMap((availability: any) => availability.slots)
               .find((slot: any) => slot.id === selectedSlot);

            console.log("Selected Slot Data Before Check:", selectedSlotData);

            if (!selectedSlotData) {
               toast.error("Invalid slot selection. Please try again.");
               throw new Error("Selected slot not found.");
            }
            const startTimeUtc = new Date(selectedSlotData.startTime).toISOString();
            const endTimeUtc = new Date(selectedSlotData.endTime).toISOString();


            // console.log("Booking Data Before API Call:", {
            //    amount: 2300,
            //    slotId: selectedSlot,
            //    roomId: room.id,
            //    userId: room.userId,
            //    startTime: startTimeUtc,
            //    endTime: endTimeUtc,
            // });

            const response = await axios.post("/api/stripe/payment-intent", {
               amount: 2300,
               metadata: {
                  userId: user.id,
                  slotId: selectedSlot,
                  roomId: room.id,
                  startTime: selectedSlotData.startTime,
                  endTime: selectedSlotData.endTime,
                  timezone: 'UTC',
               },
            });

            return response.data;
         } catch (error) {
            console.error("Error in Mutation Function:", error);
            throw error;
         }
      },
      onSuccess: (data) => {
         console.log("Payment Intent Created:", data);
         setClientSecret(data.clientSecret);
         queryClient.invalidateQueries({ queryKey: ["rooms"] });
         queryClient.refetchQueries({ queryKey: ["rooms"] });
      },
      onError: (error) => {
         console.error("Booking Error:", error);
         toast.error("Failed to confirm booking. Please try again.");
      },
   });
   const handleConfirmBooking = () => {
      if (!selectedSlot) {
         toast.error("Please select a slot before confirming.");
         return;
      }
      createBookingMutation.mutate();
   };

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-scroll z-50">
         <div className="bg-white p-6 rounded-lg w-[400px]">
            <h2 className="text-xl font-bold mb-4">{room.name} - Booking</h2>

            <DayPicker
               mode="single"
               selected={selectedDate}
               onSelect={setSelectedDate}
               disabled={(date) => !isDateAvailable(date)}
            />

            {selectedDate && selectedAvailability.length > 0 && (
               <div className="mt-4">
                  <p className="font-semibold">Available Slots:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                     {selectedAvailability.flatMap((availability: any) =>
                        availability.slots
                           .filter((slot: any) => !slot.isBooked) // Only show available slots
                           .map((slot: any) => (
                              <Button
                                 key={slot.id}
                                 className={`px-4 py-2 ${selectedSlot === slot.id ? "bg-green-500" : "bg-gray-300"
                                    }`}
                                 onClick={() => handleSlotSelection(slot.id)}
                              >
                                 {format(new Date(slot.startTime), "HH:mm")}
                              </Button>
                           ))
                     )}
                  </div>
               </div>
            )}

            {clientSecret ? (
               <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm onClose={onClose} />
               </Elements>
            ) : (
               <div className="flex justify-between mt-4">
                  <Button className="bg-red-500 text-white" onClick={onClose}>
                     Close
                  </Button>

                  {selectedSlot && (
                     <>
                        <Button
                           className="bg-yellow-500 text-white"
                           onClick={() => setSelectedSlot(null)}
                        >
                           Clear Slot
                        </Button>

                        <Button
                           className="bg-blue-500 text-white"
                           onClick={handleConfirmBooking}
                           disabled={createBookingMutation.isPending}
                        >
                           {createBookingMutation.isPending
                              ? "Processing..."
                              : "Confirm Booking"}
                        </Button>
                     </>
                  )}
               </div>
            )}
         </div>
      </div>
   );
};

export default BookingModal;
