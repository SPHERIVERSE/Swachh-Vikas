'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import axios from '@/utils/axiosInstance';

export default function ExplorePage() {
  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const { data } = await axios.get(`/community/feed/page/${cursor ?? ''}`);
    setItems(prev => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setLoading(false);
  }, [cursor, loading]);

  useEffect(() => { loadMore(); }, []);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && cursor !== null) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    obs.observe(node);
    return () => obs.disconnect();
  }, [cursor, loadMore]);

  return (
    <RoleGuard role='CITIZEN'>
      <div className='max-w-5xl mx-auto p-6 text-white'>
        <h1 className='text-3xl font-bold mb-6'>Explore</h1>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
          {items.map(p => (
            <a key={p.id} href={`/auth/dashboard/citizen/community/post/${p.id}`} className='block'>
              {p.mediaUrl && p.mediaType === 'IMAGE' ? (
                <img src={p.mediaUrl} className='w-full h-48 object-cover rounded' />
              ) : p.mediaUrl && p.mediaType === 'VIDEO' ? (
                <video src={p.mediaUrl} className='w-full h-48 object-cover rounded' />
              ) : (
                <div className='w-full h-48 bg-gray-800 rounded flex items-center justify-center text-gray-400'>
                  {p.content.slice(0, 80)}
                </div>
              )}
            </a>
          ))}
        </div>
        <div ref={loaderRef} className='h-12 flex items-center justify-center text-gray-400'>
          {cursor === null ? 'No more posts' : (loading ? 'Loading...' : 'Scroll to load more')}
        </div>
      </div>
    </RoleGuard>
  );
}



