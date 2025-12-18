import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRight, BarChart2, FilePlus, ShieldCheck, Zap, Globe } from 'lucide-react';
import RecentQuestions from '@/components/RecentQuestions';
import { cn } from '@/lib/utils';
export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden bg-slate-950">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.900),theme(colors.slate.950))]" />
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-slate-900/50 shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-32" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-24 sm:py-32 lg:py-40">
              <div className="max-w-3xl">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                  <Badge className="mb-6 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 text-sm">
                    Ministry of Health & Family Welfare
                  </Badge>
                  <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6">
                    Parliament Question <span className="text-[#F38020]">Studio</span>
                  </h1>
                  <p className="text-xl leading-8 text-slate-300 mb-10 max-w-2xl">
                    A unified platform for managing, tracking, and answering parliamentary inquiries with precision and transparency.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button asChild size="lg" className="bg-[#F38020] hover:bg-[#d86d11] text-white px-8 h-14 text-lg shadow-xl shadow-orange-500/20">
                      <Link to="/questions/new">
                        Create Question <FilePlus className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-white border-slate-700 hover:bg-slate-800 h-14 px-8 text-lg">
                      <Link to="/dashboard">
                        Dashboard <BarChart2 className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        {/* Features Grid */}
        <div className="py-16 bg-slate-50 dark:bg-slate-900/50 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, title: "Secure Storage", desc: "All documents and inquiries are stored with enterprise-grade security." },
                { icon: Zap, title: "Real-time Tracking", desc: "Monitor the status of questions from draft to final answer instantly." },
                { icon: Globe, title: "Centralized Hub", desc: "Access all divisions and house inquiries from a single dashboard." }
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-4 p-6 bg-background rounded-2xl border shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {/* Recent Activity */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24">
            <RecentQuestions limit={6} />
          </div>
        </div>
      </main>
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[#F38020]" />
            <span className="font-bold text-white text-xl">SwasthyaQ</span>
          </div>
          <p className="text-sm">© 2024 Ministry of Health. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
            <Link to="/attachments" className="hover:text-white transition-colors">Global Files</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </span>
  );
}