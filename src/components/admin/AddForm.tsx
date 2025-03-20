import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'react-hot-toast';

// Define the schema for form validation using zod
const roomSchema = z.object({
   name: z.string().min(3, 'Room name must be at least 3 characters'),
   capacity: z.number().min(1, 'Capacity must be at least 1'),
   location: z.string().min(3, 'Location is required'),
   timezone: z.string().default('UTC'),
});

// Infer the form data type from the schema
type RoomFormData = z.infer<typeof roomSchema>;

// Define the type for availability state
type Availability = Record<string, Record<string, boolean>>;

export default function RoomForm() {
   const [availability, setAvailability] = useState<Availability>({});

   const { register, handleSubmit, formState: { errors }, reset } = useForm<RoomFormData>({
      resolver: zodResolver(roomSchema),
   });

   const handleAvailabilityChange = (day: string, timeSlot: string) => {
      setAvailability((prev) => ({
         ...prev,
         [day]: { ...prev[day], [timeSlot]: !prev[day]?.[timeSlot] },
      }));
   };

   const onSubmit = async (data: RoomFormData) => {
      const roomData = { ...data, availability };
      console.log(roomData);

      try {
         const res = await axios.post('/api/create-rooms', roomData);

         toast.success(res.data.message || 'Room created successfully!');
         reset();
         setAvailability({});
      } catch (error) {
         if (axios.isAxiosError(error)) {
            toast.error(
               error.response?.data?.error || 'Failed to create room'
            );
         } else {
            toast.error('Something went wrong! Please try again.');
         }
      }
   };

   const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
   const timeSlots = Array.from({ length: 12 }, (_, i) => `${12 + i % 12}:00 ${i < 12 ? 'PM' : 'AM'}`);

   return (
      <Card>
         <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
               <Label>Room Name</Label>
               <Input {...register('name')} />
               {errors.name && <p>{errors.name.message}</p>}

               <Label>Capacity</Label>
               <Input type="number" {...register('capacity', { valueAsNumber: true })} />
               {errors.capacity && <p>{errors.capacity.message}</p>}

               <Label>Location</Label>
               <Input {...register('location')} />
               {errors.location && <p>{errors.location.message}</p>}

               <Label>Availability</Label>
               <div className="grid grid-cols-8 gap-2">
                  <div></div>
                  {days.map((day) => (
                     <div key={day} className="font-bold text-center">{day}</div>
                  ))}
                  {timeSlots.map((slot) => (
                     <>
                        <div key={`label-${slot}`} className="font-medium">{slot}</div>
                        {days.map((day) => (
                           <input
                              aria-label='Availability'
                              key={`${day}-${slot}`}
                              type="checkbox"
                              checked={!!availability[day]?.[slot]}
                              onChange={() => handleAvailabilityChange(day, slot)}
                           />
                        ))}
                     </>
                  ))}
               </div>

               <Button type="submit">Add Room</Button>
            </form>
         </CardContent>
      </Card>
   );
}