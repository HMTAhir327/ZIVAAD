'use client';

import { FormEvent, useState } from 'react';

import { buildWhatsAppUrl } from '@/lib/whatsapp';

export function ContactForm() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = `Hello ZIVAAD,\n\nMy name is ${name.trim()}.\n${message.trim()}`;
    window.open(buildWhatsAppUrl(text), '_blank');
    setStatus('WhatsApp opened with your message.');
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-stone-200 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:p-7">
      <div className="space-y-5">
        <div>
          <label htmlFor="contact-name" className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-11 w-full rounded-sm border border-stone-200 bg-white px-3 text-[14px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-500"
            required
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Message
          </label>
          <textarea
            id="contact-message"
            placeholder="How can we help you?"
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-2 min-h-[140px] w-full resize-y rounded-sm border border-stone-200 bg-white px-3 py-3 text-[14px] leading-relaxed text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-5 h-11 w-full rounded-sm bg-stone-950 px-4 text-[10px] uppercase tracking-[0.26em] text-white transition-colors hover:bg-stone-800"
      >
        Send
      </button>
      {status ? <p className="mt-3 text-[11px] text-stone-600">{status}</p> : null}
    </form>
  );
}
