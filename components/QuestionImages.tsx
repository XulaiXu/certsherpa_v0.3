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
        style={{ width: '80%', height: 'auto', margin: '8px auto 12px', display: 'block' }}
        loading="lazy"
      />
    );
  }

  const [items, setItems] = useState<FileItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!questionID) return;
      const qid = questionID.trim();

      const suffixes = ['', '_1','_2','_3','_4','_5','_6','_7','_8','_9','_10'];
      // Try common image types for robustness
      const exts = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
      const candidates: string[] = [];
      for (const s of suffixes) {
        for (const e of exts) {
          candidates.push(`${qid}${s}.${e}`);
        }
      }

      const out: FileItem[] = [];
      await Promise.all(candidates.map(async (name) => {
        const url = useSignedUrls
          ? (await supabase.storage.from(bucket).createSignedUrl(name, 3600)).data?.signedUrl
          : supabase.storage.from(bucket).getPublicUrl(name).data?.publicUrl;
        if (!url) return;
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => { out.push({ name, url }); resolve(); };
          img.onerror = () => resolve();
          img.src = url;
        });
      }));

      // Sort: base first, then numbered
      out.sort((a,b) => {
        const n = (name: string) => {
          const m = name.match(/_(\d+)\.[^.]+$/);
          return m ? parseInt(m[1], 10) : 0;
        };
        return n(a.name) - n(b.name);
      });

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
            style={{ width: '80%', height: 'auto', margin: '0 auto 8px', display: 'block' }}
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
            style={{ width: '80%', height: 'auto', margin: '0 auto 8px', display: 'block' }}
            loading="lazy"
          />
        );
      })}
    </div>
  );
}
