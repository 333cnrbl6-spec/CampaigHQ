import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Check } from 'lucide-react';

const CATEGORY_COLORS = {
  polling_station: 'bg-blue-100 text-blue-800',
  get_out_vote: 'bg-green-100 text-green-800',
  logistics: 'bg-orange-100 text-orange-800',
  comms: 'bg-purple-100 text-purple-800',
  safety: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function ElectionDay() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [formData, setFormData] = useState({ category: 'polling_station' });
  const [filterCategory, setFilterCategory] = useState('all');

  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['election_day_tasks'],
    queryFn: () => base44.entities.ElectionDayTask.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.ElectionDayTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election_day_tasks'] });
      setFormData({ category: 'polling_station' });
      setShowNewTask(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ElectionDayTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election_day_tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ElectionDayTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election_day_tasks'] });
    },
  });

  const handleAddTask = () => {
    if (formData.title && formData.category) {
      createTaskMutation.mutate(formData);
    }
  };

  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === filterCategory);

  const statusCounts = {
    planned: tasks.filter(t => t.status === 'planned').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground">Election Day Checklist</h1>
          <p className="text-muted-foreground mt-1">May 22, 2026 — Tyldesley & Mosley Common</p>
        </div>
        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Election Day Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  placeholder="e.g. Monitor Tyldesley Library polling station"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polling_station">Polling Station</SelectItem>
                    <SelectItem value="get_out_vote">Get Out The Vote</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="comms">Communications</SelectItem>
                    <SelectItem value="safety">Safety/Welfare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned To</label>
                <Input
                  placeholder="Name or email"
                  value={formData.assigned_to || ''}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="Polling station or location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    placeholder="6:30 AM"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    placeholder="10:00 PM"
                    value={formData.end_time || ''}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Any special instructions or notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="min-h-20"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
                <Button onClick={handleAddTask}>Add Task</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{statusCounts.planned}</div>
              <p className="text-sm text-muted-foreground mt-1">Planned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{statusCounts.in_progress}</div>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{statusCounts.completed}</div>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div>
        <label className="text-sm font-medium block mb-2">Filter by Category</label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="polling_station">Polling Station</SelectItem>
            <SelectItem value="get_out_vote">Get Out The Vote</SelectItem>
            <SelectItem value="logistics">Logistics</SelectItem>
            <SelectItem value="comms">Communications</SelectItem>
            <SelectItem value="safety">Safety/Welfare</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No tasks yet. Add one to get started.
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {task.status === 'completed' && <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge className={CATEGORY_COLORS[task.category]}>{task.category.replace('_', ' ')}</Badge>
                          {task.assigned_to && <Badge variant="outline">{task.assigned_to}</Badge>}
                          {task.location && <Badge variant="outline">{task.location}</Badge>}
                          {task.start_time && <Badge variant="outline">{task.start_time} - {task.end_time || 'TBD'}</Badge>}
                        </div>
                        {task.notes && <p className="text-sm text-muted-foreground mt-2">{task.notes}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Select value={task.status} onValueChange={(val) => updateTaskMutation.mutate({id: task.id, data: {status: val}})}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}