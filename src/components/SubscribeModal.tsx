import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Save email to Firestore
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        subscribedAt: serverTimestamp(),
        source: 'footer_subscribe_button',
      });
      
      setStatus('success');
      // Clear the form after a successful submission
      setTimeout(() => {
        setEmail('');
        onClose();
        setStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to subscribe:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800 text-white w-full max-w-md p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="font-serif text-xl uppercase tracking-widest text-white">Join The Editorial</h3>
        </div>
        
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          Subscribe to our luxury fashion newsletter for exclusive insights, high-fashion editorials, and behind-the-scenes access to Fleurish Studio updates.
        </p>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h4 className="font-serif text-lg uppercase tracking-wider mb-2">Welcome Aboard</h4>
            <p className="text-sm text-zinc-400">Your subscription has been confirmed. Expect our next issue soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  className="block w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-700 rounded-none text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                  placeholder="your@email.com"
                  disabled={status === 'loading'}
                  required
                />
              </div>
              {status === 'error' && (
                <p className="mt-2 text-xs text-red-500">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-xs font-bold uppercase tracking-widest text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-zinc-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Subscribe'
              )}
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-4">
              By subscribing, you agree to our Terms of Service and Privacy Policy. You may unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
