'use client';
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Search, MapPin, Building2, ExternalLink, Bell, Briefcase, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobsStore } from '@/store/useJobsStore';

export default function JobsPage() {
  const { 
    searchResults, 
    alerts, 
    loading, 
    error, 
    searchJobs, 
    fetchAlerts, 
    markAsRead,
    clearResults 
  } = useJobsStore();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'alerts'>('search');

  useEffect(() => {
    markAsRead();
    if (alerts.length === 0) {
      fetchAlerts();
    }
  }, [markAsRead, fetchAlerts, alerts.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || location.trim()) {
      setActiveTab('search');
      searchJobs(query, location);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const displayedJobs = activeTab === 'search' ? searchResults : alerts;

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <Header title="Job Opportunities" subtitle="Find your next career move" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-12 flex flex-col gap-8">
        
        {/* Search Section */}
        <section className="bg-slate-900 rounded-lg p-10 text-white shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -ml-32 -mb-32" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Discover Jobs</h1>
            </div>
            
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Location (city, state, or country)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                />
              </div>
              <GradientButton type="submit" variant="primary" className="h-14 px-10">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </GradientButton>
            </form>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'search' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Search Results
            {activeTab === 'search' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
              activeTab === 'alerts' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Recommended Alerts
            {alerts.length > 0 && (
              <span className="w-2 h-2 bg-slate-900 rounded-full" />
            )}
            {activeTab === 'alerts' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 min-h-[400px]">
          {loading && activeTab === 'search' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-slate-200 animate-spin" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Searching Indeed...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-50 rounded-lg border border-red-100 text-center">
              <p className="text-red-900 font-bold mb-2">Error connecting to Indeed API</p>
              <p className="text-red-400 text-xs">{error}</p>
              <p className="text-slate-500 text-xs mt-4">Make sure RAPIDAPI_KEY is configured in your .env.local file.</p>
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-200 rounded-lg">
              <Briefcase className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm">No Jobs Found</h3>
              <p className="text-slate-400 text-xs mt-2">Try searching for different keywords or locations.</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4"
            >
              {displayedJobs.map((job, idx) => (
                <motion.div
                  key={job.id || idx}
                  variants={item}
                  className="group bg-white border border-slate-100 p-8 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                          {job.job_title}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <span>{job.company_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {job.formatted_relative_time}
                      </span>
                      <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-slate-900" /> AI Matched
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <a 
                      href={job.job_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      Apply on Indeed <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
