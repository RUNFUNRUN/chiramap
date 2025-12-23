'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import GoogleMap from '@/components/google-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { client } from '@/lib/api-client';

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);

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
      if (!res.ok) return;
      const data = await res.json();
      if (!('lat' in data)) return;
      return data;
    },
    enabled: !!share,
    refetchInterval: 5000,
  });

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
      <div className='absolute top-4 inset-x-0 z-10 flex justify-center pointer-events-none'>
        <Card className='bg-white/90 backdrop-blur-sm shadow-md pointer-events-auto'>
          <div className='flex flex-col items-center gap-0 px-4 py-1.5 min-w-[200px]'>
            <div className='flex items-center gap-2'>
              <span className='relative flex h-2.5 w-2.5'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500'></span>
              </span>
              <p className='text-sm font-bold'>位置情報を共有中</p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-bold text-muted-foreground whitespace-nowrap'>
                最終更新
              </span>
              <span className='text-xs font-bold tabular-nums text-foreground'>
                {location
                  ? new Date(location.timestamp).toLocaleTimeString()
                  : '取得中...'}
              </span>
            </div>
          </div>
        </Card>
      </div>
      <GoogleMap
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
        center={location ? { lat: location.lat, lng: location.lng } : undefined}
        zoom={15}
        markerPosition={
          location ? { lat: location.lat, lng: location.lng } : undefined
        }
      />
    </div>
  );
};

export default Page;
