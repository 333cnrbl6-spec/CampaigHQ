import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Reports() {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.ContactInteraction.list(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.CampaignEvent.list(),
  });

  // Canvassing Stats
  const canvassedCount = contacts.filter(c => c.canvassed).length;
  const canvassPercent = contacts.length > 0 ? Math.round((canvassedCount / contacts.length) * 100) : 0;

  // Support Breakdown
  const supportBreakdown = [
    { name: 'Strong Supporter', value: contacts.filter(c => c.support_level === 'strong_supporter').length, fill: '#16a34a' },
    { name: 'Leaning', value: contacts.filter(c => c.support_level === 'leaning').length, fill: '#3b82f6' },
    { name: 'Undecided', value: contacts.filter(c => c.support_level === 'undecided').length, fill: '#eab308' },
    { name: 'Opposed', value: contacts.filter(c => c.support_level === 'opposed').length, fill: '#ef4444' },
    { name: 'Unknown', value: contacts.filter(c => c.support_level === 'unknown').length, fill: '#9ca3af' }
  ];

  // Interaction Types
  const interactionsByType = [
    { name: 'Door Knock', value: interactions.filter(i => i.type === 'door_knock').length },
    { name: 'Phone Call', value: interactions.filter(i => i.type === 'phone_call').length },
    { name: 'Email', value: interactions.filter(i => i.type === 'email').length },
    { name: 'Text/SMS', value: interactions.filter(i => i.type === 'text').length },
    { name: 'Meeting', value: interactions.filter(i => i.type === 'meeting').length }
  ].filter(d => d.value > 0);

  // Persuasion rate: contacts that changed from non-supporter to supporter/leaning
  const persuasionData = [
    { name: 'Strong Support', value: contacts.filter(c => c.support_level === 'strong_supporter' && c.canvassed).length, fill: '#16a34a' },
    { name: 'Leaning', value: contacts.filter(c => c.support_level === 'leaning' && c.canvassed).length, fill: '#3b82f6' },
    { name: 'Undecided', value: contacts.filter(c => c.support_level === 'undecided' && c.canvassed).length, fill: '#eab308' },
    { name: 'Opposed', value: contacts.filter(c => c.support_level === 'opposed' && c.canvassed).length, fill: '#ef4444' },
  ];
  const canvassedWithOutcome = persuasionData.reduce((s, d) => s + d.value, 0);
  const persuasionRate = canvassedWithOutcome > 0
    ? Math.round(((persuasionData[0].value + persuasionData[1].value) / canvassedWithOutcome) * 100)
    : 0;

  // Volunteers
  const volunteers = contacts.filter(c => c.volunteer);

  // Event Completion
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;

  const handleExportPDF = async () => {
    const element = document.getElementById('reports-content');
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('campaign-report.pdf');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-foreground">Campaign Reports</h1>
        <Button className="gap-2" onClick={handleExportPDF}>
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>

      <div id="reports-content" className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{canvassedCount}</div>
                <p className="text-sm text-muted-foreground mt-1">Canvassed ({canvassPercent}%)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{supportBreakdown[0].value}</div>
                <p className="text-sm text-muted-foreground mt-1">Strong Supporters</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{interactions.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Total Interactions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{volunteers.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Volunteers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Persuasion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Persuasion Rate (Canvassed Voters)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{persuasionRate}%</div>
                <p className="text-sm text-muted-foreground mt-1">Supporters + Leaners<br/>among canvassed voters</p>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={persuasionData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                      {persuasionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={supportBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {supportBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interaction Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={interactionsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Volunteer List */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteers ({volunteers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {volunteers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No volunteers signed up yet</p>
              ) : (
                volunteers.map((v) => (
                  <div key={v.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      {v.phone && <p className="text-xs text-muted-foreground">{v.phone}</p>}
                    </div>
                    <Badge variant="outline">{v.support_level}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Events Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{upcomingEvents}</div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedEvents}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">{events.length}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Export Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Contact List Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Address</th>
                    <th className="text-left py-2 px-3">Support</th>
                    <th className="text-left py-2 px-3">Canvassed</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-secondary/30">
                      <td className="py-2 px-3">{c.name}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{c.address}</td>
                      <td className="py-2 px-3">
                        <Badge className="text-xs">{c.support_level}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        {c.canvassed ? '✓' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}