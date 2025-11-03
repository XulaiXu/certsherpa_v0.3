'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

type Props = {
  questionID?: string;
  imageUrl?: string | null;        // if present, we render this and skip lookup
  imageAlt?: string | null;
  bucket?: string;                 // defaults to 'questions'
  useSignedUrls?: boolean;         // true if bucket is private
};

type FileItem = { name: string; url: string };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function QuestionImages({
  questionID,
  imageUrl,
  imageAlt,
  bucket = 'questions',
  useSignedUrls = false,
}: Props) {

  if (imageUrl) {
    const absolute = /^https?:\/\//i.test(imageUrl);
    let src = imageUrl;
    if (!absolute) {
      const clean = imageUrl.replace(/^\/+/, '');
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(clean);
      if (pub?.publicUrl) src = pub.publicUrl;
    }
    return (
      <img
        src={src}
        alt={imageAlt || 'Question image'}
        style={{ maxWidth: '100%', height: 'auto', margin: '8px 0 12px' }}
        loading="lazy"
      />
    );
  }

  const [items, setItems] = useState<FileItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!questionID) return;

      // Try list with search (v2 supports it). If ‘search’ isn’t supported in your backend,
      // the call still returns all files and we’ll filter strictly with the regex below.
      const { data, error } = await supabase.storage.from(bucket).list('', {
        search: questionID,
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        console.error('Supabase storage list error:', error);
        if (!cancelled) setItems([]);
        return;
      }

      const exts = '(png|jpg|jpeg|webp|svg)';
      const id = escapeRegExp(questionID);
      // Matches QUESTIONID.ext or QUESTIONID_1..10.ext
      const re = new RegExp(`^${id}(?:_(?:[1-9]|10))?\\.${exts}$`, 'i');

      const matches = (data ?? []).filter((f) => f?.name && re.test(f.name));

      // Sort: base (no suffix) first, then _1.._10
      const sorted = matches.sort((a, b) => {
        const n = (name: string) => {
          const m = name.match(/_(\d+)\.[^.]+$/);
          return m ? parseInt(m[1], 10) : 0;
        };
        return n(a.name) - n(b.name);
      });

      const out: FileItem[] = [];
      for (const f of sorted) {
        if (useSignedUrls) {
          const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(f.name, 3600);
          if (signed?.signedUrl) out.push({ name: f.name, url: signed.signedUrl });
        } else {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(f.name);
          if (pub?.publicUrl) out.push({ name: f.name, url: pub.publicUrl });
        }
      }

      if (!cancelled) setItems(out);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [questionID, bucket, useSignedUrls]);

  if (!questionID || items === null || items.length === 0) return null;

  return (
    <div style={{ margin: '8px 0 12px' }}>
      {items.map(({ name, url }, i) => {
        const lower = name.toLowerCase();
        const isSvg = lower.endsWith('.svg');
        return isSvg ? (
          <img
            key={name}
            src={url}
            alt={`${questionID} diagram ${i + 1}`}
            style={{ maxWidth: '100%', height: 'auto', marginBottom: 8 }}
            loading="lazy"
          />
        ) : (
          <Image
            key={name}
            src={url}
            alt={`${questionID} diagram ${i + 1}`}
            width={1600}
            height={1200}
            sizes="(max-width: 768px) 100vw, 800px"
            style={{ width: '100%', height: 'auto', marginBottom: 8 }}
            loading="lazy"
          />
        );
      })}
    </div>
  );
}
