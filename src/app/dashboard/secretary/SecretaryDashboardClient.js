'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AnimatedSection from '../../../components/AnimatedSection';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useLeads } from '../../../hooks/useLeads';

// ====== CONSTANTS ======

const TABS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'listings', label: 'Listings' },
  { key: 'reports', label: 'Reports' },
  { key: 'resources', label: 'Resources' },
];

const STAGES = [
  { key: 'inquiry', label: 'Inquiry', color: 'blue', icon: '📞' },
  { key: 'site_visit', label: 'Site Visit', color: 'purple', icon: '🏠' },
  { key: 'negotiation', label: 'Negotiation', color: 'amber', icon: '🤝' },
  { key: 'closed_won', label: 'Closed Won', color: 'green', icon: '✅' },
  { key: 'closed_lost', label: 'Lost', color: 'red', icon: '❌' },
];

const STAGE_STYLES = {
  inquiry: 'bg-blue-50 text-blue-700 border-blue-200',
  site_visit: 'bg-purple-50 text-purple-700 border-purple-200',
  negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
  closed_won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed_lost: 'bg-red-50 text-red-700 border-red-200',
};

const STAGE_BORDER = {
  inquiry: 'border-blue-200',
  site_visit: 'border-purple-200',
  negotiation: 'border-amber-200',
  closed_won: 'border-emerald-200',
  closed_lost: 'border-red-200',
};

const formatPrice = (price) => {
  if (!price) return 'TBD';
  const num = Number(price);
  if (num >= 1000000) return `KES ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `KES ${(num / 1000).toFixed(0)}K`;
  return `KES ${num.toLocaleString()}`;
};

const formatCommission = (amount) => {
  if (!amount) return 'TBD';
  const num = Number(amount);
  const usd = num / 130;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${formatPrice(num)})`;
};

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

// ====== MAIN COMPONENT ======

