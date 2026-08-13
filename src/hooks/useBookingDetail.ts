/**
 * Single booking for the detail screen (/booking/[id]). Renter-side mirror
 * of the useBookings list query, plus everything the detail layout needs:
 * the joined item (description + coordinates for the map), the item's
 * ordered images for the hero carousel, the owner from public_profiles with
 * phone via the get_booking_party_phone RPC (phone is only released to a
 * counterparty of a real booking), and the item's public renter_to_owner
 * reviews for the reviews rail — same review query the product screen uses.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface BookingDetailOwner {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  rating: number | null;
  created_at: string | null;
  verified: boolean | null;
  phone: string | null;
}

export interface BookingDetailReview {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
}

export interface BookingDetail {
  id: string;
  item_id: string | null;
  owner_id: string | null;
  status: string | null;
  dispute_status: string | null;
  start_date: string;
  end_date: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  total_days: number | null;
  rental_cost: number | null;
  service_fee: number | null;
  total_cost: number | null;
  created_at: string | null;
  confirmed_at: string | null;
  actual_pickup_date: string | null;
  /** Set by trigger when the booking completes (owner confirms the return). */
  actual_return_date: string | null;
  rejection_reason: string | null;
  pickup_photos: string[] | null;
  return_photos: string[] | null;
  item: {
    title: string;
    description: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  images: string[];
  /** Owner-uploaded condition photos (item_images with image_type 'condition'). */
  condition_images: string[];
  owner: BookingDetailOwner | null;
  reviews: BookingDetailReview[];
  /** Average of the item's public review ratings; null when unreviewed. */
  rating: number | null;
  /**
   * Whether the current renter already reviewed THIS booking. The return
   * flow flips the status to `returning` before the review sheet opens, so
   * a reload can strand the booking past that step with no review — this
   * flag lets the detail screen offer the review again.
   */
  hasMyReview: boolean;
}

export function useBookingDetail(id: string | undefined) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data: row, error: dbError } = await supabase
          .from('bookings')
          .select(
            'id, item_id, owner_id, status, dispute_status, start_date, end_date, pickup_time, dropoff_time, total_days, rental_cost, service_fee, total_cost, created_at, confirmed_at, actual_pickup_date, actual_return_date, rejection_reason, pickup_photos, return_photos, items ( title, description, location, latitude, longitude )',
          )
          .eq('id', id)
          .maybeSingle();
        if (dbError) throw dbError;
        if (!row) throw new Error('Booking not found');

        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id ?? null;

        const [imagesRes, ownerRes, phoneRes, reviewsRes, myReviewRes] = await Promise.all([
          row.item_id
            ? supabase
                .from('item_images')
                .select('image_url, image_type')
                .eq('item_id', row.item_id)
                .order('image_order', { ascending: true })
            : Promise.resolve({ data: [] as { image_url: string; image_type: string | null }[] }),
          row.owner_id
            ? supabase
                .from('public_profiles')
                .select('id, full_name, avatar_url, rating, created_at, verified')
                .eq('id', row.owner_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          row.owner_id
            ? supabase.rpc('get_booking_party_phone', { p_other_user_id: row.owner_id })
            : Promise.resolve({ data: null }),
          row.item_id
            ? supabase
                .from('reviews')
                .select(
                  'id, rating, comment, created_at, reviewer:public_profiles!reviewer_id(full_name, avatar_url)',
                )
                .eq('item_id', row.item_id)
                .eq('visibility', 'public')
                .eq('review_type', 'renter_to_owner')
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
          uid
            ? supabase
                .from('reviews')
                .select('id')
                .eq('booking_id', row.id)
                .eq('reviewer_id', uid)
                .eq('review_type', 'renter_to_owner')
                .limit(1)
            : Promise.resolve({ data: [] as { id: string }[] }),
        ]);

        const reviews = (reviewsRes.data ?? []) as unknown as BookingDetailReview[];
        const rated = reviews.filter((r) => r.rating != null);
        const rating = rated.length
          ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
          : null;

        const ownerPub = ownerRes.data as
          | { id: string | null; full_name: string | null; avatar_url: string | null; rating: number | null; created_at: string | null; verified: boolean | null }
          | null;

        if (!cancelled) {
          setBooking({
            id: row.id,
            item_id: row.item_id,
            owner_id: row.owner_id,
            status: row.status,
            dispute_status: row.dispute_status,
            start_date: row.start_date,
            end_date: row.end_date,
            pickup_time: row.pickup_time,
            dropoff_time: row.dropoff_time,
            total_days: row.total_days,
            rental_cost: row.rental_cost,
            service_fee: row.service_fee,
            total_cost: row.total_cost,
            created_at: row.created_at,
            confirmed_at: row.confirmed_at,
            actual_pickup_date: row.actual_pickup_date,
            actual_return_date: row.actual_return_date,
            rejection_reason: row.rejection_reason,
            pickup_photos: row.pickup_photos,
            return_photos: row.return_photos,
            item: row.items as BookingDetail['item'],
            // Same split as web's booking details: 'display'/null images feed
            // the hero carousel, 'condition' ones the "Haqiqiy holati" section.
            images: (imagesRes.data ?? [])
              .filter((i) => i.image_type !== 'condition')
              .map((i) => i.image_url),
            condition_images: (imagesRes.data ?? [])
              .filter((i) => i.image_type === 'condition')
              .map((i) => i.image_url),
            owner:
              ownerPub && row.owner_id
                ? {
                    id: row.owner_id,
                    full_name: ownerPub.full_name,
                    avatar_url: ownerPub.avatar_url,
                    rating: ownerPub.rating,
                    created_at: ownerPub.created_at,
                    verified: ownerPub.verified,
                    phone: (phoneRes.data as string | null) ?? null,
                  }
                : null,
            reviews,
            rating,
            hasMyReview: (myReviewRes.data?.length ?? 0) > 0,
          });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  return { booking, loading, error, refresh };
}
