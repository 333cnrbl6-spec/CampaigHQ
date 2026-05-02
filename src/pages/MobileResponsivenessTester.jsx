import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Eye, Copy, Check } from 'lucide-react';

export default function MobileResponsivenessTester() {
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState('iphone12');

  const devices = {
    iphone12: { name: 'iPhone 12', width: 390, height: 844 },
    iphone14: { name: 'iPhone 14 Pro', width: 393, height: 852 },
    ipad: { name: 'iPad', width: 768, height: 1024 },
    android: { name: 'Android (Galaxy S21)', width: 360, height: 800 },
    desktop: { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
  };

  const currentDevice = devices[viewport];

  const testPages = [
    '/dashboard',
    '/contacts',
    '/field-mode',
    '/map',
    '/leaderboard',
    '/billing',
    '/launch-checklist',
  ];

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold flex items-center gap-2">
            <Smartphone className="w-8 h-8" />
            Mobile Responsiveness Tester
          </h1>
          <p className="text-muted-foreground">Test the app on different devices and screen sizes</p>
        </div>

        {/* Device Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Device Viewport
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(devices).map(([key, device]) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    viewport === key
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {device.name}
                </button>
              ))}
            </div>

            {/* Current Viewport Info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                Simulating: <span className="font-semibold">{currentDevice.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {currentDevice.width}px × {currentDevice.height}px
              </p>
            </div>

            {/* Browser DevTools Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 Alternative: Use Browser DevTools</p>
              <p className="text-xs text-blue-700 mb-2">
                Open DevTools (F12) and click the device toggle button to test responsive design directly.
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>Chrome: F12 → Toggle device toolbar (Ctrl+Shift+M)</p>
                <p>Firefox: F12 → Responsive Design Mode (Ctrl+Shift+M)</p>
                <p>Safari: Enable developer menu in Preferences → Use Responsive Design Mode</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Pages to Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testPages.map(page => (
                <a
                  key={page}
                  href={page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-muted hover:border-primary hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono text-primary">{page}</code>
                    <Badge variant="outline">Open</Badge>
                  </div>
                </a>
              ))}
            </div>

            {/* Testing Checklist */}
            <div className="mt-6 bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm mb-3">Mobile Testing Checklist:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Layout doesn't overflow or distort</li>
                <li>✓ Text is readable (no tiny fonts)</li>
                <li>✓ Buttons are large enough to tap (44px minimum)</li>
                <li>✓ Forms work without horizontal scrolling</li>
                <li>✓ Images scale properly</li>
                <li>✓ Navigation menu is mobile-optimized</li>
                <li>✓ Maps and modals display correctly</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Share */}
        <Card>
          <CardHeader>
            <CardTitle>Share Testing Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Share this link with your team to test on their devices:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyUrl}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}