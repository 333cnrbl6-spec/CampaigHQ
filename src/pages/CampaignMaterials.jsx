import React, { useState } from 'react';
import { FileText, Printer, Download, Leaf, Users, Home, Zap, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeafletTemplate from '@/components/materials/LeafletTemplate';
import PosterTemplate from '@/components/materials/PosterTemplate';
import DoorCardTemplate from '@/components/materials/DoorCardTemplate';
import PolicySheetTemplate from '@/components/materials/PolicySheetTemplate';

export default function CampaignMaterials() {
  const [selectedMaterial, setSelectedMaterial] = useState('leaflet');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Download functionality would integrate with your app to generate PDFs');
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Campaign Materials</h1>
        <p className="text-muted-foreground mt-1">Print-ready election materials for Paul Binns - Tyldesley & Mosley Common</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Material Tabs */}
      <Tabs value={selectedMaterial} onValueChange={setSelectedMaterial} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="leaflet" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Leaflet</span>
          </TabsTrigger>
          <TabsTrigger value="poster" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Poster</span>
          </TabsTrigger>
          <TabsTrigger value="doorcard" className="flex items-center gap-2">
            <Vote className="w-4 h-4" />
            <span className="hidden sm:inline">Door Card</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            <span className="hidden sm:inline">Policies</span>
          </TabsTrigger>
        </TabsList>

        {/* Leaflet */}
        <TabsContent value="leaflet" className="space-y-4">
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <LeafletTemplate />
          </div>
        </TabsContent>

        {/* Poster */}
        <TabsContent value="poster" className="space-y-4">
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <PosterTemplate />
          </div>
        </TabsContent>

        {/* Door Card */}
        <TabsContent value="doorcard" className="space-y-4">
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <DoorCardTemplate />
          </div>
        </TabsContent>

        {/* Policy Sheet */}
        <TabsContent value="policies" className="space-y-4">
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <PolicySheetTemplate />
          </div>
        </TabsContent>
      </Tabs>

      {/* Print Guidance */}
      <div className="mt-12 bg-secondary/30 rounded-lg border border-secondary p-6">
        <h2 className="font-heading text-lg font-bold mb-4">Printing Guidance</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              A4 Leaflet
            </h3>
            <p className="text-muted-foreground">Print on 100gsm gloss or silk stock. Fold in thirds for DL envelope. Recommended print run: 5,000+</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              A3 Poster
            </h3>
            <p className="text-muted-foreground">Print on 130gsm or 150gsm poster stock. Ideal for lamposts and community notice boards.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Vote className="w-4 h-4" />
              Door Cards
            </h3>
            <p className="text-muted-foreground">A6 (148×105mm) pre-cut cards. Print double-sided on 250gsm card stock. Perfect for door-knocking.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Policy Sheets
            </h3>
            <p className="text-muted-foreground">A4 detailed policy information. Print on white or recycled stock. Hand out at surgeries and events.</p>
          </div>
        </div>
      </div>

      {/* About Paul Binns */}
      <div className="mt-8 bg-primary/5 rounded-lg border border-primary/20 p-6">
        <h2 className="font-heading text-lg font-bold mb-3">About Paul Binns</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Green Party candidate for Tyldesley & Mosley Common. Committed to building a fairer, greener future for our ward and country.
        </p>
        <p className="text-sm text-muted-foreground">
          All campaign materials are based on the official Green Party 2024 General Election Manifesto and designed to reflect the party's core values of environmental sustainability, social justice, and economic fairness.
        </p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}