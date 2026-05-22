'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Plus, Edit2, Trash2, FileText, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

export default function ResumeBuilder() {
  const [sections, setSections] = useState<ResumeSection[]>([
    { id: '1', title: 'Personal Information', content: '' },
    { id: '2', title: 'Professional Summary', content: '' },
    { id: '3', title: 'Experience', content: '' },
    { id: '4', title: 'Education', content: '' },
    { id: '5', title: 'Skills', content: '' },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAddSection = () => {
    const newSection: ResumeSection = {
      id: Date.now().toString(),
      title: 'New Section',
      content: '',
    };
    setSections([...sections, newSection]);
  };

  const handleEditSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      setEditingId(id);
      setEditingContent(section.content);
    }
  };

  const handleSaveSection = (id: string) => {
    setSections(sections.map(s =>
      s.id === id ? { ...s, content: editingContent } : s
    ));
    setEditingId(null);
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleDownload = () => {
    const resumeText = sections
      .map(section => `${section.title.toUpperCase()}\n${section.content}\n`)
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(resumeText));
    element.setAttribute('download', 'resume.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#F5F5F5] font-inter selection:bg-[#4CAF50]/20">
      <Header title="Resume Builder" subtitle="Create and customize your professional resume" />

      <main className="flex-1 w-full px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Preview and Builder Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Builder Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1F1F1F]">Edit Sections</h2>
                <GradientButton
                  onClick={handleAddSection}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </GradientButton>
              </div>

              {sections.map((section, idx) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <GlassCard>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#1F1F1F]">{section.title}</h3>
                        <div className="flex items-center gap-2">
                          {editingId !== section.id && (
                            <>
                              <button
                                onClick={() => handleEditSection(section.id)}
                                className="p-2 hover:bg-[#4CAF50]/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-[#4CAF50]" />
                              </button>
                              <button
                                onClick={() => handleDeleteSection(section.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingId === section.id ? (
                        <div className="space-y-4">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full h-40 p-4 bg-white/50 border border-[#E0E0E0] rounded-lg text-[#1F1F1F] placeholder-[#999999] focus:outline-none focus:border-[#4CAF50] resize-none"
                            placeholder="Enter section content..."
                          />
                          <div className="flex gap-2">
                            <GradientButton
                              onClick={() => handleSaveSection(section.id)}
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </GradientButton>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 px-4 py-2 border border-[#E0E0E0] text-[#1F1F1F] rounded-lg hover:bg-[#4CAF50]/5 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#1F1F1F]/80 whitespace-pre-wrap">
                          {section.content || 'Click edit to add content...'}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <GlassCard>
                <div className="p-6 sticky top-20">
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-[#4CAF50]" />
                    <h2 className="text-xl font-bold text-[#1F1F1F]">Preview</h2>
                  </div>

                  <div className="mb-6 p-4 bg-[#4CAF50]/5 border border-[#4CAF50]/10 rounded-lg max-h-96 overflow-y-auto">
                    {sections.map((section) => (
                      <div key={section.id} className="mb-4">
                        <h3 className="text-sm font-semibold text-[#4CAF50] uppercase mb-2">
                          {section.title}
                        </h3>
                        <p className="text-sm text-[#666666] whitespace-pre-wrap line-clamp-3">
                          {section.content || '(empty)'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <GradientButton
                    onClick={handleDownload}
                    className="w-full"
                  >
                    Download Resume
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
