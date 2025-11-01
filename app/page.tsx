'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Question = {
  id: number;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
};

export default function Page() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choice, setChoice] = useState<'A'|'B'|'C'|'D'|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRandom() {
    setLoading(true); setError(null); setChoice(null);
    const { data, error } = await supabase.rpc('get_random_question');
    if (error || !data || data.length === 0) {
      setError(error?.message || 'No question available');
    } else {
      const q = data[0] as Question;
      setQuestion(q);
    }
    setLoading(false);
  }

  async function submitAndNext() {
    if (!question || !choice) return;
    setLoading(true); setError(null);
    const { error } = await supabase
      .from('responses')
      .insert({ question_id: question.id, selected_option: choice });
    if (error) { setError(error.message); setLoading(false); return; }
    await loadRandom();
  }

  useEffect(() => { loadRandom(); }, []);

  if (error) return (
    <main className="p-6 max-w-xl mx-auto">
      <p className="text-red-600">{error}</p>
      <button onClick={loadRandom} className="mt-4 border px-3 py-2">Retry</button>
    </main>
  );

  if (!question) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">{question.question_text}</h1>
      {(['A','B','C','D'] as const).map(k => (
        <label key={k} className="flex items-center gap-2">
          <input
            type="radio"
            name="opt"
            value={k}
            checked={choice===k}
            onChange={() => setChoice(k)}
            disabled={loading}
          />
          <span>{question[`option_${k.toLowerCase() as 'a'|'b'|'c'|'d'}`]}</span>
        </label>
      ))}
      <button
        onClick={submitAndNext}
        disabled={!choice || loading}
        className="border px-4 py-2 disabled:opacity-50"
      >{loading ? 'Saving…' : 'Next'}</button>
    </main>
  );
}


