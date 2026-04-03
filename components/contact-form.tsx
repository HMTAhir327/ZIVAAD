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
    <form onSubmit={handleSubmit} className="space-y-3 border border-stone-200 bg-white p-5">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-stone-950"
        required
      />
      <textarea
        placeholder="Message"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="w-full resize-none border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-stone-950"
        required
      />
      <button
        type="submit"
        className="w-full bg-stone-950 px-5 py-3 text-[11px] uppercase tracking-luxury text-white"
      >
        Send via WhatsApp
      </button>
      {status ? <p className="text-sm text-stone-600">{status}</p> : null}
    </form>
  );
}
