import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Top, TopCategory, TopPlace, TopPlacePhoto, TopRanking } from '../types';

type TopRow = { id: string; title: string; emoji: string; created_by: string | null; created_at: string };
type CategoryRow = { id: string; top_id: string; name: string; sort_order: number };
type PlaceRow = { id: string; top_id: string; name: string; created_by: string | null; created_at: string };
type RankingRow = { category_id: string; user_id: string; top_id: string; place_ids: string[] | null };
type PhotoRow = { id: string; place_id: string; url: string; created_by: string | null; created_at: string };

type Result = { ok: boolean; error?: string; id?: string };

const TABLES = ['tops', 'top_categories', 'top_places', 'top_rankings', 'top_place_photos'] as const;

// Tops del pasaporte actual, sincronizados en vivo entre sus miembros.
export function useTops(passportId: string | undefined, userId: string | undefined) {
  const [tops, setTops] = useState<Top[]>([]);
  const [categories, setCategories] = useState<TopCategory[]>([]);
  const [places, setPlaces] = useState<TopPlace[]>([]);
  const [rankings, setRankings] = useState<TopRanking[]>([]);
  const [photos, setPhotos] = useState<TopPlacePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!passportId) return;
    const [topsRes, catsRes, placesRes, rankingsRes, photosRes] = await Promise.all([
      supabase.from('tops').select('*').eq('passport_id', passportId).order('created_at', { ascending: true }),
      supabase.from('top_categories').select('*').eq('passport_id', passportId).order('sort_order', { ascending: true }),
      supabase.from('top_places').select('*').eq('passport_id', passportId).order('created_at', { ascending: true }),
      supabase.from('top_rankings').select('*').eq('passport_id', passportId),
      supabase.from('top_place_photos').select('*').eq('passport_id', passportId).order('created_at', { ascending: true }),
    ]);
    setPhotos(
      ((photosRes.data as PhotoRow[] | null) ?? []).map((r) => ({
        id: r.id,
        placeId: r.place_id,
        url: r.url,
        createdBy: r.created_by,
        createdAt: new Date(r.created_at).getTime(),
      }))
    );
    setTops(
      ((topsRes.data as TopRow[] | null) ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        emoji: r.emoji,
        createdBy: r.created_by,
        createdAt: new Date(r.created_at).getTime(),
      }))
    );
    setCategories(
      ((catsRes.data as CategoryRow[] | null) ?? []).map((r) => ({
        id: r.id,
        topId: r.top_id,
        name: r.name,
        sortOrder: r.sort_order,
      }))
    );
    setPlaces(
      ((placesRes.data as PlaceRow[] | null) ?? []).map((r) => ({
        id: r.id,
        topId: r.top_id,
        name: r.name,
        createdBy: r.created_by,
        createdAt: new Date(r.created_at).getTime(),
      }))
    );
    setRankings(
      ((rankingsRes.data as RankingRow[] | null) ?? []).map((r) => ({
        categoryId: r.category_id,
        userId: r.user_id,
        topId: r.top_id,
        placeIds: r.place_ids ?? [],
      }))
    );
  }, [passportId]);

  useEffect(() => {
    if (!passportId) return;
    let cancelled = false;
    setLoading(true);
    refetch().finally(() => {
      if (!cancelled) setLoading(false);
    });

    let channel = supabase.channel(`tops-${passportId}`);
    for (const table of TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `passport_id=eq.${passportId}` },
        () => refetch()
      );
    }
    channel.subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [passportId, refetch]);

  const createTop = useCallback(
    async (title: string, emoji: string, categoryNames: string[]): Promise<Result> => {
      if (!passportId || !userId) return { ok: false, error: 'No hay un pasaporte activo.' };
      const { data, error } = await supabase
        .from('tops')
        .insert({ passport_id: passportId, title: title.trim(), emoji, created_by: userId })
        .select('id')
        .single();
      if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear el top.' };

      const { error: catError } = await supabase.from('top_categories').insert(
        categoryNames.map((name, index) => ({
          top_id: data.id,
          passport_id: passportId,
          name: name.trim(),
          sort_order: index,
        }))
      );
      if (catError) return { ok: false, error: catError.message };
      await refetch();
      return { ok: true, id: data.id };
    },
    [passportId, userId, refetch]
  );

  const deleteTop = useCallback(
    async (topId: string): Promise<Result> => {
      const { error } = await supabase.from('tops').delete().eq('id', topId);
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  const addCategory = useCallback(
    async (topId: string, name: string): Promise<Result> => {
      if (!passportId) return { ok: false, error: 'No hay un pasaporte activo.' };
      const nextOrder = Math.max(-1, ...categories.filter((c) => c.topId === topId).map((c) => c.sortOrder)) + 1;
      const { error } = await supabase
        .from('top_categories')
        .insert({ top_id: topId, passport_id: passportId, name: name.trim(), sort_order: nextOrder });
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [passportId, categories, refetch]
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<Result> => {
      const { error } = await supabase.from('top_categories').delete().eq('id', categoryId);
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  const addPlace = useCallback(
    async (topId: string, name: string): Promise<Result> => {
      if (!passportId || !userId) return { ok: false, error: 'No hay un pasaporte activo.' };
      const { error } = await supabase
        .from('top_places')
        .insert({ top_id: topId, passport_id: passportId, name: name.trim(), created_by: userId });
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [passportId, userId, refetch]
  );

  const deletePlace = useCallback(
    async (placeId: string): Promise<Result> => {
      const { error } = await supabase.from('top_places').delete().eq('id', placeId);
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  const saveRanking = useCallback(
    async (topId: string, categoryId: string, placeIds: string[]): Promise<Result> => {
      if (!passportId || !userId) return { ok: false, error: 'No hay un pasaporte activo.' };
      const { error } = await supabase.from('top_rankings').upsert(
        {
          category_id: categoryId,
          user_id: userId,
          top_id: topId,
          passport_id: passportId,
          place_ids: placeIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'category_id,user_id' }
      );
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [passportId, userId, refetch]
  );

  const addPlacePhoto = useCallback(
    async (topId: string, placeId: string, url: string): Promise<Result> => {
      if (!passportId || !userId) return { ok: false, error: 'No hay un pasaporte activo.' };
      const { error } = await supabase
        .from('top_place_photos')
        .insert({ place_id: placeId, top_id: topId, passport_id: passportId, url, created_by: userId });
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [passportId, userId, refetch]
  );

  const deletePlacePhoto = useCallback(
    async (photoId: string): Promise<Result> => {
      const { error } = await supabase.from('top_place_photos').delete().eq('id', photoId);
      if (error) return { ok: false, error: error.message };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  return {
    loading,
    tops,
    categories,
    places,
    rankings,
    photos,
    addPlacePhoto,
    deletePlacePhoto,
    createTop,
    deleteTop,
    addCategory,
    deleteCategory,
    addPlace,
    deletePlace,
    saveRanking,
  };
}
