'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Printer, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  PlusCircle,
  Layout,
  Settings,
  ChevronDown,
  ChevronUp,
  User,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for structured Resume details
interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

interface EducationItem {
  id: string;
  degree: string;
  school: string;
  duration: string;
  details: string;
}

interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
}

type TemplateType = 'minimalist' | 'tech' | 'executive';

export default function ResumeBuilder() {
  // 1. Structured State Data (default values populated with high-quality tech details)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: 'Vedansh Derashri',
    jobTitle: 'Senior Full Stack Engineer',
    email: 'vedansh@mockmate.io',
    phone: '+1 (555) 382-9012',
    location: 'San Francisco, CA',
    website: 'github.com/vedansh',
    linkedin: 'linkedin.com/in/vedansh'
  });

  const [summary, setSummary] = useState(
    'Dynamic Full Stack Engineer with 5+ years of experience specializing in high-performance Next.js architectures, real-time AI interface development, and cloud scalability. Proven track record of spearheading premium SaaS visual overhauls and accelerating engineering velocity by 30%.'
  );

  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      id: '1',
      role: 'Senior Software Engineer',
      company: 'Mockmate AI',
      duration: '2024 - Present',
      description: 'Architected real-time dashboard visualization layers and local database caching mesh, boosting page loading speeds by 40%. Engineered custom Next.js integrations for LLM models.'
    },
    {
      id: '2',
      role: 'Full Stack Engineer',
      company: 'Vercelify Systems',
      duration: '2021 - 2024',
      description: 'Led a team of 4 to refactor core enterprise dashboards, optimizing modular components and lowering layout shift (CLS) by 60%. Developed modular REST/GraphQL microservices in Go.'
    }
  ]);

  const [education, setEducation] = useState<EducationItem[]>([
    {
      id: '1',
      degree: 'Bachelor of Science in Computer Science',
      school: 'UC Berkeley',
      duration: '2017 - 2021',
      details: 'Graduated with Honors. Specialization in Human-Computer Interaction & Cloud Systems.'
    }
  ]);

  const [skills, setSkills] = useState<string[]>([
    'Next.js', 'React', 'TypeScript', 'Node.js', 'Go', 'Python', 'TailwindCSS', 'System Design', 'AI Integration', 'REST/GraphQL'
  ]);
  const [skillInput, setSkillInput] = useState('');

  // UI accordion controls
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [template, setTemplate] = useState<TemplateType>('tech');

  // Interactive additions & removals
  const handleAddExperience = () => {
    const newItem: ExperienceItem = {
      id: Date.now().toString(),
      role: 'Software Engineer',
      company: 'New Company',
      duration: '2024',
      description: 'Describe your key contributions and projects here...'
    };
    setExperiences([...experiences, newItem]);
  };

  const handleUpdateExperience = (id: string, field: keyof ExperienceItem, value: string) => {
    setExperiences(experiences.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences(experiences.filter(item => item.id !== id));
  };

  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: Date.now().toString(),
      degree: 'Degree / Major',
      school: 'University',
      duration: 'Year - Year',
      details: 'GPA, key coursework, activities'
    };
    setEducation([...education, newItem]);
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setEducation(education.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDeleteEducation = (id: string) => {
    setEducation(education.filter(item => item.id !== id));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(skills.filter(s => s !== skillToDelete));
  };

  // Pixel-perfect browser printing
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#F5F5F4] font-inter">
      {/* Dynamic Printing Style overrides (only prints the A4 page layout) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar, header, the left panel, and print button overlays */
          aside, header, footer, .no-print, button {
            display: none !important;
          }
          
          /* Normalize page and main body wrappers for paper rendering */
          html, body, main {
            background: white !important;
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
          }

          /* Force A4 print area to take complete viewport space cleanly */
          #resume-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0.5cm !important;
            margin: 0 !important;
            background: white !important;
            z-index: 99999 !important;
          }
        }
      `}} />

      <Header title="Resume Builder" subtitle="Create and customize your professional resume" />

      <main className="flex-1 w-full px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT PANEL: Section inputs editor */}
          <div className="w-full lg:w-5/12 flex flex-col gap-6 no-print">
            
            {/* Template Selector Card */}
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#111827]">
                <Layout className="w-4 h-4 text-[#635BFF]" />
                <span className="text-xs font-black uppercase tracking-wider">Select Style Template</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'minimalist', label: 'Minimalist' },
                  { id: 'tech', label: 'Sleek Tech' },
                  { id: 'executive', label: 'Executive' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTemplate(item.id as TemplateType)}
                    className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                      template === item.id 
                        ? 'bg-[#635BFF] text-white border-transparent shadow-sm'
                        : 'bg-white border-[#E7E5E4] text-[#6B7280] hover:bg-[#F5F5F4]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={handleTriggerPrint}
                className="w-full py-3 bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[#635BFF]/10 active:scale-95"
              >
                <Printer className="w-4 h-4" /> Save as PDF / Print
              </button>
            </div>

            {/* Inputs Accordion Sections */}
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              
              {/* Personal Details */}
              <div className="border-b border-[#E7E5E4] pb-3">
                <button
                  onClick={() => setActiveTab(activeTab === 'personal' ? '' : 'personal')}
                  className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-[#111827]"
                >
                  <span className="flex items-center gap-2"><User className="w-4 h-4 text-[#635BFF]" /> Personal Info</span>
                  {activeTab === 'personal' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {activeTab === 'personal' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-[#6B7280] uppercase">Full Name</label>
                          <input 
                            type="text" 
                            value={personalInfo.fullName}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                            className="p-2.5 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-[#6B7280] uppercase">Title</label>
                          <input 
                            type="text" 
                            value={personalInfo.jobTitle}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })}
                            className="p-2.5 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-[#6B7280] uppercase">Email</label>
                          <input 
                            type="email" 
                            value={personalInfo.email}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                            className="p-2.5 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-[#6B7280] uppercase">Phone</label>
                          <input 
                            type="text" 
                            value={personalInfo.phone}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                            className="p-2.5 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-[#6B7280] uppercase">Location</label>
                          <input 
                            type="text" 
                            value={personalInfo.location}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                            className="p-2.5 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none" 
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[9px] font-bold text-[#6B7280] uppercase">Portfolio URL</label>
                          <input 
                            type="text" 
                            value={personalInfo.website}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                            className="p-2.5 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none" 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Summary */}
              <div className="border-b border-[#E7E5E4] pb-3">
                <button
                  onClick={() => setActiveTab(activeTab === 'summary' ? '' : 'summary')}
                  className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-[#111827]"
                >
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#635BFF]" /> Summary</span>
                  {activeTab === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {activeTab === 'summary' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full h-28 p-3 text-xs border border-[#E7E5E4] rounded-xl focus:border-[#635BFF] focus:outline-none resize-none font-medium text-[#111827]"
                        placeholder="Write a compelling executive statement..."
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Experience */}
              <div className="border-b border-[#E7E5E4] pb-3">
                <button
                  onClick={() => setActiveTab(activeTab === 'experience' ? '' : 'experience')}
                  className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-[#111827]"
                >
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#635BFF]" /> Experience</span>
                  {activeTab === 'experience' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {activeTab === 'experience' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-4"
                    >
                      {experiences.map((item, idx) => (
                        <div key={item.id} className="p-3 bg-[#F5F5F4]/40 border border-[#E7E5E4] rounded-xl flex flex-col gap-2 relative">
                          <button
                            onClick={() => handleDeleteExperience(item.id)}
                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="text-[9px] font-black text-[#635BFF] uppercase mb-1">Position #{idx + 1}</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.role}
                              placeholder="Role / Title"
                              onChange={(e) => handleUpdateExperience(item.id, 'role', e.target.value)}
                              className="p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                            />
                            <input
                              type="text"
                              value={item.company}
                              placeholder="Company"
                              onChange={(e) => handleUpdateExperience(item.id, 'company', e.target.value)}
                              className="p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                            />
                          </div>
                          
                          <input
                            type="text"
                            value={item.duration}
                            placeholder="Duration (e.g. 2024 - Present)"
                            onChange={(e) => handleUpdateExperience(item.id, 'duration', e.target.value)}
                            className="p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                          />
                          
                          <textarea
                            value={item.description}
                            placeholder="Describe contributions..."
                            onChange={(e) => handleUpdateExperience(item.id, 'description', e.target.value)}
                            className="p-2 h-16 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none resize-none"
                          />
                        </div>
                      ))}
                      
                      <button
                        onClick={handleAddExperience}
                        className="w-full py-2 bg-[#635BFF]/5 hover:bg-[#635BFF]/10 border border-dashed border-[#635BFF]/25 text-[#635BFF] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Professional Role
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Education */}
              <div className="border-b border-[#E7E5E4] pb-3">
                <button
                  onClick={() => setActiveTab(activeTab === 'education' ? '' : 'education')}
                  className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-[#111827]"
                >
                  <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#635BFF]" /> Education</span>
                  {activeTab === 'education' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {activeTab === 'education' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-4"
                    >
                      {education.map((item, idx) => (
                        <div key={item.id} className="p-3 bg-[#F5F5F4]/40 border border-[#E7E5E4] rounded-xl flex flex-col gap-2 relative">
                          <button
                            onClick={() => handleDeleteEducation(item.id)}
                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="text-[9px] font-black text-[#635BFF] uppercase mb-1">Education #{idx + 1}</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.degree}
                              placeholder="Degree / Major"
                              onChange={(e) => handleUpdateEducation(item.id, 'degree', e.target.value)}
                              className="p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                            />
                            <input
                              type="text"
                              value={item.school}
                              placeholder="School / University"
                              onChange={(e) => handleUpdateEducation(item.id, 'school', e.target.value)}
                              className="p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                            />
                          </div>
                          
                          <input
                            type="text"
                            value={item.duration}
                            placeholder="Duration (e.g. 2017 - 2021)"
                            onChange={(e) => handleUpdateEducation(item.id, 'duration', e.target.value)}
                            className="p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                          />
                          
                          <textarea
                            value={item.details}
                            placeholder="GPA, Key Achievements..."
                            onChange={(e) => handleUpdateEducation(item.id, 'details', e.target.value)}
                            className="p-2 h-12 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none resize-none"
                          />
                        </div>
                      ))}
                      
                      <button
                        onClick={handleAddEducation}
                        className="w-full py-2 bg-[#635BFF]/5 hover:bg-[#635BFF]/10 border border-dashed border-[#635BFF]/25 text-[#635BFF] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Education
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Skills */}
              <div className="pb-2">
                <button
                  onClick={() => setActiveTab(activeTab === 'skills' ? '' : 'skills')}
                  className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-[#111827]"
                >
                  <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-[#635BFF]" /> Skills</span>
                  {activeTab === 'skills' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {activeTab === 'skills' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-3"
                    >
                      <form onSubmit={handleAddSkill} className="flex gap-2">
                        <input
                          type="text"
                          value={skillInput}
                          placeholder="Type skill & press Enter"
                          onChange={(e) => setSkillInput(e.target.value)}
                          className="flex-1 p-2 text-[11px] border border-[#E7E5E4] rounded-lg focus:border-[#635BFF] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="py-2 px-3 bg-[#635BFF] hover:bg-[#7C74FF] text-white text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                      
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-[#F5F5F4]/30 border border-[#E7E5E4] rounded-xl">
                        {skills.map((skill, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-1 px-2 py-1 bg-white border border-[#E7E5E4] text-[#111827] text-[10px] font-medium rounded-lg group"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSkill(skill)}
                              className="text-[#6B7280] hover:text-red-500 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

          {/* RIGHT PANEL: Live Visual A4 Preview Sheet */}
          <div className="w-full lg:w-7/12 flex items-center justify-center sticky top-24">
            <div 
              id="resume-preview"
              className="w-full max-w-[780px] min-h-[1050px] bg-white border border-[#E7E5E4] rounded-2xl shadow-md p-10 font-sans text-[#111827] flex flex-col justify-between"
            >
              
              {/* 2.1 TEMPLATE RENDERING: Minimalist centered styling */}
              {template === 'minimalist' && (
                <div className="space-y-6 flex-1">
                  {/* Header info */}
                  <div className="text-center space-y-2 border-b border-[#E7E5E4] pb-6">
                    <h1 className="text-3xl font-serif font-black tracking-tight text-[#111827] uppercase">{personalInfo.fullName || 'Candidate Name'}</h1>
                    <p className="text-xs font-bold text-[#635BFF] uppercase tracking-widest">{personalInfo.jobTitle || 'Role Title'}</p>
                    
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-[#6B7280] font-medium pt-1">
                      {personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {personalInfo.email}</span>}
                      {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {personalInfo.phone}</span>}
                      {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {personalInfo.location}</span>}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-[#6B7280] font-medium">
                      {personalInfo.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {personalInfo.website}</span>}
                      {personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {personalInfo.linkedin}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-serif font-black uppercase tracking-wider text-[#635BFF] border-b border-[#E7E5E4] pb-1">Professional Summary</h2>
                      <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap font-medium">{summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {experiences.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-serif font-black uppercase tracking-wider text-[#635BFF] border-b border-[#E7E5E4] pb-1">Professional Experience</h2>
                      <div className="space-y-4">
                        {experiences.map(item => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-black text-[#111827]">{item.role} <span className="font-medium text-[#6B7280]">at {item.company}</span></h3>
                              <span className="text-[10px] text-[#6B7280] font-bold whitespace-nowrap">{item.duration}</span>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap font-medium">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xs font-serif font-black uppercase tracking-wider text-[#635BFF] border-b border-[#E7E5E4] pb-1">Education</h2>
                      <div className="space-y-3">
                        {education.map(item => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-black text-[#111827]">{item.degree}</h3>
                              <span className="text-[10px] text-[#6B7280] font-bold whitespace-nowrap">{item.duration}</span>
                            </div>
                            <p className="text-[11px] font-bold text-[#6B7280] leading-none">{item.school}</p>
                            <p className="text-[10px] text-[#6B7280] leading-relaxed font-medium mt-1">{item.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="text-xs font-serif font-black uppercase tracking-wider text-[#635BFF] border-b border-[#E7E5E4] pb-1">Core Competencies</h2>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {skills.map((skill, i) => (
                          <span key={i} className="text-[10px] font-bold text-[#6B7280] bg-[#F5F5F4] px-2 py-0.5 border border-[#E7E5E4] rounded-md">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2.2 TEMPLATE RENDERING: Sleek Tech alignment */}
              {template === 'tech' && (
                <div className="space-y-6 flex-1">
                  {/* Title Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#18181B] pb-6 gap-4">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-black tracking-tight text-[#111827] leading-none font-display">{personalInfo.fullName || 'Candidate Name'}</h1>
                      <p className="text-xs font-black text-[#635BFF] uppercase tracking-widest">{personalInfo.jobTitle || 'Role Title'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-[#6B7280] font-bold uppercase tracking-wider self-start md:self-end">
                      {personalInfo.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#635BFF]" /> {personalInfo.email}</span>}
                      {personalInfo.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#635BFF]" /> {personalInfo.phone}</span>}
                      {personalInfo.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#635BFF]" /> {personalInfo.location}</span>}
                      {personalInfo.website && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[#635BFF]" /> {personalInfo.website}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <div className="w-1.5 h-3.5 bg-[#635BFF] rounded-full" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-[#111827]">Executive Profile</h2>
                      </div>
                      <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap font-medium">{summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {experiences.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <div className="w-1.5 h-3.5 bg-[#635BFF] rounded-full" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-[#111827]">Technical Experience</h2>
                      </div>
                      <div className="space-y-4">
                        {experiences.map(item => (
                          <div key={item.id} className="space-y-1.5">
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-black text-[#111827] uppercase tracking-wide">
                                {item.role} <span className="text-[#635BFF] font-black">@ {item.company}</span>
                              </h3>
                              <span className="text-[10px] text-[#6B7280] font-black uppercase tracking-wider whitespace-nowrap">{item.duration}</span>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap font-medium">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <div className="w-1.5 h-3.5 bg-[#635BFF] rounded-full" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-[#111827]">Education</h2>
                      </div>
                      <div className="space-y-3">
                        {education.map(item => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-black text-[#111827] uppercase tracking-wide">{item.degree}</h3>
                              <span className="text-[10px] text-[#6B7280] font-black uppercase tracking-wider whitespace-nowrap">{item.duration}</span>
                            </div>
                            <p className="text-[10px] font-bold text-[#635BFF] uppercase tracking-wide leading-none">{item.school}</p>
                            <p className="text-[10px] text-[#6B7280] leading-relaxed font-medium mt-1">{item.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <div className="w-1.5 h-3.5 bg-[#635BFF] rounded-full" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-[#111827]">Technologies & Skills</h2>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {skills.map((skill, i) => (
                          <span key={i} className="text-[9px] font-black uppercase tracking-wider text-white bg-[#18181B] px-2.5 py-1 rounded-md">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2.3 TEMPLATE RENDERING: Executive asymmetric dual column */}
              {template === 'executive' && (
                <div className="grid grid-cols-12 gap-8 flex-1">
                  
                  {/* Left Column (Metadata/Skills) */}
                  <div className="col-span-4 bg-[#F5F5F4]/40 border-r border-[#E7E5E4] pr-6 flex flex-col gap-6 -my-10 py-10">
                    <div className="space-y-1">
                      <h1 className="text-xl font-serif font-black tracking-tight text-[#111827]">{personalInfo.fullName || 'Candidate Name'}</h1>
                      <p className="text-[9px] font-black text-[#635BFF] uppercase tracking-wider">{personalInfo.jobTitle || 'Role'}</p>
                    </div>

                    <div className="space-y-3 border-t border-[#E7E5E4] pt-4">
                      <span className="text-[9px] font-black text-[#111827] uppercase tracking-widest">Contact Info</span>
                      <div className="flex flex-col gap-2.5 text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">
                        {personalInfo.email && <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-[#635BFF] shrink-0" /> {personalInfo.email}</span>}
                        {personalInfo.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#635BFF] shrink-0" /> {personalInfo.phone}</span>}
                        {personalInfo.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#635BFF] shrink-0" /> {personalInfo.location}</span>}
                        {personalInfo.website && <span className="flex items-center gap-1.5 truncate"><Globe className="w-3.5 h-3.5 text-[#635BFF] shrink-0" /> {personalInfo.website}</span>}
                      </div>
                    </div>

                    {skills.length > 0 && (
                      <div className="space-y-3 border-t border-[#E7E5E4] pt-4">
                        <span className="text-[9px] font-black text-[#111827] uppercase tracking-widest">Key Expertise</span>
                        <div className="flex flex-col gap-1.5">
                          {skills.map((skill, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#6B7280] font-semibold">
                              <div className="w-1 h-1 bg-[#635BFF] rounded-full" /> {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Experience/Education) */}
                  <div className="col-span-8 space-y-6">
                    {/* Summary */}
                    {summary && (
                      <div className="space-y-2">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-[#635BFF]">Executive Statement</h2>
                        <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap font-medium">{summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {experiences.length > 0 && (
                      <div className="space-y-3 border-t border-[#E7E5E4] pt-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-[#635BFF]">Career Progression</h2>
                        <div className="space-y-4">
                          {experiences.map(item => (
                            <div key={item.id} className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                <h3 className="text-xs font-black text-[#111827]">{item.role}</h3>
                                <span className="text-[9px] text-[#6B7280] font-bold whitespace-nowrap">{item.duration}</span>
                              </div>
                              <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider">{item.company}</p>
                              <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap font-medium mt-1">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                      <div className="space-y-3 border-t border-[#E7E5E4] pt-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-[#635BFF]">Education</h2>
                        <div className="space-y-3">
                          {education.map(item => (
                            <div key={item.id} className="space-y-1">
                              <div className="flex justify-between items-baseline">
                                <h3 className="text-xs font-black text-[#111827]">{item.degree}</h3>
                                <span className="text-[9px] text-[#6B7280] font-bold whitespace-nowrap">{item.duration}</span>
                              </div>
                              <p className="text-[10px] font-bold text-[#6B7280] leading-none">{item.school}</p>
                              <p className="text-[10px] text-[#6B7280] leading-relaxed font-medium mt-1">{item.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* A4 Sheet Footer (Subtle branding) */}
              <div className="border-t border-[#E7E5E4] pt-4 mt-6 flex justify-between items-center opacity-40 text-[8px] font-bold uppercase tracking-widest text-[#6B7280]">
                <span>Generated by MockMate AI</span>
                <span>Page 1 of 1</span>
              </div>
              
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
