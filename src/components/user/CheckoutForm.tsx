import React from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
   onClose: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onClose }) => {
   const stripe = useStripe();
   const elements = useElements();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) return;

      const { error, paymentIntent } = await stripe.confirmPayment({
         elements,
         confirmParams: {
            return_url: `${window.location.origin}/home`,
         },
         redirect: 'if_required'
      });

      if (error) {
         console.error(error.message);
         toast.error('Payment failed. Please try again.');
      } else if (paymentIntent?.status === 'succeeded') {
         toast.success('Payment successful!');
         onClose();
      }
   };

   return (
      <form onSubmit={handleSubmit}>
         <PaymentElement />
         <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-green-500 text-white">
               Pay Now
            </Button>
         </div>
      </form>
   );
};

export default CheckoutForm;
