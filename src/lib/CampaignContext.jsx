import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const CampaignContext = createContext();

export const CampaignProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCampaign();
    } else {
      setIsLoadingCampaign(false);
    }
  }, [isAuthenticated, user]);

  const loadCampaign = async () => {
    setIsLoadingCampaign(true);
    try {
      // Super-admins (platform-level) can see everything — no campaign required
      if (user.role === 'admin' && !user.campaign_id) {
        setNeedsSetup(false);
        setCampaign(null); // null = sees all (super-admin)
        setIsLoadingCampaign(false);
        return;
      }

      if (!user.campaign_id) {
        // User has no campaign — send to setup
        setNeedsSetup(true);
        setIsLoadingCampaign(false);
        return;
      }

      const campaigns = await base44.entities.Campaign.filter({ id: user.campaign_id });
      if (campaigns.length > 0) {
        setCampaign(campaigns[0]);
        setNeedsSetup(false);
      } else {
        setNeedsSetup(true);
      }
    } catch (e) {
      console.error('Failed to load campaign:', e);
      setNeedsSetup(true);
    }
    setIsLoadingCampaign(false);
  };

  const joinCampaign = async (campaignRecord) => {
    await base44.auth.updateMe({ campaign_id: campaignRecord.id, campaign_role: 'canvasser' });
    setCampaign(campaignRecord);
    setNeedsSetup(false);
  };

  const createAndJoinCampaign = async (campaignData) => {
    const newCampaign = await base44.entities.Campaign.create({
      ...campaignData,
      owner_email: user.email,
    });
    await base44.auth.updateMe({ campaign_id: newCampaign.id, campaign_role: 'campaign_admin' });
    setCampaign(newCampaign);
    setNeedsSetup(false);
    return newCampaign;
  };

  // The campaign_id to use when reading/writing data.
  // null means super-admin — they can pass no filter or filter by choice.
  const activeCampaignId = campaign?.id ?? null;

  return (
    <CampaignContext.Provider value={{
      campaign,
      activeCampaignId,
      isLoadingCampaign,
      needsSetup,
      loadCampaign,
      joinCampaign,
      createAndJoinCampaign,
    }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
};