import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CampaignContext = createContext(null);

export const CampaignProvider = ({ children }) => {
  const [campaign, setCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]); // All campaigns user has access to
  const [userRole, setUserRole] = useState(null); // Role in current campaign
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeCampaigns();
  }, []);

  const initializeCampaigns = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!currentUser) {
        setNeedsSetup(true);
        setIsLoadingCampaign(false);
        return;
      }

      // Load all campaigns user is member of
      const campaignsList = [];
      if (currentUser.campaign_memberships && Array.isArray(currentUser.campaign_memberships)) {
        // User has new campaign_memberships structure
        const activeMemberships = currentUser.campaign_memberships.filter(m => m.status === 'active');
        
        for (const membership of activeMemberships) {
          const camp = await base44.entities.Campaign.list('name', 1000);
          const found = camp.find(c => c.id === membership.campaign_id);
          if (found) {
            campaignsList.push({
              ...found,
              userRole: membership.role,
            });
          }
        }
      } else if (currentUser.campaign_id) {
        // Fallback: user has old single campaign_id
        const camp = await base44.entities.Campaign.list('name', 1000);
        const found = camp.find(c => c.id === currentUser.campaign_id);
        if (found) {
          campaignsList.push({
            ...found,
            userRole: 'organiser', // Assume organiser for legacy users
          });
        }
      }

      setCampaigns(campaignsList);

      // Determine which campaign to load
      let activeCampaign = null;
      if (currentUser.default_campaign_id) {
        activeCampaign = campaignsList.find(c => c.id === currentUser.default_campaign_id);
      }
      if (!activeCampaign && campaignsList.length > 0) {
        activeCampaign = campaignsList[0];
      }

      if (activeCampaign) {
        setCampaign(activeCampaign);
        setUserRole(activeCampaign.userRole);
      } else {
        // User is not member of any campaigns
        setNeedsSetup(true);
      }

      setIsLoadingCampaign(false);
    } catch (err) {
      console.error('Campaign init error:', err);
      setIsLoadingCampaign(false);
    }
  };

  const switchCampaign = async (campaignId) => {
    const next = campaigns.find(c => c.id === campaignId);
    if (next) {
      setCampaign(next);
      setUserRole(next.userRole);
      // Update user's default campaign
      await base44.auth.updateMe({ default_campaign_id: campaignId });
    }
  };

  const createCampaign = async (campaignData) => {
    const newCampaign = await base44.entities.Campaign.create({
      ...campaignData,
      owner_email: user.email,
    });
    // Add creator as campaign_admin
    const updatedMemberships = [
      ...(user.campaign_memberships || []),
      {
        campaign_id: newCampaign.id,
        role: 'campaign_admin',
        added_date: new Date().toISOString(),
        status: 'active',
      },
    ];
    await base44.auth.updateMe({ campaign_memberships: updatedMemberships });
    setUser({ ...user, campaign_memberships: updatedMemberships });
    setCampaign({ ...newCampaign, userRole: 'campaign_admin' });
    setCampaigns([...campaigns, { ...newCampaign, userRole: 'campaign_admin' }]);
    return newCampaign;
  };

  const joinCampaign = async (inviteCodeOrCampaign) => {
    let targetCampaign = inviteCodeOrCampaign;
    if (typeof inviteCodeOrCampaign === 'string') {
      const campaigns = await base44.entities.Campaign.list('name', 1000);
      targetCampaign = campaigns.find(c => c.invite_code === inviteCodeOrCampaign);
      if (!targetCampaign) {
        throw new Error('Invalid invite code');
      }
    }
    // Add user as volunteer
    const updatedMemberships = [
      ...(user.campaign_memberships || []),
      {
        campaign_id: targetCampaign.id,
        role: 'volunteer',
        added_date: new Date().toISOString(),
        status: 'active',
      },
    ];
    await base44.auth.updateMe({ campaign_memberships: updatedMemberships });
    setUser({ ...user, campaign_memberships: updatedMemberships });
    setCampaign({ ...targetCampaign, userRole: 'volunteer' });
    setCampaigns([...campaigns, { ...targetCampaign, userRole: 'volunteer' }]);
    return targetCampaign;
  };

  const createAndJoinCampaign = async (campaignData) => {
    const newCampaign = await createCampaign(campaignData);
    return newCampaign;
  };

  const value = {
    campaign,
    campaigns,
    userRole,
    user,
    isLoadingCampaign,
    needsSetup,
    switchCampaign,
    createCampaign,
    createAndJoinCampaign,
    joinCampaign,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within CampaignProvider');
  }
  return context;
};