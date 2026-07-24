'use client';
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          listing:listings (
            id, title, location, address, sale_price, scraped_source,
            property_type, bedrooms, bathrooms, square_feet,
            amenities, features, description, images, scraped_url,
            contact_phone, contact_whatsapp
          )
        `)
        .eq('secretary_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createLead = useCallback(async (leadData) => {
    if (!user) throw new Error('Must be logged in');

    // Auto-calculate commission from listing sale_price
    let commission = null;
    if (leadData.listing_id) {
      const { data: listing } = await supabase
        .from('listings')
        .select('sale_price')
        .eq('id', leadData.listing_id)
        .single();
      if (listing?.sale_price) {
        commission = parseFloat(listing.sale_price) * 0.05;
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        secretary_id: user.id,
        commission_amount: commission,
        stage: 'inquiry',
        inquiry_at: new Date().toISOString(),
      })
      .select(`
        *,
        listing:listings (
          id, title, location, address, sale_price, scraped_source,
          property_type, bedrooms, bathrooms, square_feet,
          amenities, features, description, images, scraped_url,
          contact_phone, contact_whatsapp
        )
      `)
      .single();

    if (error) throw error;

    // Insert initial stage history
    await supabase.from('lead_stage_history').insert({
      lead_id: data.id,
      from_stage: null,
      to_stage: 'inquiry',
      changed_by: user.id,
    });

    setLeads(prev => [data, ...prev]);
    return data;
  }, [user]);

  const updateLeadStage = useCallback(async (leadId, newStage, notes) => {
    if (!user) throw new Error('Must be logged in');
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const stageTimestampField = {
      site_visit: 'site_visit_at',
      negotiation: 'negotiation_at',
      closed_won: 'closed_at',
      closed_lost: 'closed_at',
    };

    const updates = { stage: newStage };
    if (stageTimestampField[newStage]) {
      updates[stageTimestampField[newStage]] = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select(`
        *,
        listing:listings (
          id, title, location, address, sale_price, scraped_source,
          property_type, bedrooms, bathrooms, square_feet,
          amenities, features, description, images, scraped_url,
          contact_phone, contact_whatsapp
        )
      `)
      .single();

    if (error) throw error;

    // Record stage transition
    await supabase.from('lead_stage_history').insert({
      lead_id: leadId,
      from_stage: lead.stage,
      to_stage: newStage,
      changed_by: user.id,
      notes,
    });

    setLeads(prev => prev.map(l => l.id === leadId ? data : l));
    return data;
  }, [user, leads]);

  const updateLead = useCallback(async (leadId, updates) => {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select(`
        *,
        listing:listings (
          id, title, location, address, sale_price, scraped_source,
          property_type, bedrooms, bathrooms, square_feet,
          amenities, features, description, images, scraped_url,
          contact_phone, contact_whatsapp
        )
      `)
      .single();

    if (error) throw error;
    setLeads(prev => prev.map(l => l.id === leadId ? data : l));
    return data;
  }, []);

  const deleteLead = useCallback(async (leadId) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
    setLeads(prev => prev.filter(l => l.id !== leadId));
  }, []);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLeadStage,
    updateLead,
    deleteLead,
  };
};
