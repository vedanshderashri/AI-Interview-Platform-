'use client';
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, CheckCircle2, Upload } from 'lucide-react';
import { GradientButton } from '@/components/ui/GradientButton';

interface ResumeUploadStepProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

export function ResumUploadStep({ onUpload, isProcessing }: ResumeUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full flex flex-col items-center gap-8"
    >
      {/* Title */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Upload className="w-6 h-6 text-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0891B2] uppercase tracking-wider">Step 2</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] text-center">
          Upload Your Resume
        </h1>
        <p className="text-[#64748B] text-lg text-center max-w-xl">
          We'll analyze your background to customize the interview questions for your experience level.
        </p>
      </div>

      {/* Upload Area */}
      <div className="w-full max-w-3xl">
        <motion.div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed p-20 flex flex-col items-center justify-center gap-4 rounded-xl cursor-pointer transition-all ${
            dragActive
              ? 'border-[#0891B2] bg-[#0891B2]/10'
              : 'border-[#CBD5E1] hover:border-[#0891B2] hover:bg-[#F0F9FA]'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="hidden"
          />

          {!file ? (
            <>
              <UploadCloud className="w-14 h-14 text-[#0891B2]" />
              <div className="text-center">
                <p className="text-[#0F172A] font-semibold text-lg">
                  Drag and drop your resume
                </p>
                <p className="text-[#64748B] text-sm mt-2">
                  or click to browse (PDF or Word)
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-14 h-14 text-[#10B981]" />
              <div className="text-center">
                <p className="text-[#0F172A] font-semibold text-lg flex items-center gap-2 justify-center">
                  <File className="w-5 h-5" />
                  {file.name}
                </p>
                <p className="text-[#64748B] text-sm mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Upload Button */}
      <div className="flex gap-4">
        {file && (
          <GradientButton
            onClick={handleUpload}
            disabled={isProcessing}
            variant="primary"
            className={`px-16 py-4 text-lg ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? 'Processing Resume...' : 'Continue'}
          </GradientButton>
        )}
      </div>
    </motion.div>
  );
}
