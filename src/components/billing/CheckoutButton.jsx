import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function CheckoutButton({ plan, campaignId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    // Check if running in iframe (published vs preview)
    if (window.self !== window.top) {
      alert('Checkout only works from published app. Please publish your app first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/functions/createCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, plan }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-2">
        <Button variant="outline" disabled className="w-full">
          {loading ? 'Processing...' : 'Checkout'}
        </Button>
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      </div>
    );
  }

  return (
    <Button
      className="w-full"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? 'Redirecting to Stripe...' : 'Upgrade Now'}
    </Button>
  );
}