
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { generatePromptFromImage } from './services/geminiService';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove 'data:image/jpeg;base64,' prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- SVG Icon Components ---

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.4-1.4l-1.188-.648.648-1.188a2.25 2.25 0 011.4-1.4l1.188-.648.648 1.188a2.25 2.25 0 011.4 1.4l1.188.648-.648 1.188a2.25 2.25 0 01-1.4 1.4z"
    />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
    />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        className={className}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


// --- UI Components (defined outside App to prevent re-creation on re-render) ---

interface ImageUploaderProps {
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onAreaClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      onClick={onAreaClick}
      className={`relative flex flex-col items-center justify-center w-full max-w-lg p-8 mx-auto border-2 border-dashed rounded-xl transition-colors duration-300 ${
        isLoading ? 'border-gray-600 cursor-not-allowed' : 'border-indigo-400 hover:border-indigo-300 hover:bg-gray-800/50 cursor-pointer'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-transparent"></div>
      <UploadIcon className="w-12 h-12 text-indigo-400 mb-4" />
      <p className="text-lg font-semibold text-gray-200">
        Click to upload an image
      </p>
      <p className="text-sm text-gray-400">PNG, JPG, or WEBP</p>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={onImageChange}
        disabled={isLoading}
      />
    </div>
  );
};

interface PromptDisplayProps {
  prompt: string;
  isLoading: boolean;
  onCopy: () => void;
  isCopied: boolean;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt, isLoading, onCopy, isCopied }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/50 rounded-lg min-h-[160px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
        <p className="mt-4 text-gray-300 font-medium tracking-wide">Generating prompt...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/50 rounded-lg min-h-[160px]">
        <SparklesIcon className="w-12 h-12 text-gray-500 mb-2"/>
        <p className="text-gray-400">Your generated prompt will appear here.</p>
      </div>
    );
  }
  
  return (
    <div className="relative w-full p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-inner">
        <p className="font-mono text-gray-200 whitespace-pre-wrap">{prompt}</p>
        <button
            onClick={onCopy}
            className="absolute top-3 right-3 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50"
        >
            {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
        </button>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a PNG, JPG, or WEBP image.');
        return;
      }
      setError(null);
      setPrompt('');
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleGeneratePrompt = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrompt('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const generatedPrompt = await generatePromptFromImage(base64Image, imageFile.type);
      setPrompt(generatedPrompt);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate prompt. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);
  
  const handleCopyPrompt = () => {
    if(!prompt) return;
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setPrompt('');
    setError(null);
    setIsCopied(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-indigo-500/10 text-indigo-400 py-1 px-3 rounded-full text-sm mb-4">
                <SparklesIcon className="w-4 h-4"/>
                Powered by Gemini
            </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Image to Prompt Generator
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Upload an image and let AI craft a detailed, creative prompt for you.
          </p>
        </header>

        <main className="max-w-4xl mx-auto flex flex-col gap-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-4 items-center">
              <h2 className="text-xl font-bold text-gray-200 self-start">1. Upload Image</h2>
              {imageUrl ? (
                <div className="w-full max-w-lg aspect-square bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                    <img src={imageUrl} alt="Upload preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <ImageUploader onImageChange={handleImageChange} isLoading={isLoading} />
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-200">2. Generated Prompt</h2>
              <PromptDisplay prompt={prompt} isLoading={isLoading} onCopy={handleCopyPrompt} isCopied={isCopied} />
            </div>
          </div>
          
          <div className="flex justify-center items-center mt-4 gap-4">
              {imageUrl && (
                <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className="px-6 py-3 text-base font-semibold rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Start Over
                </button>
              )}
              <button
                onClick={handleGeneratePrompt}
                disabled={!imageFile || isLoading}
                className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
              >
                  <span className="absolute inset-0 bg-black opacity-20 group-hover:opacity-0 transition-opacity duration-300"></span>
                  <SparklesIcon className="w-6 h-6 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  {isLoading ? 'Generating...' : 'Generate Prompt'}
              </button>
          </div>

        </main>
      </div>
    </div>
  );
}
