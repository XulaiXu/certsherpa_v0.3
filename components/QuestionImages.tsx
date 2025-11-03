'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

type Props = {
  questionID?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

const SUPABASE_PREFIX =
  'https://nbocdtiijnttzwfgdwbi.supabase.co/storage/v1/object/public/questions/';

export function QuestionImages({ questionID, imageUrl, imageAlt }: Props) {
  // If an explicit URL is provided (from DB), render it directly (use <img> so it works without Next image domain rules)
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={imageAlt || 'Question image'}
        style={{ maxWidth: '100%', height: 'auto', margin: '8px 0 12px' }}
        loading="lazy"
      />
    );
  }

  // Otherwise, try to auto-discover by ID in the public bucket
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!questionID) return;
    let cancelled = false;
    const exts = ['png', 'jpg', 'jpeg', 'svg', 'PNG', 'JPG', 'JPEG', 'SVG'];
    const suffixes = ['', '_1', '_2', '_3', '_4', '_5', '_6', '_7', '_8', '_9', '_10'];
    const candidates: string[] = [];
    const code = questionID.trim();
    for (const s of suffixes) {
      for (const e of exts) {
        candidates.push(`${SUPABASE_PREFIX}${code}${s}.${e}`);
      }
    }

    candidates.forEach((url) => {
      const tester = new window.Image();
      tester.onload = () => {
        if (!cancelled) setUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
      };
      tester.onerror = () => {};
      tester.src = url;
    });

    return () => {
      cancelled = true;
    };
  }, [questionID]);

  if (!questionID || urls.length === 0) return null;

  return (
    <div style={{ margin: '8px 0 12px' }}>
      {urls.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`${questionID} diagram ${i + 1}`}
          style={{ maxWidth: '100%', height: 'auto', marginBottom: 8 }}
          loading="lazy"
        />
      ))}
    </div>
  );
}
