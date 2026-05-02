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
      if (!currentUser?.email) {
        setNeedsSetup(true);
        setIsLoadingCampaign(false);
        return;
      }

      setUser(currentUser);

      // Use campaign_memberships from current user session (already loaded by auth context)
      let userMemberships = Array.isArray(currentUser.campaign_memberships) ? currentUser.campaign_memberships : [];

      // Fetch all active campaigns
      let allCampaigns = [];
      try {
        allCampaigns = await base44.entities.Campaign.list('name', 1000);
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
        setIsLoadingCampaign(false);
        setNeedsSetup(true);
        return;
      }

      const activeCampaigns = Array.isArray(allCampaigns) ? allCampaigns.filter(c => c?.status === 'active') : [];
      const accessibleCampaigns = [];

      // 1. Check campaign_memberships (modern structure)
      if (Array.isArray(userMemberships) && userMemberships.length > 0) {
        for (const membership of userMemberships) {
          if (membership?.status === 'active' && membership?.campaign_id) {
            const campaign = activeCampaigns.find(c => c?.id === membership.campaign_id);
            if (campaign) {
              accessibleCampaigns.push({
                ...campaign,
                userRole: membership.role || 'volunteer',
              });
            }
          }
        }
      }

      // 2. Check if user is campaign owner (by owner_email)
      const ownedCampaigns = activeCampaigns.filter(c => c?.owner_email === currentUser.email);
      for (const owned of ownedCampaigns) {
        // Don't duplicate if already in memberships
        if (!accessibleCampaigns.find(c => c?.id === owned.id)) {
          accessibleCampaigns.push({
            ...owned,
            userRole: 'campaign_admin',
          });
        }
      }

      // 3. Fallback: if no memberships/ownership found but there's exactly ONE active campaign, auto-assign (for "Act as User" scenarios)
      if (accessibleCampaigns.length === 0 && activeCampaigns.length === 1) {
        console.warn(`⚠ User ${currentUser.email} has no campaign memberships, but found 1 active campaign. Auto-assigning for testing/demo.`);
        accessibleCampaigns.push({
          ...activeCampaigns[0],
          userRole: 'volunteer',
        });
      }

      setCampaigns(accessibleCampaigns);

      // Select campaign to load
      let selectedCampaign = null;

      // 1. Try default_campaign_id if set and valid
      if (currentUser.default_campaign_id) {
        selectedCampaign = accessibleCampaigns.find(c => c?.id === currentUser.default_campaign_id);
      }

      // 2. Fall back to first accessible campaign
      if (!selectedCampaign && accessibleCampaigns.length > 0) {
        selectedCampaign = accessibleCampaigns[0];
      }

      // Load campaign or show setup
      if (selectedCampaign?.id) {
        setCampaign(selectedCampaign);
        setUserRole(selectedCampaign.userRole);
        console.log(`✓ User ${currentUser.email} loaded into campaign: ${selectedCampaign.id}`);

        // Ensure user record is synced: set default_campaign_id and campaign_memberships if missing
        const hasDefaultSet = !!currentUser.default_campaign_id;
        const hasMembership = Array.isArray(userMemberships) && userMemberships.some(m => m?.campaign_id === selectedCampaign.id && m?.status === 'active');
        
        if (!hasDefaultSet || !hasMembership) {
          try {
            const updates = {
              default_campaign_id: selectedCampaign.id,
            };

            // Ensure campaign_memberships has an entry for this campaign
            if (!hasMembership) {
              updates.campaign_memberships = [
                ...(Array.isArray(userMemberships) ? userMemberships.filter(m => m?.status === 'active') : []),
                {
                  campaign_id: selectedCampaign.id,
                  role: selectedCampaign.userRole || 'volunteer',
                  added_date: new Date().toISOString(),
                  status: 'active',
                },
              ];
            } else {
              // Just update default if memberships are already correct
              updates.campaign_memberships = userMemberships;
            }

            await base44.auth.updateMe(updates);
            console.log(`✓ User record synced for ${currentUser.email}`);
          } catch (err) {
            console.warn('Could not sync user record (may be in "Act as User" mode), but campaign still loads:', err.message);
            // Continue anyway — user is still able to access the campaign
          }
        }
      } else {
        // No campaigns accessible — show setup
        console.warn(`⚠ User ${currentUser.email} has no accessible campaigns. Memberships found: ${userMemberships.length}, owned campaigns: ${ownedCampaigns.length}`);
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
    const newCampaignForCampaigns = { ...targetCampaign, userRole: 'volunteer' };
    setCampaign(newCampaignForCampaigns);
    setCampaigns([...campaigns, newCampaignForCampaigns]);
    return targetCampaign;
  };

  const createAndJoinCampaign = async (campaignData) => {
    const newCampaign = await createCampaign(campaignData);
    // After creation, ensure campaign is loaded into context  
    setCampaign({ ...newCampaign, userRole: 'campaign_admin' });
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