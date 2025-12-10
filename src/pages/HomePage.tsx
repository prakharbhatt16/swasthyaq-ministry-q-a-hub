import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRight, BarChart2, FilePlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Metrics } from '@shared/types';
const Stat = ({ value, label }: { value: number | string; label: string }) => (
  <div className="text-center">
    <p className="text-4xl md:text-5xl font-bold text-white">{value}</p>
    <p className="text-sm text-white/80 uppercase tracking-wider">{label}</p>
  </div>
);
export function HomePage() {
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: () => api('/api/metrics'),
  });
  return (
    <div className="min-h-screen flex flex-col">
      <ThemeToggle className="fixed top-4 right-4" />
      <main className="flex-grow">
        <div className="relative isolate overflow-hidden bg-gray-900">
          <div
            className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]"
            aria-hidden="true"
          >
            <div
              className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#F38020] to-[#667EEA] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-24 sm:py-32 lg:py-40">
              <div className="max-w-2xl mx-auto text-center">
                <motion.h1
                  className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Swasthya<span className="text-[#F38020]">Q</span>
                </motion.h1>
                <motion.p
                  className="mt-6 text-lg leading-8 text-gray-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Ministry Q&A Hub — Streamlining parliamentary questions and answers for the Ministry of Health.
                </motion.p>
                <motion.div
                  className="mt-10 flex items-center justify-center gap-x-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Button asChild size="lg" className="bg-[#F38020] hover:bg-[#d86d11] text-white shadow-lg hover:-translate-y-0.5 transition-transform">
                    <Link to="/questions/new">
                      Create a Question <FilePlus className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 hover:text-white">
                    <Link to="/dashboard">
                      View Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Section */}
        <div className="bg-gray-800 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-8">
              <Stat value={metrics?.totalQuestions ?? '...'} label="Total Questions" />
              <Stat value={metrics?.byStatus.find(s => s.status === 'Answered')?.count ?? '...'} label="Answered" />
              <Stat value={metrics?.totalAttachments ?? '...'} label="Attachments" />
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-900 text-center py-6">
        <p className="text-sm text-gray-400">Built with ❤️ at Cloudflare</p>
      </footer>
    </div>
  );
}