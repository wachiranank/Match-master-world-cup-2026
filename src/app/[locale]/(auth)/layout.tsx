import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Trophy className="h-8 w-8 text-yellow-400" />
        <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          MATCH MASTER
        </span>
      </Link>
      {children}
    </div>
  );
}
