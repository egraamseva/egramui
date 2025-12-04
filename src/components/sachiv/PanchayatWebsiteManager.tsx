import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Copy, GripVertical, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SectionEditor } from '../admin/SectionEditor';
import { DynamicSectionRenderer } from '../main/DynamicSectionRenderer';
import { toast } from 'sonner';
import { panchayatWebsiteApi } from '../../routes/api';
import type { PanchayatWebsiteSection } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';

function SectionItem({
  section,
  index,
  onEdit,
  onDelete,
  onToggleVisibility,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: {
  section: PanchayatWebsiteSection;
  index: number;
  onEdit: (section: PanchayatWebsiteSection) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const getSectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'HERO': 'bg-blue-100 text-blue-800',
      'STATS': 'bg-green-100 text-green-800',
      'GALLERY': 'bg-purple-100 text-purple-800',
      'FAQ': 'bg-orange-100 text-orange-800',
      'FORM': 'bg-pink-100 text-pink-800',
      'VIDEO': 'bg-red-100 text-red-800',
      'TESTIMONIALS': 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className={`bg-white rounded-lg border-2 transition-all ${
        isDragging ? 'border-primary opacity-50' : 'border-[#E5E5E5] hover:border-primary/50'
      }`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Drag Handle and Thumbnail */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="cursor-move text-muted-foreground hover:text-primary">
              <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            {/* Preview Thumbnail */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded border border-[#E5E5E5] overflow-hidden bg-gray-50 flex items-center justify-center">
              {section.imageUrl ? (
                <ImageWithFallback
                  src={section.imageUrl}
                  alt={section.title || section.sectionType}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${getSectionTypeColor(section.sectionType)}`}>
                  <span className="text-[10px] sm:text-xs font-semibold">{section.sectionType.substring(0, 3)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section Info */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold truncate">{section.title || section.sectionType}</h3>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] sm:text-xs ${getSectionTypeColor(section.sectionType)}`}>
                  {section.sectionType}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {section.layoutType}
                </Badge>
                {!section.isVisible && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">Hidden</Badge>
                )}
              </div>
            </div>
            {section.subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{section.subtitle}</p>
            )}
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
              <span>Order: {section.displayOrder}</span>
              {section.content?.items && (
                <span>• {section.content.items.length} item{section.content.items.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              title="Preview"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(section.id)}
              title={section.isVisible ? 'Hide' : 'Show'}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              {section.isVisible ? <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(section.id)}
              title="Duplicate"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(section)}
              title="Edit"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(section.id)}
              className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E5E5E5]">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-auto">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="scale-[0.65] sm:scale-75 origin-top-left">
                <DynamicSectionRenderer section={section} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PanchayatWebsiteManager() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<PanchayatWebsiteSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<PanchayatWebsiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PanchayatWebsiteSection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    filterSections();
  }, [sections, searchQuery, typeFilter, visibilityFilter]);

  const filterSections = () => {
    let filtered = [...sections];

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sectionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.sectionType === typeFilter);
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(s =>
        visibilityFilter === 'visible' ? s.isVisible : !s.isVisible
      );
    }

    setFilteredSections(filtered);
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await panchayatWebsiteApi.getSections();
      setSections(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (error: any) {
      toast.error(t('sectionManagement.noSections', { defaultValue: 'Failed to load sections' }) + ': ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSection(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (section: PanchayatWebsiteSection) => {
    setEditingSection(section);
    setIsEditorOpen(true);
  };

  const handleSave = async (sectionData: Partial<PanchayatWebsiteSection>): Promise<PanchayatWebsiteSection> => {
    try {
      let savedSection: PanchayatWebsiteSection;
      if (editingSection) {
        savedSection = await panchayatWebsiteApi.updateSection(editingSection.id, sectionData);
      } else {
        savedSection = await panchayatWebsiteApi.createSection(sectionData as any);
      }
      setIsEditorOpen(false);
      setEditingSection(null);
      await fetchSections();
      return savedSection;
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      return;
    }
    try {
      await panchayatWebsiteApi.deleteSection(id);
      toast.success(t('sectionManagement.sectionDeleted'));
      await fetchSections();
    } catch (error: any) {
      toast.error(t('sectionManagement.delete', { defaultValue: 'Failed to delete section' }) + ': ' + (error.message || 'Unknown error'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const section = sections.find(s => s.id === id);
      if (!section) return;

      const duplicatedData: Partial<PanchayatWebsiteSection> = {
        sectionType: section.sectionType,
        title: `${section.title} (Copy)`,
        subtitle: section.subtitle,
        content: section.content,
        layoutType: section.layoutType,
        displayOrder: sections.length,
        isVisible: false, // Start as hidden
        backgroundColor: section.backgroundColor,
        textColor: section.textColor,
        imageUrl: section.imageUrl,
        imageKey: section.imageKey,
        metadata: section.metadata,
      };

      await panchayatWebsiteApi.createSection(duplicatedData as any);
      toast.success(t('sectionManagement.sectionDuplicated'));
      await fetchSections();
    } catch (error: any) {
      toast.error(t('sectionManagement.duplicate', { defaultValue: 'Failed to duplicate section' }) + ': ' + (error.message || 'Unknown error'));
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      const section = sections.find(s => s.id === id);
      if (section) {
        await panchayatWebsiteApi.toggleVisibility(id, section.isVisible);
        toast.success(t('sectionManagement.visibilityUpdated'));
        await fetchSections();
      }
    } catch (error: any) {
      toast.error(t('sectionManagement.visibilityUpdated', { defaultValue: 'Failed to update visibility' }) + ': ' + (error.message || 'Unknown error'));
    }
  };

  // Note: Move up/down is now handled via drag-and-drop, but keeping these for backward compatibility
  const handleMoveUp = async (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === 0) return;

    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);

    try {
      await panchayatWebsiteApi.updateOrder(newSections[index].id, index);
      await panchayatWebsiteApi.updateOrder(newSections[index - 1].id, index - 1);
      toast.success(t('sectionManagement.orderUpdated'));
      await fetchSections();
    } catch (error: any) {
      toast.error(t('sectionManagement.orderUpdated', { defaultValue: 'Failed to update order' }) + ': ' + (error.message || 'Unknown error'));
      await fetchSections();
    }
  };

  const handleMoveDown = async (id: string) => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === sections.length - 1) return;

    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);

    try {
      await panchayatWebsiteApi.updateOrder(newSections[index].id, index);
      await panchayatWebsiteApi.updateOrder(newSections[index + 1].id, index + 1);
      toast.success(t('sectionManagement.orderUpdated'));
      await fetchSections();
    } catch (error: any) {
      toast.error(t('sectionManagement.orderUpdated', { defaultValue: 'Failed to update order' }) + ': ' + (error.message || 'Unknown error'));
      await fetchSections();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newSections = [...sections];
    const draggedSection = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);

    setSections(newSections);
    setDraggedIndex(null);

    // Update all affected sections' display orders
    try {
      for (let i = 0; i < newSections.length; i++) {
        await panchayatWebsiteApi.updateOrder(newSections[i].id, i);
      }
      toast.success(t('sectionManagement.orderUpdated'));
      await fetchSections();
    } catch (error: any) {
      toast.error(t('sectionManagement.orderUpdated', { defaultValue: 'Failed to update order' }) + ': ' + (error.message || 'Unknown error'));
      await fetchSections();
    }
  };

  // Get unique section types for filter
  const sectionTypes = Array.from(new Set(sections.map(s => s.sectionType)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">{t('sectionManagement.panchayatWebsite.title')}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t('sectionManagement.panchayatWebsite.subtitle')}</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t('sectionManagement.createSection')}
        </Button>
      </div>

      {/* Filters */}
      {sections.length > 0 && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('sectionManagement.searchSections')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('sectionManagement.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {sectionTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                  <SelectValue placeholder={t('sectionManagement.filterByVisibility')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No sections yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first section to start building your panchayat website
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('sectionManagement.noSections')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setVisibilityFilter('all');
              }}
            >
              {t('sectionManagement.all', { defaultValue: 'Clear Filters' })}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>{filteredSections.length} of {sections.length} section{filteredSections.length !== 1 ? 's' : ''}</span>
            <span className="hidden sm:inline">Drag sections to reorder</span>
            <span className="sm:hidden">Drag to reorder</span>
          </div>
          {filteredSections.map((section) => {
            const originalIndex = sections.findIndex(s => s.id === section.id);
            return (
              <SectionItem
                key={section.id}
                section={section}
                index={originalIndex}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
                onDuplicate={handleDuplicate}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedIndex === originalIndex}
              />
            );
          })}
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </DialogTitle>
            <DialogDescription>
              Configure the section content, layout, and styling. Use the tabs to organize different aspects of your section.
            </DialogDescription>
          </DialogHeader>
          <SectionEditor
            section={editingSection}
            isPlatform={false}
            onSave={handleSave}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingSection(null);
            }}
            isOpen={isEditorOpen}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
