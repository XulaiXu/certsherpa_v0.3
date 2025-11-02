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
  // If an explicit URL is provided (from DB), render it directly
  if (imageUrl) {
    const isSvg = imageUrl.toLowerCase().endsWith('.svg');
    return isSvg ? (
      <img
        src={imageUrl}
        alt={imageAlt || 'Question image'}
        style={{ maxWidth: '100%', height: 'auto', margin: '8px 0 12px' }}
      />
    ) : (
      <div style={{ margin: '8px 0 12px' }}>
        <Image
          src={imageUrl}
          alt={imageAlt || 'Question image'}
          width={800}
          height={600}
          sizes="(max-width: 800px) 100vw, 800px"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    );
  }

  // Otherwise, try to auto-discover by ID in the public bucket
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!questionID) return;
    async function fetchImages() {
      const candidates = [
        `${questionID}.jpg`,
        `${questionID}.jpeg`,
        `${questionID}.png`,
        `${questionID}.svg`,
        `${questionID}_1.jpg`,
        `${questionID}_2.jpg`,
        `${questionID}_3.jpg`,
        `${questionID}_1.png`,
        `${questionID}_2.png`,
      ];

      const found: string[] = [];
      await Promise.all(
        candidates.map(async (filename) => {
          const url = SUPABASE_PREFIX + filename;
          try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) found.push(url);
          } catch (_) {
            /* ignore */
          }
        })
      );

      setUrls(found);
    }
    fetchImages();
  }, [questionID]);

  if (!questionID || urls.length === 0) return null;

  return (
    <div style={{ margin: '8px 0 12px' }}>
      {urls.map((url, i) => {
        const isSvg = url.toLowerCase().endsWith('.svg');
        return isSvg ? (
          <img
            key={i}
            src={url}
            alt={`${questionID} diagram ${i + 1}`}
            style={{ maxWidth: '100%', height: 'auto', marginBottom: 8 }}
          />
        ) : (
          <Image
            key={i}
            src={url}
            alt={`${questionID} diagram ${i + 1}`}
            width={800}
            height={600}
            sizes="(max-width: 800px) 100vw, 800px"
            style={{ width: '100%', height: 'auto', marginBottom: 8 }}
          />
        );
      })}
    </div>
  );
}
