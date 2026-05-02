import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function HelpButton() {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/help')}
      title="Go to Help Center"
      className="text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="w-5 h-5" />
    </Button>
  );
}