const SecretaryDashboardClient = () => {
  const { user, userProfile } = useAuth();
  const { leads, loading: leadsLoading, fetchLeads, createLead, updateLeadStage, updateLead, deleteLead } = useLeads();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [pipelineView, setPipelineView] = useState('kanban');
  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState([]);

  // Lead form state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [leadFormData, setLeadFormData] = useState({
    client_name: '',
    client_phone: '',
    client_whatsapp: '',
    client_email: '',
    listing_id: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Stage change modal
  const [stageChangeModal, setStageChangeModal] = useState(null);
  const [stageNotes, setStageNotes] = useState('');

  // Listings tab filters
  const [listingSearch, setListingSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [developerFilter, setDeveloperFilter] = useState('all');

  // Resources tab
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savedPdfs, setSavedPdfs] = useState([]);
  const [selectedPdfListing, setSelectedPdfListing] = useState('');
  const [selectedPdfLead, setSelectedPdfLead] = useState('');

  // ====== FETCH FUNCTIONS ======

  const fetchListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, location, address, sale_price, scraped_source, property_type, bedrooms, bathrooms, square_feet, amenities, features, description, images, scraped_url, contact_phone, contact_whatsapp, is_scraped')
        .eq('is_scraped', true)
        .eq('verification_status', 'verified')
        .order('scraped_source', { ascending: true });

      if (error) throw error;
      setAllListings(data || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  }, []);

  const fetchSavedPdfs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage
        .from('secretary-pdfs')
        .list(user.id, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;
      setSavedPdfs(data || []);
    } catch (err) {
      console.error('Error fetching PDFs:', err);
    }
  }, [user]);

  // ====== INITIAL LOAD ======

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLeads(), fetchListings(), fetchSavedPdfs()]);
      setLoading(false);
    };
    load();
  }, [fetchLeads, fetchListings, fetchSavedPdfs]);

  // ====== REALTIME ======

  useEffect(() => {
    const channel = supabase
      .channel('secretary_leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  // ====== COMPUTED STATS ======

  const stats = useMemo(() => {
    const byStage = {};
    STAGES.forEach(s => { byStage[s.key] = 0; });
    leads.forEach(l => { byStage[l.stage] = (byStage[l.stage] || 0) + 1; });

    const wonLeads = leads.filter(l => l.stage === 'closed_won');
    const activeLeads = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.stage));
    const totalLeads = leads.length;
    const closedLeads = leads.filter(l => ['closed_won', 'closed_lost'].includes(l.stage));

    const earnedCommission = wonLeads.reduce((sum, l) => sum + (Number(l.commission_amount) || 0), 0);
    const pendingCommission = leads
      .filter(l => l.stage === 'negotiation')
      .reduce((sum, l) => sum + (Number(l.commission_amount) || 0), 0);
    const pipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.commission_amount) || 0), 0);

    const conversionRate = closedLeads.length > 0
      ? ((wonLeads.length / closedLeads.length) * 100).toFixed(0)
      : 0;

    // Average days to close for won deals
    const avgDaysToClose = wonLeads.length > 0
      ? Math.round(wonLeads.reduce((sum, l) => {
          const start = new Date(l.inquiry_at || l.created_at);
          const end = new Date(l.closed_at || l.updated_at);
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / wonLeads.length)
      : 0;

    return { byStage, totalLeads, earnedCommission, pendingCommission, pipelineValue, conversionRate, avgDaysToClose };
  }, [leads]);

  // ====== LEAD FORM HANDLERS ======

  const resetLeadForm = () => {
    setLeadFormData({ client_name: '', client_phone: '', client_whatsapp: '', client_email: '', listing_id: '', notes: '' });
    setEditingLead(null);
    setFormError('');
  };

  const openNewLeadForm = (preselectedListingId = '') => {
    resetLeadForm();
    if (preselectedListingId) {
      setLeadFormData(prev => ({ ...prev, listing_id: preselectedListingId }));
    }
    setShowLeadForm(true);
  };

  const openEditLeadForm = (lead) => {
    setEditingLead(lead);
    setLeadFormData({
      client_name: lead.client_name || '',
      client_phone: lead.client_phone || '',
      client_whatsapp: lead.client_whatsapp || '',
      client_email: lead.client_email || '',
      listing_id: lead.listing_id || '',
      notes: lead.notes || '',
    });
    setShowLeadForm(true);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadFormData.client_name.trim()) {
      setFormError('Client name is required');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editingLead) {
        await updateLead(editingLead.id, {
          client_name: leadFormData.client_name,
          client_phone: leadFormData.client_phone,
          client_whatsapp: leadFormData.client_whatsapp,
          client_email: leadFormData.client_email,
          listing_id: leadFormData.listing_id || null,
          notes: leadFormData.notes,
        });
      } else {
        await createLead({
          client_name: leadFormData.client_name,
          client_phone: leadFormData.client_phone,
          client_whatsapp: leadFormData.client_whatsapp,
          client_email: leadFormData.client_email,
          listing_id: leadFormData.listing_id || null,
          notes: leadFormData.notes,
        });
      }
      setShowLeadForm(false);
      resetLeadForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStageChange = async (leadId, newStage) => {
    setStageChangeModal({ leadId, newStage });
    setStageNotes('');
  };

  const confirmStageChange = async () => {
    if (!stageChangeModal) return;
    try {
      await updateLeadStage(stageChangeModal.leadId, stageChangeModal.newStage, stageNotes);
      setStageChangeModal(null);
      setStageNotes('');
    } catch (err) {
      console.error('Stage change error:', err);
    }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      await deleteLead(leadId);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // ====== PDF GENERATION ======

  const generatePropertyPdf = async (listing) => {
    if (!listing || !user) return;
    setGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header bar
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setFillColor(201, 145, 43);
      doc.rect(0, 35, 210, 1.5, 'F');

      doc.setTextColor(201, 145, 43);
      doc.setFontSize(22);
      doc.text('HORNZA', 105, 16, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text('Premium Somali Real Estate in Kenya', 105, 25, { align: 'center' });

      // Property title
      let y = 48;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      const titleLines = doc.splitTextToSize(listing.title || 'Property', 170);
      doc.text(titleLines, 20, y);
      y += titleLines.length * 8 + 4;

      // Location & Developer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Location: ${listing.address || listing.location || 'N/A'}`, 20, y);
      y += 6;
      doc.text(`Developer: ${listing.scraped_source || 'N/A'}`, 20, y);
      y += 6;
      doc.text(`Type: ${listing.property_type || 'N/A'} | Bedrooms: ${listing.bedrooms || 'N/A'} | Bathrooms: ${listing.bathrooms || 'N/A'}`, 20, y);
      y += 6;
      if (listing.square_feet) {
        doc.text(`Size: ${listing.square_feet.toLocaleString()} sqft`, 20, y);
        y += 6;
      }

      // Price box
      y += 4;
      doc.setFillColor(245, 245, 240);
      doc.roundedRect(20, y, 170, 18, 3, 3, 'F');
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text('Price:', 28, y + 12);
      doc.setTextColor(201, 145, 43);
      doc.setFontSize(14);
      const priceText = listing.sale_price ? `KES ${Number(listing.sale_price).toLocaleString()} (~$${Math.round(Number(listing.sale_price) / 130).toLocaleString()})` : 'Price on Request';
      doc.text(priceText, 55, y + 12);
      y += 26;

      // Description
      if (listing.description) {
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Description', 20, y);
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const descLines = doc.splitTextToSize(listing.description, 170);
        doc.text(descLines, 20, y);
        y += descLines.length * 5 + 6;
      }

      // Features
      if (listing.features && listing.features.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Features', 20, y);
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        listing.features.forEach(f => {
          doc.text(`• ${f}`, 24, y);
          y += 5;
        });
        y += 4;
      }

      // Amenities
      if (listing.amenities && listing.amenities.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Amenities', 20, y);
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const amenityText = listing.amenities.join(' • ');
        const amenityLines = doc.splitTextToSize(amenityText, 170);
        doc.text(amenityLines, 20, y);
        y += amenityLines.length * 5 + 6;
      }

      // Contact
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 280, 210, 17, 'F');
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text('Hornza Real Estate | Contact us for site visits and more information', 105, 288, { align: 'center' });
      if (listing.contact_phone) {
        doc.text(`Developer: ${listing.contact_phone}`, 105, 293, { align: 'center' });
      }

      // Save to storage
      const pdfBlob = doc.output('blob');
      const fileName = `${user.id}/property-${listing.id}-${Date.now()}.pdf`;
      await supabase.storage.from('secretary-pdfs').upload(fileName, pdfBlob, { contentType: 'application/pdf' });

      // Also download
      doc.save(`${(listing.title || 'Property').replace(/[^a-zA-Z0-9]/g, '-')}-summary.pdf`);

      await fetchSavedPdfs();
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateProposalPdf = async (lead) => {
    if (!lead || !user) return;
    setGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const listing = lead.listing;

      // Header
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setFillColor(201, 145, 43);
      doc.rect(0, 35, 210, 1.5, 'F');
      doc.setTextColor(201, 145, 43);
      doc.setFontSize(22);
      doc.text('HORNZA', 105, 16, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text('Client Proposal', 105, 25, { align: 'center' });

      let y = 48;

      // Client info
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('Prepared For', 20, y);
      y += 7;
      doc.setFontSize(14);
      doc.text(lead.client_name, 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      if (lead.client_phone) { doc.text(`Phone: ${lead.client_phone}`, 20, y); y += 5; }
      if (lead.client_email) { doc.text(`Email: ${lead.client_email}`, 20, y); y += 5; }
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, y);
      y += 12;

      // Property details
      if (listing) {
        doc.setFillColor(245, 245, 240);
        doc.roundedRect(15, y, 180, 55, 3, 3, 'F');
        y += 10;
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Recommended Property', 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(201, 145, 43);
        const titleLines = doc.splitTextToSize(listing.title || 'Property', 165);
        doc.text(titleLines, 20, y);
        y += titleLines.length * 6 + 4;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`Location: ${listing.address || listing.location || 'N/A'}`, 20, y); y += 5;
        doc.text(`Developer: ${listing.scraped_source || 'N/A'}`, 20, y); y += 5;
        doc.text(`Type: ${listing.property_type || 'N/A'} | ${listing.bedrooms || '?'}BR / ${listing.bathrooms || '?'}BA`, 20, y); y += 5;

        y += 10;

        // Pricing
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Pricing', 20, y); y += 8;
        doc.setFontSize(10);
        if (listing.sale_price) {
          const kes = Number(listing.sale_price);
          const usd = Math.round(kes / 130);
          doc.text(`Sale Price: KES ${kes.toLocaleString()} (~USD $${usd.toLocaleString()})`, 20, y); y += 6;
        } else {
          doc.text('Sale Price: On Request', 20, y); y += 6;
        }

        // Amenities summary
        if (listing.amenities && listing.amenities.length > 0) {
          y += 6;
          doc.setFontSize(12);
          doc.setTextColor(30, 30, 30);
          doc.text('Key Amenities', 20, y); y += 7;
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          const amenText = listing.amenities.slice(0, 10).join(' • ');
          const amenLines = doc.splitTextToSize(amenText, 170);
          doc.text(amenLines, 20, y);
          y += amenLines.length * 5;
        }
      }

      // Notes
      if (lead.notes) {
        y += 10;
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text('Notes', 20, y); y += 7;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const noteLines = doc.splitTextToSize(lead.notes, 170);
        doc.text(noteLines, 20, y);
      }

      // Footer
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 280, 210, 17, 'F');
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text('Hornza Real Estate | This proposal is confidential and prepared exclusively for the named client.', 105, 288, { align: 'center' });

      const pdfBlob = doc.output('blob');
      const fileName = `${user.id}/proposal-${lead.id}-${Date.now()}.pdf`;
      await supabase.storage.from('secretary-pdfs').upload(fileName, pdfBlob, { contentType: 'application/pdf' });
      doc.save(`Proposal-${lead.client_name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
      await fetchSavedPdfs();
    } catch (err) {
      console.error('Proposal PDF error:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const deletePdf = async (fileName) => {
    if (!user) return;
    try {
      await supabase.storage.from('secretary-pdfs').remove([`${user.id}/${fileName}`]);
      await fetchSavedPdfs();
    } catch (err) {
      console.error('Delete PDF error:', err);
    }
  };

  const getPdfUrl = (fileName) => {
    const { data } = supabase.storage.from('secretary-pdfs').getPublicUrl(`${user?.id}/${fileName}`);
    return data?.publicUrl || '#';
  };

  // ====== FILTERED LISTINGS ======

  const filteredListings = useMemo(() => {
    return allListings.filter(l => {
      if (listingSearch) {
        const q = listingSearch.toLowerCase();
        if (!(l.title || '').toLowerCase().includes(q) && !(l.location || '').toLowerCase().includes(q) && !(l.scraped_source || '').toLowerCase().includes(q)) return false;
      }
      if (locationFilter !== 'all' && l.location !== locationFilter) return false;
      if (developerFilter !== 'all' && l.scraped_source !== developerFilter) return false;
      return true;
    });
  }, [allListings, listingSearch, locationFilter, developerFilter]);

  const uniqueLocations = useMemo(() => [...new Set(allListings.map(l => l.location).filter(Boolean))].sort(), [allListings]);
  const uniqueDevelopers = useMemo(() => [...new Set(allListings.map(l => l.scraped_source).filter(Boolean))].sort(), [allListings]);

  // ====== REPORTS DATA ======

  const reportsByDeveloper = useMemo(() => {
    const map = {};
    leads.forEach(lead => {
      const dev = lead.listing?.scraped_source || 'Unknown';
      if (!map[dev]) map[dev] = { leads: 0, won: 0, commission: 0 };
      map[dev].leads++;
      if (lead.stage === 'closed_won') {
        map[dev].won++;
        map[dev].commission += Number(lead.commission_amount) || 0;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].commission - a[1].commission);
  }, [leads]);

  // ====== LOADING STATE ======

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="space-y-3 w-64">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

  // ====== RENDER ======

  return (
    <div className="min-h-screen bg-gray-50 pt-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-6 relative z-10 max-w-7xl">
        <AnimatedSection>
          {/* Header */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Secretary Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {userProfile?.full_name || 'Secretary'}. Track your leads and commissions.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalLeads}</div>
              <div className="text-xs text-gray-500">Total Leads</div>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{formatCommission(stats.earnedCommission)}</div>
              <div className="text-xs text-gray-500">Earned</div>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{formatCommission(stats.pendingCommission)}</div>
              <div className="text-xs text-gray-500">In Negotiation</div>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.conversionRate}%</div>
              <div className="text-xs text-gray-500">Win Rate</div>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.avgDaysToClose}</div>
              <div className="text-xs text-gray-500">Avg Days to Close</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.key === 'pipeline' && leads.length > 0 && (
                  <span className="ml-2 text-xs opacity-70">({leads.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* ====== PIPELINE TAB ====== */}
          {activeTab === 'pipeline' && (
            <div>
              {/* Pipeline Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPipelineView('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pipelineView === 'kanban' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setPipelineView('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pipelineView === 'list' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    List
                  </button>
                </div>
                <button
                  onClick={() => openNewLeadForm()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all"
                >
                  + Add Lead
                </button>
              </div>

              {/* Kanban View */}
              {pipelineView === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {STAGES.map(stage => {
                    const stageLeads = leads.filter(l => l.stage === stage.key);
                    return (
                      <div key={stage.key} className={`bg-gray-50 rounded-xl border ${STAGE_BORDER[stage.key]} p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">
                            {stage.icon} {stage.label}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STAGE_STYLES[stage.key]}`}>
                            {stageLeads.length}
                          </span>
                        </div>
                        <div className="space-y-2 min-h-[100px]">
                          {stageLeads.map(lead => (
                            <motion.div
                              key={lead.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white border border-gray-200 shadow-sm rounded-lg p-3 hover:border-emerald-300 transition-all cursor-pointer group"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900 truncate">{lead.client_name}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button onClick={() => openEditLeadForm(lead)} className="text-gray-400 hover:text-emerald-600 text-xs">Edit</button>
                                  <button onClick={() => handleDeleteLead(lead.id)} className="text-gray-400 hover:text-red-600 text-xs">Del</button>
                                </div>
                              </div>
                              {lead.listing && (
                                <p className="text-xs text-gray-500 truncate mb-1">{lead.listing.title}</p>
                              )}
                              {lead.client_phone && (
                                <p className="text-xs text-gray-400">{lead.client_phone}</p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-emerald-700 font-medium">
                                  {lead.commission_amount ? formatCommission(lead.commission_amount) : 'TBD'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {daysSince(lead[`${stage.key === 'closed_won' || stage.key === 'closed_lost' ? 'closed' : stage.key}_at`] || lead.updated_at)}d
                                </span>
                              </div>
                              {/* Stage move dropdown */}
                              {!['closed_won', 'closed_lost'].includes(lead.stage) && (
                                <select
                                  className="mt-2 w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-emerald-500"
                                  value=""
                                  onChange={(e) => { if (e.target.value) handleStageChange(lead.id, e.target.value); }}
                                >
                                  <option value="">Move to...</option>
                                  {STAGES.filter(s => s.key !== lead.stage).map(s => (
                                    <option key={s.key} value={s.key}>{s.label}</option>
                                  ))}
                                </select>
                              )}
                            </motion.div>
                          ))}
                          {stageLeads.length === 0 && (
                            <div className="text-center text-gray-400 text-xs py-6">No leads</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View */}
              {pipelineView === 'list' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Phone</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Property</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Stage</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Commission</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Days</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                              No leads yet. Click &quot;+ Add Lead&quot; to create your first lead.
                            </td>
                          </tr>
                        ) : (
                          leads.map(lead => (
                            <motion.tr
                              key={lead.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{lead.client_name}</div>
                                {lead.client_email && <div className="text-xs text-gray-500">{lead.client_email}</div>}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{lead.client_phone || '—'}</td>
                              <td className="px-4 py-3">
                                <span className="text-gray-700 text-xs">{lead.listing?.title || 'No property'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full border ${STAGE_STYLES[lead.stage]}`}>
                                  {STAGES.find(s => s.key === lead.stage)?.label || lead.stage}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-emerald-700 text-xs font-medium">
                                {lead.commission_amount ? formatCommission(lead.commission_amount) : 'TBD'}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">
                                {daysSince(lead.created_at)}d
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {!['closed_won', 'closed_lost'].includes(lead.stage) && (
                                    <select
                                      className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-emerald-500"
                                      value=""
                                      onChange={(e) => { if (e.target.value) handleStageChange(lead.id, e.target.value); }}
                                    >
                                      <option value="">Move...</option>
                                      {STAGES.filter(s => s.key !== lead.stage).map(s => (
                                        <option key={s.key} value={s.key}>{s.label}</option>
                                      ))}
                                    </select>
                                  )}
                                  <button onClick={() => openEditLeadForm(lead)} className="text-gray-500 hover:text-emerald-600 text-xs">Edit</button>
                                  <button onClick={() => handleDeleteLead(lead.id)} className="text-gray-500 hover:text-red-600 text-xs">Del</button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====== LISTINGS TAB ====== */}
          {activeTab === 'listings' && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 min-w-[200px]"
                />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Locations</option>
                  {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select
                  value={developerFilter}
                  onChange={(e) => setDeveloperFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Developers</option>
                  {uniqueDevelopers.map(dev => <option key={dev} value={dev}>{dev}</option>)}
                </select>
              </div>

              <p className="text-gray-500 text-xs mb-4">{filteredListings.length} listings</p>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map(listing => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight flex-1">{listing.title}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                        {listing.property_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{listing.location} — {listing.scraped_source}</div>
                    {listing.bedrooms > 0 && (
                      <div className="text-xs text-gray-500 mb-2">
                        {listing.bedrooms}BR / {listing.bathrooms}BA
                        {listing.square_feet ? ` · ${listing.square_feet.toLocaleString()} sqft` : ''}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-emerald-700 font-semibold text-sm">{formatPrice(listing.sale_price)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generatePropertyPdf(listing)}
                          disabled={generatingPdf}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-all"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => openNewLeadForm(listing.id)}
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded transition-all"
                        >
                          + Lead
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ====== REPORTS TAB ====== */}
          {activeTab === 'reports' && (
            <div>
              {/* Commission Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <div className="text-sm text-gray-500 mb-1">Total Earned</div>
                  <div className="text-2xl font-bold text-emerald-700">{formatCommission(stats.earnedCommission)}</div>
                  <div className="text-xs text-gray-500 mt-1">{leads.filter(l => l.stage === 'closed_won').length} closed deals</div>
                </div>
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <div className="text-sm text-gray-500 mb-1">In Negotiation</div>
                  <div className="text-2xl font-bold text-amber-700">{formatCommission(stats.pendingCommission)}</div>
                  <div className="text-xs text-gray-500 mt-1">{leads.filter(l => l.stage === 'negotiation').length} deals in progress</div>
                </div>
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <div className="text-sm text-gray-500 mb-1">Pipeline Value</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCommission(stats.pipelineValue)}</div>
                  <div className="text-xs text-gray-500 mt-1">{leads.filter(l => !['closed_won', 'closed_lost'].includes(l.stage)).length} active leads</div>
                </div>
              </div>

              {/* Pipeline Funnel */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Funnel</h3>
                <div className="space-y-3">
                  {STAGES.map(stage => {
                    const count = stats.byStage[stage.key] || 0;
                    const maxCount = Math.max(...Object.values(stats.byStage), 1);
                    const width = (count / maxCount) * 100;
                    return (
                      <div key={stage.key} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-24">{stage.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              stage.key === 'inquiry' ? 'bg-blue-200' :
                              stage.key === 'site_visit' ? 'bg-purple-200' :
                              stage.key === 'negotiation' ? 'bg-amber-200' :
                              stage.key === 'closed_won' ? 'bg-emerald-200' :
                              'bg-red-200'
                            } flex items-center px-2`}
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="text-xs text-gray-700 font-medium">{count}</span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Developer Breakdown */}
              {reportsByDeveloper.length > 0 && (
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">By Developer</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-y border-gray-200">
                          <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium uppercase">Developer</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium uppercase">Leads</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium uppercase">Won</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium uppercase">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsByDeveloper.map(([dev, data]) => (
                          <tr key={dev} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">{dev}</td>
                            <td className="px-4 py-2 text-gray-600 text-center">{data.leads}</td>
                            <td className="px-4 py-2 text-emerald-700 text-center">{data.won}</td>
                            <td className="px-4 py-2 text-emerald-700 text-right font-medium">{data.commission > 0 ? formatCommission(data.commission) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====== RESOURCES TAB ====== */}
          {activeTab === 'resources' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Property Summary PDF */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Property Summary PDF</h3>
                  <p className="text-xs text-gray-500 mb-4">Generate a branded property sheet for a listing.</p>
                  <select
                    value={selectedPdfListing}
                    onChange={(e) => setSelectedPdfListing(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none mb-3"
                  >
                    <option value="">Select a listing...</option>
                    {allListings.map(l => (
                      <option key={l.id} value={l.id}>{l.title} — {l.scraped_source}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const listing = allListings.find(l => l.id === selectedPdfListing);
                      if (listing) generatePropertyPdf(listing);
                    }}
                    disabled={!selectedPdfListing || generatingPdf}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingPdf ? 'Generating...' : 'Generate & Download'}
                  </button>
                </div>

                {/* Client Proposal PDF */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Client Proposal PDF</h3>
                  <p className="text-xs text-gray-500 mb-4">Generate a personalized proposal for a lead.</p>
                  <select
                    value={selectedPdfLead}
                    onChange={(e) => setSelectedPdfLead(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none mb-3"
                  >
                    <option value="">Select a lead...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.client_name} — {l.listing?.title || 'No property'}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const lead = leads.find(l => l.id === selectedPdfLead);
                      if (lead) generateProposalPdf(lead);
                    }}
                    disabled={!selectedPdfLead || generatingPdf}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingPdf ? 'Generating...' : 'Generate & Download'}
                  </button>
                </div>
              </div>

              {/* Saved PDFs */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Saved Documents ({savedPdfs.length})</h3>
                {savedPdfs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No documents generated yet. Use the forms above to create PDFs.</p>
                ) : (
                  <div className="space-y-2">
                    {savedPdfs.map(pdf => (
                      <div key={pdf.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate">{pdf.name}</div>
                          <div className="text-xs text-gray-500">
                            {pdf.created_at ? new Date(pdf.created_at).toLocaleDateString('en-GB') : ''}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <a
                            href={getPdfUrl(pdf.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded transition-all"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => deletePdf(pdf.name)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatedSection>
      </div>

      {/* ====== LEAD FORM MODAL ====== */}
      <AnimatePresence>
        {showLeadForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowLeadForm(false); resetLeadForm(); }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingLead ? 'Edit Lead' : 'New Lead'}
              </h2>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={leadFormData.client_name}
                    onChange={(e) => setLeadFormData(p => ({ ...p, client_name: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={leadFormData.client_phone}
                      onChange={(e) => setLeadFormData(p => ({ ...p, client_phone: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="+254..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 font-medium mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={leadFormData.client_whatsapp}
                      onChange={(e) => setLeadFormData(p => ({ ...p, client_whatsapp: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="+254..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={leadFormData.client_email}
                    onChange={(e) => setLeadFormData(p => ({ ...p, client_email: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="client@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Interested Property</label>
                  <select
                    value={leadFormData.listing_id}
                    onChange={(e) => setLeadFormData(p => ({ ...p, listing_id: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select a property...</option>
                    {allListings.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.title} — {formatPrice(l.sale_price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 font-medium mb-1">Notes</label>
                  <textarea
                    value={leadFormData.notes}
                    onChange={(e) => setLeadFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowLeadForm(false); resetLeadForm(); }}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : editingLead ? 'Update Lead' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== STAGE CHANGE CONFIRMATION ====== */}
      <AnimatePresence>
        {stageChangeModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setStageChangeModal(null)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Move to {STAGES.find(s => s.key === stageChangeModal.newStage)?.label}</h3>
              <p className="text-sm text-gray-500 mb-4">Add a note about this stage change (optional).</p>
              <textarea
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none mb-4"
                rows={3}
                placeholder="e.g. Client confirmed site visit for Thursday..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStageChangeModal(null)}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStageChange}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
                >
                  Confirm Move
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecretaryDashboardClient;
