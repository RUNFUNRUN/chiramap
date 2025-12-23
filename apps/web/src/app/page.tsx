'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ActiveShareCard from '@/components/active-share-card';
import CreateShareDialog from '@/components/create-share-dialog';
import GoogleMap from '@/components/google-map';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { client } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

const Home = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [viewState, setViewState] = useState<{
    center?: { lat: number; lng: number };
    zoom?: number;
  }>({});

  // Query for active share
  const { data: activeShare } = useQuery({
    queryKey: ['activeShare'],
    queryFn: async () => {
      const res = await client.api.shares.active.$get();
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user,
    refetchInterval: (query) => {
      // Poll every 5 seconds if we have an active share to check for expiration
      // Stop polling if no active share (or if query.state.data is null)
      return query.state.data ? 5000 : false;
    },
  });

  // Get current location on mount/login
  useEffect(() => {
    if (!session?.user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState((prev) => ({
            ...prev,
            center: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        },
      );
    }
  }, [session?.user]);

  // Mutation for creating share
  const createShareMutation = useMutation({
    mutationFn: async (durationMinutes: number) => {
      const res = await client.api.shares.$post({
        json: { expiresIn: durationMinutes },
      });
      if (!res.ok) throw new Error('Failed to create share');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['activeShare'], data);
    },
  });

  // Mutation for stopping share
  const stopShareMutation = useMutation({
    mutationFn: async () => {
      if (!activeShare) return;
      const res = await client.api.shares[':id'].active.$put({
        param: { id: activeShare.id },
        json: { active: false },
      });
      if (!res.ok) throw new Error('Failed to stop share');
    },
    onSuccess: () => {
      queryClient.setQueryData(['activeShare'], null);
    },
  });

  // Mutation for updating location
  const updateLocationMutation = useMutation({
    mutationFn: async (data: {
      shareId: string;
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
    }) => {
      const res = await client.api.locations.$post({ json: data });
      if (!res.ok) throw new Error('Failed to update location');
      return res.json();
    },
  });

  const handleLogin = async () => {
    setLoading(true);
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin,
    });
  };

  const handleLogout = async () => {
    await authClient.signOut();
  };

  // Location tracking effect
  useEffect(() => {
    if (!activeShare) return;

    let watchId: number;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed, accuracy } =
            position.coords;

          // Also update map view to follow user when sharing
          setViewState((prev) => ({
            ...prev,
            center: { lat: latitude, lng: longitude },
          }));

          updateLocationMutation.mutate({
            shareId: activeShare.id,
            lat: latitude,
            lng: longitude,
            heading: heading ?? undefined,
            speed: speed ?? undefined,
            accuracy: accuracy ?? undefined,
          });
        },
        (error) => console.error('Geolocation error', error),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        },
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeShare, updateLocationMutation.mutate]);

  return (
    <div className='relative h-svh w-full overflow-hidden'>
      {/* Background Map */}
      <div className='absolute inset-0 z-0'>
        {apiKey ? (
          <GoogleMap
            apiKey={apiKey}
            center={viewState.center}
            zoom={viewState.zoom}
          />
        ) : (
          <div className='flex h-full items-center justify-center bg-muted text-muted-foreground'>
            Map API Key Missing
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className='pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-4'>
        <div className='pointer-events-auto w-full max-w-md'>
          {activeShare ? (
            <div className='flex flex-col gap-4'>
              <ActiveShareCard
                shareUrl={`${window.location.origin}/share/${activeShare.id}`}
                expiresAt={new Date(activeShare.expiresAt)}
                onStopSharing={() => stopShareMutation.mutateAsync()}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            <Card className='border-0 shadow-xl backdrop-blur-sm bg-background/90'>
              <CardHeader className='text-center'>
                <CardTitle className='text-3xl font-extrabold tracking-tight'>
                  Chiramap
                </CardTitle>
                <CardDescription className='text-lg'>
                  {session?.user ? (
                    <span>ようこそ、{session.user.name ?? 'ゲスト'}さん</span>
                  ) : (
                    <>
                      10秒で、今の場所を教える。
                      <br />
                      登録不要の「チラ見せ」位置共有アプリ。
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                {session?.user ? (
                  <div className='flex flex-col gap-3'>
                    <CreateShareDialog
                      onCreate={async (duration) => {
                        await createShareMutation.mutateAsync(duration);
                      }}
                    />
                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={handleLogout}
                    >
                      ログアウト
                    </Button>
                  </div>
                ) : (
                  <Button
                    size='lg'
                    className='w-full text-lg font-bold'
                    onClick={handleLogin}
                    disabled={loading || isPending}
                  >
                    {loading || isPending
                      ? '読み込み中...'
                      : 'Googleでログインして始める'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
