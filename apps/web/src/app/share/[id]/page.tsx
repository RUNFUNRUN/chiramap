'use client';

import { useQuery } from '@tanstack/react-query';
import { use, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapMarker,
  type MapRef,
  Map as MapView,
  MarkerContent,
} from '@/components/ui/map';
import { client } from '@/lib/api-client';

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const mapRef = useRef<MapRef>(null);

  // Fetch share details
  const {
    data: share,
    error: shareError,
    isLoading: shareLoading,
  } = useQuery({
    queryKey: ['share', id],
    queryFn: async () => {
      const res = await client.api.shares[':id'].$get({
        param: { id },
      });
      if (res.status === 404) throw new Error('シェアが見つかりません');
      if (res.status === 410) throw new Error('シェアの有効期限が切れています');
      if (!res.ok) throw new Error('エラーが発生しました');
      const data = await res.json();
      if (!('id' in data)) throw new Error('Invalid response');
      return data;
    },
    retry: false,
  });

  // Poll for location updates
  const { data: location } = useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      const res = await client.api.locations[':shareId'].$get({
        param: { shareId: id },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!('lat' in data)) return null;
      return data;
    },
    enabled: !!share,
    refetchInterval: 5000,
  });

  // Fly to location when it updates
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [location]);

  if (shareLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (shareError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-[350px]'>
          <CardHeader>
            <CardTitle className='text-red-500'>エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{shareError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='relative h-screen w-full'>
      <div className='absolute top-4 left-4 right-4 z-10 flex justify-center pointer-events-none'>
        <Card className='bg-background/90 backdrop-blur-sm pointer-events-auto'>
          <div className='flex flex-col items-center gap-0.5 px-4 min-w-[180px]'>
            <div className='flex items-center gap-2'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-green-500'></span>
              </span>
              <p className='text-sm font-semibold'>位置情報を共有中</p>
            </div>
            <p className='text-xs text-muted-foreground tabular-nums'>
              最終更新:{' '}
              <span className='text-foreground font-medium'>
                {location
                  ? new Date(location.timestamp).toLocaleTimeString()
                  : '取得中...'}
              </span>
            </p>
          </div>
        </Card>
      </div>

      <MapView ref={mapRef} center={[139.7671, 35.6812]} zoom={15}>
        {location && (
          <MapMarker longitude={location.lng} latitude={location.lat}>
            <MarkerContent />
          </MapMarker>
        )}
      </MapView>
    </div>
  );
};

export default Page;
