import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Edit, Trash2, Search, Filter, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  adminSubscriptionPlanApi,
  adminPanchayatSubscriptionApi,
} from "../../routes/api";
import { superAdminAPI } from "../../services/api";
import type {
  SubscriptionPlanType,
  PanchayatSubscriptionType,
  SuperAdminPanchayat,
} from "../../types";

type TabId = "plans" | "payments";

interface SubscriptionsManagerProps {
  /** When set, payments tab filter is pre-selected to this panchayat */
  defaultPanchayatId?: string;
}

export function SubscriptionsManager({ defaultPanchayatId }: SubscriptionsManagerProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>("plans");
  const [plans, setPlans] = useState<SubscriptionPlanType[]>([]);
  const [payments, setPayments] = useState<PanchayatSubscriptionType[]>([]);
  const [panchayats, setPanchayats] = useState<SuperAdminPanchayat[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState(0);
  const [paymentTotalElements, setPaymentTotalElements] = useState(0);

  // Filters for payments (sync with dashboard panchayat filter when provided)
  const [filterPanchayatId, setFilterPanchayatId] = useState<string>(
    defaultPanchayatId ?? ""
  );
  useEffect(() => {
    if (defaultPanchayatId !== undefined) {
      setFilterPanchayatId(defaultPanchayatId);
    }
  }, [defaultPanchayatId]);
  const [filterPlanId, setFilterPlanId] = useState<string>("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  // Plan form
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanType | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    amount: "",
    currency: "INR",
    durationMonths: "",
    isActive: true,
    displayOrder: 0,
  });

  // Payment form (record payment)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    panchayatId: "",
    planId: "",
    amountPaid: "",
    paidAt: new Date().toISOString().slice(0, 16),
    status: "PAID",
    referenceNumber: "",
    paymentMethod: "",
    notes: "",
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await adminSubscriptionPlanApi.getAll();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (page: number = 0) => {
    setLoading(true);
    try {
      const params: any = { pageNumber: page, pageSize: 20 };
      if (filterPanchayatId) params.panchayatId = parseInt(filterPanchayatId);
      if (filterPlanId) params.planId = parseInt(filterPlanId);
      if (filterFromDate) params.fromDate = filterFromDate;
      if (filterToDate) params.toDate = filterToDate;
      const data = await adminPanchayatSubscriptionApi.getAll(params);
      setPayments(data.content || []);
      setPaymentPage(data.page ?? 0);
      setPaymentTotalPages(data.totalPages ?? 0);
      setPaymentTotalElements(data.totalElements ?? 0);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load payment records");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPanchayats = async () => {
    try {
      const list = await superAdminAPI.getAllPanchayats({});
      setPanchayats(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "plans") fetchPlans();
    else {
      fetchPayments(0);
      fetchPlans(); // so plan dropdown is populated when recording payment
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPanchayats();
      fetchPayments(0);
    }
  }, [activeTab, filterPanchayatId, filterPlanId, filterFromDate, filterToDate]);

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      description: "",
      amount: "",
      currency: "INR",
      durationMonths: "",
      isActive: true,
      displayOrder: plans.length,
    });
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlanType) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      amount: String(plan.amount),
      currency: plan.currency || "INR",
      durationMonths: plan.durationMonths != null ? String(plan.durationMonths) : "",
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
    setPlanDialogOpen(true);
  };

  const savePlan = async () => {
    if (!planForm.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    const amount = parseFloat(planForm.amount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Valid amount is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || undefined,
        amount,
        currency: planForm.currency,
        durationMonths: planForm.durationMonths ? parseInt(planForm.durationMonths, 10) : undefined,
        isActive: planForm.isActive,
        displayOrder: planForm.displayOrder,
      };
      if (editingPlan) {
        await adminSubscriptionPlanApi.update(editingPlan.id, payload);
        toast.success("Plan updated");
      } else {
        await adminSubscriptionPlanApi.create(payload);
        toast.success("Plan created");
      }
      setPlanDialogOpen(false);
      fetchPlans();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: number) => {
    if (!confirm("Delete this plan? Existing payment records will keep the plan name.")) return;
    try {
      await adminSubscriptionPlanApi.delete(id);
      toast.success("Plan deleted");
      fetchPlans();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete plan");
    }
  };

  const openAddPayment = () => {
    setPaymentForm({
      panchayatId: "",
      planId: "",
      amountPaid: "",
      paidAt: new Date().toISOString().slice(0, 16),
      status: "PAID",
      referenceNumber: "",
      paymentMethod: "",
      notes: "",
    });
    setPaymentDialogOpen(true);
  };

  const savePayment = async () => {
    const panchayatId = paymentForm.panchayatId ? parseInt(paymentForm.panchayatId, 10) : 0;
    const planId = paymentForm.planId ? parseInt(paymentForm.planId, 10) : 0;
    const amountPaid = parseFloat(paymentForm.amountPaid);
    if (!panchayatId || !planId) {
      toast.error("Select panchayat and plan");
      return;
    }
    if (isNaN(amountPaid) || amountPaid < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await adminPanchayatSubscriptionApi.create({
        panchayatId,
        planId,
        amountPaid,
        paidAt: paymentForm.paidAt ? new Date(paymentForm.paidAt).toISOString() : undefined,
        status: paymentForm.status,
        referenceNumber: paymentForm.referenceNumber.trim() || undefined,
        paymentMethod: paymentForm.paymentMethod.trim() || undefined,
        notes: paymentForm.notes.trim() || undefined,
      });
      toast.success("Payment record added");
      setPaymentDialogOpen(false);
      fetchPayments(0);
    } catch (e: any) {
      toast.error(e?.message || "Failed to add payment record");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString("en-IN", { dateStyle: "short" }) : "—";
  const formatCurrency = (n: number) =>
    "₹" + (typeof n === "number" ? n.toLocaleString("en-IN") : n);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1B2B5E]">
          Plans &amp; Payments
        </h2>
        <p className="text-sm text-[#666] mt-1">
          Manage subscription plans and record payments received from panchayats (offline/other methods).
        </p>
      </div>

      <div className="flex border-b border-[#E5E5E5] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "plans"
              ? "bg-[#E31E24] text-white"
              : "text-[#666] hover:bg-[#F5F5F5]"
          }`}
        >
          Plans
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "payments"
              ? "bg-[#E31E24] text-white"
              : "text-[#666] hover:bg-[#F5F5F5]"
          }`}
        >
          Record payment / Reporting
        </button>
      </div>

      {activeTab === "plans" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <span className="text-sm text-[#666]">Subscription plans</span>
            <Button onClick={openAddPlan} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add plan
            </Button>
          </CardHeader>
          <CardContent>
            {loading && plans.length === 0 ? (
              <p className="text-sm text-[#666] py-4">Loading...</p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-[#666] py-4">No plans yet. Add one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{formatCurrency(plan.amount)} {plan.currency}</TableCell>
                      <TableCell>{plan.durationMonths != null ? `${plan.durationMonths} mo` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditPlan(plan)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => deletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "payments" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <Select value={filterPanchayatId || "all"} onValueChange={(v) => setFilterPanchayatId(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All panchayats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All panchayats</SelectItem>
                    {panchayats.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.panchayatName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPlanId || "all"} onValueChange={(v) => setFilterPlanId(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plans</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="From date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
                <Input
                  type="date"
                  placeholder="To date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
                <Button onClick={openAddPayment}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && payments.length === 0 ? (
                <p className="text-sm text-[#666] py-4">Loading...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-[#666] py-4">No payment records. Use &quot;Record payment&quot; to add one.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Panchayat</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.panchayatName}</TableCell>
                          <TableCell>{p.planName}</TableCell>
                          <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                          <TableCell>{formatDate(p.paidAt)}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "PAID" ? "default" : "secondary"}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.paymentMethod || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {paymentTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-[#666]">
                      <span>
                        Total {paymentTotalElements} record(s)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={paymentPage <= 0}
                          onClick={() => fetchPayments(paymentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={paymentPage >= paymentTotalPages - 1}
                          onClick={() => fetchPayments(paymentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Plan dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit plan" : "Add plan"}</DialogTitle>
            <DialogDescription>Define a subscription plan (name, amount, duration).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Annual Basic"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Plan description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={planForm.amount}
                  onChange={(e) => setPlanForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Input
                  value={planForm.currency}
                  onChange={(e) => setPlanForm((f) => ({ ...f, currency: e.target.value }))}
                  placeholder="INR"
                />
              </div>
            </div>
            <div>
              <Label>Duration (months, optional)</Label>
              <Input
                type="number"
                min={0}
                value={planForm.durationMonths}
                onChange={(e) => setPlanForm((f) => ({ ...f, durationMonths: e.target.value }))}
                placeholder="e.g. 12"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="plan-active"
                checked={planForm.isActive}
                onChange={(e) => setPlanForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <Label htmlFor="plan-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
            <Button onClick={savePlan}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment record dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Record that a panchayat has paid (payment collected via other methods).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Panchayat</Label>
              <Select
                value={paymentForm.panchayatId}
                onValueChange={(v) => setPaymentForm((f) => ({ ...f, panchayatId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select panchayat" />
                </SelectTrigger>
                <SelectContent>
                  {panchayats.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.panchayatName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select
                value={paymentForm.planId}
                onValueChange={(v) => setPaymentForm((f) => ({ ...f, planId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount paid</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={paymentForm.amountPaid}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amountPaid: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Date paid</Label>
              <Input
                type="datetime-local"
                value={paymentForm.paidAt}
                onChange={(e) => setPaymentForm((f) => ({ ...f, paidAt: e.target.value }))}
              />
            </div>
            <div>
              <Label>Payment method (optional)</Label>
              <Input
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                placeholder="e.g. Bank transfer, Cash"
              />
            </div>
            <div>
              <Label>Reference / Notes (optional)</Label>
              <Input
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                placeholder="Reference number or notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={savePayment}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
