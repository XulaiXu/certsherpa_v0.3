import Image from 'next/image';

export type QuestionImagesProps = {
  imageUrl?: string | null;
  imageAlt?: string | null;
  className?: string;
};

export default function QuestionImages({ imageUrl, imageAlt, className }: QuestionImagesProps) {
  if (!imageUrl) return null;
  const isSvg = imageUrl.toLowerCase().endsWith('.svg');

  if (isSvg) {
    return (
      <img
        src={imageUrl}
        alt={imageAlt || 'Question image'}
        className={className}
        style={{ maxWidth: '100%', height: 'auto', margin: '8px 0 12px' }}
      />
    );
  }

  return (
    <div className={className} style={{ margin: '8px 0 12px' }}>
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


