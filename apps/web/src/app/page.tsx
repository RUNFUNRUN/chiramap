'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import ActiveShareCard from '@/components/active-share-card';
import CreateShareDialog from '@/components/create-share-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  MapMarker,
  type MapRef,
  Map as MapView,
  MarkerContent,
} from '@/components/ui/map';
import { client } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

const Home = () => {
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const mapRef = useRef<MapRef>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          // Fly to user's location
          mapRef.current?.flyTo({
            center: [newLocation.lng, newLocation.lat],
            zoom: 15,
            duration: 1500,
          });
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

          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);

          // Pan map to follow user when sharing
          mapRef.current?.panTo([longitude, latitude]);

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
        <MapView ref={mapRef} center={[139.7671, 35.6812]} zoom={15}>
          {currentLocation && (
            <MapMarker
              longitude={currentLocation.lng}
              latitude={currentLocation.lat}
            >
              <MarkerContent />
            </MapMarker>
          )}
        </MapView>
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
            <Card className='backdrop-blur-sm bg-background/90'>
              <CardHeader className='text-center pb-2'>
                <CardTitle className='text-3xl font-extrabold tracking-tight'>
                  Chiramap
                </CardTitle>
                <CardDescription className='text-base leading-relaxed'>
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
              <CardContent className='pt-2'>
                {session?.user ? (
                  <div className='flex flex-col gap-3'>
                    <CreateShareDialog
                      onCreate={async (duration) => {
                        await createShareMutation.mutateAsync(duration);
                      }}
                    />
                    <Button
                      variant='ghost'
                      className='w-full text-muted-foreground hover:text-foreground'
                      onClick={handleLogout}
                    >
                      ログアウト
                    </Button>
                  </div>
                ) : (
                  <Button
                    size='lg'
                    className='w-full font-semibold'
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
