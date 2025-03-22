"use client";
import { useEffect, useState } from "react";

const DetectTimezone = () => {
   // const { userId } = useAuth();
   const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);

   useEffect(() => {
      if (typeof window !== "undefined") {
         // Ensure this runs only on the client
         const storedTimezone = localStorage.getItem("timeZone") || Intl.DateTimeFormat().resolvedOptions().timeZone;
         setSelectedTimezone(storedTimezone);
      }
   }, []);

   return {selectedTimezone}

   // useEffect(() => {
   //    if (!userId || !selectedTimezone) return;

   //    localStorage.setItem("timeZone", selectedTimezone);

   //    axios.post("/api/updateTZ", { userId, timezone: selectedTimezone })
   //       .then(() => toast.success(`Timezone updated to ${selectedTimezone}`))
   //       .catch(() => toast.error("Failed to update timezone"));
   // }, [selectedTimezone, userId]);

   // if (!selectedTimezone) return null;

   // return (
   //    <div className="w-3/4">
   //       <TimezoneSelect

   //          value={selectedTimezone}
   //          onChange={(tz) => setSelectedTimezone(tz.value)}
   //       />
   //    </div>
   // );
};

export default DetectTimezone;
