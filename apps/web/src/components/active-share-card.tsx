'use client';

import { Check, Copy, MapPinOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ActiveShareCardProps {
  shareUrl: string;
  expiresAt: Date;
  onStopSharing: () => Promise<void>;
  onLogout?: () => Promise<void>;
}

const ActiveShareCard = ({
  shareUrl,
  expiresAt,
  onStopSharing,
  onLogout,
}: ActiveShareCardProps) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  // ... (keep existing checkScroll and useEffects)
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftGradient(scrollLeft > 0);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1); // -1 for rounding tolerance
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy API key: ', err);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await onStopSharing();
    } catch (err) {
      console.error('Failed to stop sharing: ', err);
    } finally {
      setLoading(false);
    }
  };

  const remainingMinutes = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000),
  );

  return (
    <Card className='w-full max-w-md border-0 shadow-xl backdrop-blur-sm bg-background/90'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl font-bold flex items-center justify-center gap-2'>
          <span className='relative flex h-3 w-3'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-3 w-3 bg-green-500'></span>
          </span>
          位置情報を共有中
        </CardTitle>
        <CardDescription>
          あと約{remainingMinutes}分で自動的に終了します
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center space-x-2'>
          <div className='grid flex-1 gap-2 min-w-0'>
            <div className='relative flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background overflow-hidden'>
              <div
                ref={scrollRef}
                onScroll={checkScroll}
                className='w-full overflow-x-auto whitespace-nowrap scrollbar-hide'
              >
                {shareUrl}
              </div>
              {showLeftGradient && (
                <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none' />
              )}
              {showRightGradient && (
                <div className='absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none' />
              )}
            </div>
          </div>
          <Button type='submit' size='icon' onClick={handleCopy}>
            {copied ? (
              <Check className='h-4 w-4 text-green-500' />
            ) : (
              <Copy className='h-4 w-4' />
            )}
            <span className='sr-only'>Copy</span>
          </Button>
        </div>
      </CardContent>
      <CardFooter className='flex flex-col gap-0'>
        <Button
          variant='destructive'
          className='w-full font-bold'
          onClick={handleStop}
          disabled={loading}
        >
          <MapPinOff className='mr-2 h-4 w-4' />
          {loading ? '停止中...' : '共有を停止する'}
        </Button>
        {onLogout && (
          <div className='w-full pt-4 mt-2'>
            <Button
              variant='outline'
              className='w-full text-muted-foreground hover:text-foreground'
              onClick={onLogout}
            >
              ログアウト
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ActiveShareCard;
