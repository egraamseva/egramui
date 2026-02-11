/**
 * Super Admin: Manage any panchayat's website sections (same as Sachiv's PanchayatWebsiteManager but by panchayat ID).
 */

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Plus, Search, Filter, GripVertical } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { createAdminPanchayatWebsiteApi } from "../../routes/api";
import { SectionItem } from "../sachiv/PanchayatWebsiteManager";
import { SectionEditor } from "./SectionEditor";
import type { PanchayatWebsiteSection } from "../../types";
import type { SuperAdminPanchayat } from "../../types";
import { superAdminAPI } from "../../services/api";
import { processSectionContent, isBlobURL } from "../../utils/imageUtils";

interface AdminPanchayatWebsiteManagerProps {
  /** When set, preselect this panchayat (e.g. from dashboard panchayat filter) */
  initialPanchayatId?: number;
}

export function AdminPanchayatWebsiteManager({
  initialPanchayatId,
}: AdminPanchayatWebsiteManagerProps = {}) {
  const { t } = useTranslation();
  const [panchayats, setPanchayats] = useState<SuperAdminPanchayat[]>([]);
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<number | null>(
    initialPanchayatId ?? null
  );
  const [sections, setSections] = useState<PanchayatWebsiteSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<PanchayatWebsiteSection[]>([]);
  const [loadingPanchayats, setLoadingPanchayats] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PanchayatWebsiteSection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialPanchayatId != null) {
      setSelectedPanchayatId(initialPanchayatId);
    }
  }, [initialPanchayatId]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingPanchayats(true);
        const list = await superAdminAPI.getAllPanchayats({});
        setPanchayats(list);
        if (list.length > 0) {
          const hasCurrent = selectedPanchayatId != null && list.some((p) => Number(p.id) === selectedPanchayatId);
          const hasInitial = initialPanchayatId != null && list.some((p) => Number(p.id) === initialPanchayatId);
          if (hasCurrent) {
            setSelectedPanchayatId(selectedPanchayatId!);
          } else if (hasInitial) {
            setSelectedPanchayatId(initialPanchayatId!);
          } else {
            setSelectedPanchayatId(Number(list[0].id));
          }
        }
      } catch (e: any) {
        toast.error("Failed to load panchayats: " + (e?.message || "Unknown error"));
      } finally {
        setLoadingPanchayats(false);
      }
    })();
  }, []);

  const adminApi = selectedPanchayatId != null ? createAdminPanchayatWebsiteApi(selectedPanchayatId) : null;

  useEffect(() => {
    if (selectedPanchayatId == null) {
      setSections([]);
      return;
    }
    let cancelled = false;
    setLoadingSections(true);
    const api = createAdminPanchayatWebsiteApi(selectedPanchayatId);
    api
      .getSections()
      .then((data) => {
        if (cancelled) return;
        const processed = data.map((section) => ({
          ...section,
          content:
            typeof section.content === "object"
              ? processSectionContent(section.content)
              : section.content,
          imageUrl:
            section.imageUrl && !isBlobURL(section.imageUrl) ? section.imageUrl : null,
        }));
        setSections(processed.sort((a, b) => a.displayOrder - b.displayOrder));
      })
      .catch((err: any) => {
        if (!cancelled) {
          toast.error("Failed to load sections: " + (err?.message || "Unknown error"));
          setSections([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSections(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPanchayatId]);

  useEffect(() => {
    let filtered = [...sections];
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.sectionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (typeFilter !== "all") filtered = filtered.filter((s) => s.sectionType === typeFilter);
    if (visibilityFilter !== "all") {
      filtered = filtered.filter((s) =>
        visibilityFilter === "visible" ? s.isVisible : !s.isVisible
      );
    }
    setFilteredSections(filtered);
  }, [sections, searchQuery, typeFilter, visibilityFilter]);

  const fetchSections = async () => {
    if (!adminApi) return;
    try {
      const data = await adminApi.getSections();
      const processed = data.map((section) => ({
        ...section,
        content:
          typeof section.content === "object"
            ? processSectionContent(section.content)
            : section.content,
        imageUrl:
          section.imageUrl && !isBlobURL(section.imageUrl) ? section.imageUrl : null,
      }));
      setSections(processed.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err: any) {
      toast.error("Failed to refresh sections: " + (err?.message || "Unknown error"));
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

  const handleSave = async (
    sectionData: Partial<PanchayatWebsiteSection>
  ): Promise<PanchayatWebsiteSection> => {
    if (!adminApi) throw new Error("No panchayat selected");
    let saved: PanchayatWebsiteSection;
    if (editingSection) {
      saved = await adminApi.updateSection(editingSection.id, sectionData);
    } else {
      saved = await adminApi.createSection(sectionData as any);
    }
    setIsEditorOpen(false);
    setEditingSection(null);
    await fetchSections();
    return saved;
  };

  const handleDelete = async (id: string) => {
    if (!adminApi) return;
    if (!confirm("Are you sure you want to delete this section? This action cannot be undone.")) return;
    try {
      await adminApi.deleteSection(id);
      toast.success(t("sectionManagement.sectionDeleted", { defaultValue: "Section deleted" }));
      await fetchSections();
    } catch (err: any) {
      toast.error("Failed to delete section: " + (err?.message || "Unknown error"));
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!adminApi) return;
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    try {
      const duplicatedData: Partial<PanchayatWebsiteSection> = {
        sectionType: section.sectionType,
        title: `${section.title} (Copy)`,
        subtitle: section.subtitle,
        content: section.content,
        layoutType: section.layoutType,
        displayOrder: sections.length,
        isVisible: false,
        backgroundColor: section.backgroundColor,
        textColor: section.textColor,
        imageUrl: section.imageUrl,
        imageKey: section.imageKey,
        metadata: section.metadata,
      };
      await adminApi.createSection(duplicatedData as any);
      toast.success(t("sectionManagement.sectionDuplicated", { defaultValue: "Section duplicated" }));
      await fetchSections();
    } catch (err: any) {
      toast.error("Failed to duplicate: " + (err?.message || "Unknown error"));
    }
  };

  const handleToggleVisibility = async (id: string) => {
    if (!adminApi) return;
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    try {
      await adminApi.toggleVisibility(id, section.isVisible);
      toast.success(t("sectionManagement.visibilityUpdated", { defaultValue: "Visibility updated" }));
      await fetchSections();
    } catch (err: any) {
      toast.error("Failed to update visibility: " + (err?.message || "Unknown error"));
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!adminApi || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    const newSections = [...sections];
    const [dragged] = newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, dragged);
    setSections(newSections);
    setDraggedIndex(null);
    try {
      for (let i = 0; i < newSections.length; i++) {
        await adminApi.updateOrder(newSections[i].id, i);
      }
      toast.success(t("sectionManagement.orderUpdated", { defaultValue: "Order updated" }));
      await fetchSections();
    } catch (err: any) {
      toast.error("Failed to update order: " + (err?.message || "Unknown error"));
      await fetchSections();
    }
  };

  const sectionTypes = Array.from(new Set(sections.map((s) => s.sectionType)));
  const selectedPanchayat = panchayats.find((p) => Number(p.id) === selectedPanchayatId);

  if (loadingPanchayats) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading panchayats...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Panchayat Websites</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage website sections for any panchayat. Select a panchayat below.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <label className="text-sm font-medium mb-2 block">Panchayat</label>
          <Select
            value={selectedPanchayatId != null ? String(selectedPanchayatId) : ""}
            onValueChange={(v) => setSelectedPanchayatId(v ? parseInt(v, 10) : null)}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a panchayat" />
            </SelectTrigger>
            <SelectContent>
              {panchayats.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.panchayatName}
                  {p.slug ? ` (${p.slug})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPanchayatId == null ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a panchayat to manage its website sections.
          </CardContent>
        </Card>
      ) : loadingSections ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading sections...
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              Editing: <strong>{selectedPanchayat?.panchayatName ?? selectedPanchayat?.slug ?? selectedPanchayatId}</strong>
            </p>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {t("sectionManagement.createSection", { defaultValue: "Create Section" })}
            </Button>
          </div>

          {sections.length > 0 && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("sectionManagement.searchSections", { defaultValue: "Search sections..." })}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t("sectionManagement.filterByType", { defaultValue: "Filter by type" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {sectionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                      <SelectValue placeholder="Visibility" />
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
                <p className="text-muted-foreground mb-4">No sections yet for this panchayat.</p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create first section
                </Button>
              </CardContent>
            </Card>
          ) : filteredSections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t("sectionManagement.noSections", { defaultValue: "No sections match filters" })}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setVisibilityFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>
                  {filteredSections.length} of {sections.length} section{sections.length !== 1 ? "s" : ""}
                </span>
                <span className="hidden sm:inline">Drag sections to reorder</span>
              </div>
              {filteredSections.map((section) => {
                const originalIndex = sections.findIndex((s) => s.id === section.id);
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
            <DialogContent className="max-w-[95vw] sm:max-w-7xl lg:max-w-[90vw] max-h-[95vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
              <DialogHeader>
                <DialogTitle>{editingSection ? "Edit Section" : "Create New Section"}</DialogTitle>
                <DialogDescription>
                  Configure the section content, layout, and styling.
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
                websiteApi={adminApi}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
