/**
 * Schemes Page Component
 * Track and manage government schemes
 */

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Progress } from "../../ui/progress";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import type { Scheme } from "../../../types";
import { schemeApi } from "@/routes/api";

export function SchemesPage() {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    budget: "",
    beneficiaries: "",
    description: "",
  });

  useEffect(() => {
    if (user?.panchayatId) {
      fetchSchemes();
    }
  }, [user]);

  const fetchSchemes = async () => {
    if (!user?.panchayatId) return;

    setLoading(true);
    try {
      const result = await schemeApi.list();
      setSchemes(result.items);
    } catch (error) {
      console.error("Error fetching schemes:", error);
      toast.error("Failed to load schemes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingScheme(null);
    setFormData({
      name: "",
      category: "",
      budget: "",
      beneficiaries: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name,
      category: scheme.category,
      budget: scheme.budget.replace(/[₹,]/g, ""),
      beneficiaries: scheme.beneficiaries.toString(),
      description: scheme.category,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingScheme(null);
    setFormData({
      name: "",
      category: "",
      budget: "",
      beneficiaries: "",
      description: "",
    });
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId) return;

    if (!formData.name.trim()) {
      toast.error("Please enter scheme name");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Please enter scheme category/description");
      return;
    }

    const budgetAmount = formData.budget ? parseFloat(formData.budget.replace(/[₹,]/g, "")) : 0;
    const beneficiaryCount = formData.beneficiaries ? parseInt(formData.beneficiaries) : 0;

    try {
      await schemeApi.create( {
        title: formData.name,
        description: formData.category,
        budgetAmount: budgetAmount,
        beneficiaryCount: beneficiaryCount,
      });
      toast.success("Scheme created successfully!");
      closeDialog();
      fetchSchemes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create scheme";
      toast.error(message);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.panchayatId || !editingScheme) return;

    if (!formData.name.trim()) {
      toast.error("Please enter scheme name");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Please enter scheme category/description");
      return;
    }

    const budgetAmount = formData.budget ? parseFloat(formData.budget.replace(/[₹,]/g, "")) : 0;
    const beneficiaryCount = formData.beneficiaries ? parseInt(formData.beneficiaries) : 0;

    try {
      await schemeApi.update( editingScheme.id, {
        title: formData.name,
        description: formData.category,
        budgetAmount: budgetAmount,
        beneficiaryCount: beneficiaryCount,
      });
      toast.success("Scheme updated successfully!");
      closeDialog();
      fetchSchemes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update scheme";
      toast.error(message);
    }
  };

  const handleEdit = (id: string) => {
    const scheme = schemes.find((s) => s.id === id);
    if (scheme) {
      openEditDialog(scheme);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.panchayatId) return;
    if (!confirm("Are you sure you want to delete this scheme?")) return;

    try {
      await schemeApi.delete( id);
      setSchemes((prev) => prev.filter((s) => s.id !== id));
      toast.success("Scheme deleted successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete scheme";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Schemes Management</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track and manage government schemes
          </p>
        </div>
        <Button
          className="bg-[#138808] hover:bg-[#138808]/90 w-full sm:w-auto"
          onClick={openCreateDialog}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Add Scheme</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Loading schemes...</div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {schemes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No schemes yet. Add your first scheme!
              </CardContent>
            </Card>
          ) : (
            schemes.map((scheme) => (
              <Card key={scheme.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg">{scheme.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Category: {scheme.category}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 self-start sm:self-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => handleEdit(scheme.id)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => handleDelete(scheme.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs sm:text-sm text-muted-foreground">Budget</p>
                      <p className="text-sm sm:text-base text-[#138808] font-semibold mt-1">
                        {scheme.budget}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs sm:text-sm text-muted-foreground">Beneficiaries</p>
                      <p className="text-sm sm:text-base text-[#138808] font-semibold mt-1">
                        {scheme.beneficiaries} families
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs sm:text-sm text-muted-foreground">Progress</p>
                      <p className="text-sm sm:text-base text-[#138808] font-semibold mt-1">
                        {scheme.progress}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={scheme.progress} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingScheme ? "Edit Scheme" : "Create New Scheme"}
            </DialogTitle>
            <DialogDescription>
              {editingScheme
                ? "Update the scheme details below"
                : "Fill in the details to create a new scheme"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingScheme ? handleUpdate(e) : handleCreate(e);
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Scheme Name *</Label>
              <Input
                id="name"
                placeholder="Enter scheme name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category/Description *</Label>
              <Textarea
                id="category"
                placeholder="Enter scheme category or description"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter budget amount"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaries">Beneficiaries</Label>
                <Input
                  id="beneficiaries"
                  type="number"
                  placeholder="Number of beneficiaries"
                  value={formData.beneficiaries}
                  onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#138808] hover:bg-[#138808]/90">
                {editingScheme ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

