'use client';

import { useState } from 'react';

export default function SpiritualGiftsLeaderForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    churchName: '',
    churchSize: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/spiritual-gifts/leader-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        churchName: '',
        churchSize: '',
        message: '',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again or email us directly.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Your Dashboard is Ready!</h3>
        <p className="text-gray-600 mb-4">
          Check your inbox — we just sent you a magic link to access your team dashboard instantly.
        </p>
        <p className="text-sm text-gray-500 mb-6">Check your email (including spam folder). The link expires in 7 days.</p>

        {/* CTA to try it themselves */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
          <h4 className="font-bold text-gray-900 mb-2">
            Want to See What Your Team Will Experience?
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Take the assessment yourself (15 minutes) and see the quality firsthand.
          </p>
          <a
            href="https://dailydna.app/gifts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try It Now →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Smith"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="john@church.com"
        />
      </div>

      {/* Church Name */}
      <div>
        <label htmlFor="churchName" className="block text-sm font-medium text-gray-700 mb-1">
          Church Name *
        </label>
        <input
          type="text"
          id="churchName"
          name="churchName"
          required
          value={formData.churchName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="First Community Church"
        />
      </div>

      {/* Church Size */}
      <div>
        <label htmlFor="churchSize" className="block text-sm font-medium text-gray-700 mb-1">
          Church Size *
        </label>
        <select
          id="churchSize"
          name="churchSize"
          required
          value={formData.churchSize}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select size...</option>
          <option value="1-50">1-50 people</option>
          <option value="51-200">51-200 people</option>
          <option value="201-500">201-500 people</option>
          <option value="501-1000">501-1,000 people</option>
          <option value="1001+">1,000+ people</option>
        </select>
      </div>

      {/* Message (Optional) */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Details (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tell us about your team or specific needs..."
        />
      </div>

      {/* Error Message */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending...' : 'Get Team Access'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By submitting, you agree to receive follow-up emails from DNA Discipleship.
      </p>
    </form>
  );
}
