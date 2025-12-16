/**
 * Success Page Component
 * Shown after successful registration
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF9933]/5 via-white to-[#138808]/5 py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#138808] text-white">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-semibold">Registration Successful!</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Thank you for registering your Gram Panchayat. Your application has been submitted
            successfully and is now under review.
          </p>
          <div className="mb-8 rounded-lg border border-[#FF9933] bg-[#FF9933]/5 p-6 text-left">
            <h3 className="mb-4 text-[#FF9933]">What happens next?</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Our team will verify your documents within 2-3 business days</li>
              <li>✓ You will receive an email confirmation once verified</li>
              <li>✓ Your subdomain will be activated automatically</li>
              <li>✓ You can then login to your dashboard and start managing content</li>
            </ul>
          </div>
          <div className="mb-4 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Your panchayat will be available at:</p>
            <p className="mt-1 text-xl text-[#FF9933]">
              yourpanchayat.egramseva.gov.in
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#FF9933] hover:bg-[#FF9933]/90"
            >
              Go to Login
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

