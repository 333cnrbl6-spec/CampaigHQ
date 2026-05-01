import React, { useState } from 'react';
import { Shield, FileText, Trash2, Clock } from 'lucide-react';
import ConsentLog from '@/components/gdpr/ConsentLog';
import RightToBeForgotten from '@/components/gdpr/RightToBeForgotten';
import DataRetentionPolicy from '@/components/gdpr/DataRetentionPolicy';

const TABS = [
  { id: 'consent', label: 'Consent Log', icon: FileText, description: 'View & manage data consent status for all contacts' },
  { id: 'deletion', label: 'Right to Be Forgotten', icon: Trash2, description: 'Handle deletion requests and execute bulk removal' },
  { id: 'retention', label: 'Data Retention Policy', icon: Clock, description: 'Configure automated retention periods and run sweeps' },
];

export default function GdprCompliance() {
  const [activeTab, setActiveTab] = useState('consent');

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold">GDPR Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Manage data consent, handle right-to-be-forgotten requests, and configure data retention policies for voter contact records.
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'consent' && <ConsentLog />}
      {activeTab === 'deletion' && <RightToBeForgotten />}
      {activeTab === 'retention' && <DataRetentionPolicy />}
    </div>
  );
}