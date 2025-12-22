import GoogleMap from '@/components/google-map';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Home = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className='relative h-svh w-full overflow-hidden'>
      {/* Background Map */}
      <div className='absolute inset-0 z-0'>
        {apiKey ? (
          <GoogleMap apiKey={apiKey} />
        ) : (
          <div className='flex h-full items-center justify-center bg-muted text-muted-foreground'>
            Map API Key Missing
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className='pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-4'>
        <div className='pointer-events-auto w-full max-w-md'>
          <Card className='border-0 shadow-xl backdrop-blur-sm bg-background/90'>
            <CardHeader className='text-center'>
              <CardTitle className='text-3xl font-extrabold tracking-tight'>
                Chiramap
              </CardTitle>
              <CardDescription className='text-lg'>
                10秒で、今の場所を教える。
                <br />
                登録不要の「チラ見せ」位置共有アプリ。
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <Button size='lg' className='w-full text-lg font-bold'>
                Googleでログインして始める
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
