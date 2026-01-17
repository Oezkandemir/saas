import { useState, useMemo } from "react";
import {
  useSubscriptions,
  useSubscriptionAnalytics,
  useUpdateSubscription,
} from "../hooks/useSubscriptions";
import { Subscription, SubscriptionPlan, SubscriptionStatus } from "../api/admin-subscriptions";
import {
  Search,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../components/ui/sheet";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function SubscriptionsPage() {
  const { data: subscriptionsResponse, isLoading } = useSubscriptions();
  const { data: analyticsResponse, isLoading: analyticsLoading } = useSubscriptionAnalytics();
  const updateSubscription = useUpdateSubscription();
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [editStatus, setEditStatus] = useState<SubscriptionStatus | null>(null);

  const subscriptions = subscriptionsResponse?.data || [];
  const analytics = analyticsResponse?.data;

  // Filter and search subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        sub.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.stripe_subscription_id
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        sub.polar_subscription_id
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan = planFilter === "all" || sub.plan === planFilter;
      const matchesStatus =
        statusFilter === "all" || sub.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [subscriptions, searchQuery, planFilter, statusFilter]);

  const getStatusBadgeColor = (status: SubscriptionStatus) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "trialing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "past_due":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "canceled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPlanBadgeColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "free":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "pro":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "enterprise":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleStatusChange = async (
    subscriptionId: string,
    newStatus: SubscriptionStatus
  ) => {
    await updateSubscription.mutateAsync({
      id: subscriptionId,
      updates: { status: newStatus },
    });
  };

  const handlePlanChange = async (
    subscriptionId: string,
    newPlan: SubscriptionPlan
  ) => {
    await updateSubscription.mutateAsync({
      id: subscriptionId,
      updates: { plan: newPlan },
    });
  };

  const handleOpenDrawer = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setEditPlan(sub.plan);
    setEditStatus(sub.status);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedSubscription || !editPlan || !editStatus) return;

    await updateSubscription.mutateAsync({
      id: selectedSubscription.id,
      updates: {
        plan: editPlan,
        status: editStatus,
      },
    });

    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            Manage all subscriptions
          </p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-2">
          Manage all subscriptions ({filteredSubscriptions.length} subscriptions)
        </p>
      </div>

      {/* Analytics Cards */}
      {analyticsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">MRR</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {analytics.mrr.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">ARR</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {analytics.arr.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold mt-1">
              {analytics.activeSubscriptions}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Churn Rate</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              {analytics.churnRate > 5 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
              {analytics.churnRate.toFixed(2)}%
            </div>
          </div>
        </div>
      ) : null}

      {/* Charts */}
      {analyticsLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-6 bg-card border border-border rounded-lg">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Subscriptions by Plan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.byPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, count }) => `${plan}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.byPlan.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              Subscriptions by Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.byStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by user email, subscription ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List - Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredSubscriptions.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            No subscriptions found
          </div>
        ) : (
          filteredSubscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDrawer(sub);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">
                    {sub.user?.name || "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sub.user?.email || "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Plan</div>
                  <Badge className={getPlanBadgeColor(sub.plan)}>
                    {sub.plan}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <Badge className={getStatusBadgeColor(sub.status)}>
                    {sub.status}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Provider</div>
                  <Badge variant="outline" className="text-xs">
                    {sub.payment_provider || "stripe"}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Period End</div>
                  <div className="text-sm">
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                {sub.calculatedMRR !== undefined && sub.calculatedMRR > 0 ? (
                  <div>
                    <div className="font-medium text-sm">
                      {sub.calculatedMRR.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {sub.planPrice?.currency || sub.currency || "EUR"}/mo
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sub.calculatedARR?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {sub.planPrice?.currency || sub.currency || "EUR"}/yr
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">€0.00</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subscriptions Table - Desktop View */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Period End
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  No subscriptions found
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => (
                <tr 
                  key={sub.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleOpenDrawer(sub)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">
                        {sub.user?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sub.user?.email || "—"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getPlanBadgeColor(sub.plan)}>
                      {sub.plan}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusBadgeColor(sub.status)}>
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">
                      {sub.payment_provider || "stripe"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {sub.calculatedMRR !== undefined && sub.calculatedMRR > 0 ? (
                      <div>
                        <div className="font-medium">
                          {sub.calculatedMRR.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {sub.planPrice?.currency || sub.currency || "EUR"}/mo
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sub.calculatedARR?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {sub.planPrice?.currency || sub.currency || "EUR"}/yr
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">€0.00</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDrawer(sub);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Subscription Detail Drawer */}
      <Sheet
        open={!!selectedSubscription}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubscription(null);
            setIsEditing(false);
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Subscription Details</SheetTitle>
            <SheetDescription>
              View and manage subscription information
            </SheetDescription>
          </SheetHeader>
          {selectedSubscription && (
            <div className="space-y-6 py-6">
              {!isEditing ? (
                <>
                  {/* View Mode */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">User</div>
                        <div className="font-medium">
                          {selectedSubscription.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedSubscription.user?.email || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Plan</div>
                        <Badge className={getPlanBadgeColor(selectedSubscription.plan)}>
                          {selectedSubscription.plan}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <Badge className={getStatusBadgeColor(selectedSubscription.status)}>
                          {selectedSubscription.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Provider</div>
                        <Badge variant="outline">
                          {selectedSubscription.payment_provider || "stripe"}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Monthly Revenue (MRR)
                        </div>
                        <div className="font-medium">
                          {selectedSubscription.calculatedMRR !== undefined && selectedSubscription.calculatedMRR > 0 ? (
                            <>
                              {selectedSubscription.calculatedMRR.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {selectedSubscription.planPrice?.currency || selectedSubscription.currency || "EUR"}
                            </>
                          ) : (
                            <span className="text-muted-foreground">€0.00</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Annual Revenue (ARR)
                        </div>
                        <div className="font-medium">
                          {selectedSubscription.calculatedARR !== undefined && selectedSubscription.calculatedARR > 0 ? (
                            <>
                              {selectedSubscription.calculatedARR.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {selectedSubscription.planPrice?.currency || selectedSubscription.currency || "EUR"}
                            </>
                          ) : (
                            <span className="text-muted-foreground">€0.00</span>
                          )}
                        </div>
                      </div>
                      {selectedSubscription.current_period_start && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            Period Start
                          </div>
                          <div className="text-sm">
                            {new Date(selectedSubscription.current_period_start).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      {selectedSubscription.current_period_end && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            Period End
                          </div>
                          <div className="text-sm">
                            {new Date(selectedSubscription.current_period_end).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      {selectedSubscription.stripe_subscription_id && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            Stripe Subscription ID
                          </div>
                          <div className="font-mono text-xs break-all">
                            {selectedSubscription.stripe_subscription_id}
                          </div>
                        </div>
                      )}
                      {selectedSubscription.polar_subscription_id && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            Polar Subscription ID
                          </div>
                          <div className="font-mono text-xs break-all">
                            {selectedSubscription.polar_subscription_id}
                          </div>
                        </div>
                      )}
                      {selectedSubscription.planPrice && (
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            Plan Pricing
                          </div>
                          <div className="text-sm">
                            Monthly: {selectedSubscription.planPrice.monthly.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {selectedSubscription.planPrice.currency} | Yearly: {selectedSubscription.planPrice.yearly.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {selectedSubscription.planPrice.currency}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Cancel at Period End
                        </div>
                        <div className="text-sm">
                          {selectedSubscription.cancel_at_period_end ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      Edit Subscription
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Edit Subscription</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditPlan(selectedSubscription.plan);
                          setEditStatus(selectedSubscription.status);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan">Plan</Label>
                        <Select
                          value={editPlan || selectedSubscription.plan}
                          onValueChange={(value) => setEditPlan(value as SubscriptionPlan)}
                        >
                          <SelectTrigger id="plan">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editStatus || selectedSubscription.status}
                          onValueChange={(value) => setEditStatus(value as SubscriptionStatus)}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="trialing">Trialing</SelectItem>
                            <SelectItem value="past_due">Past Due</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <SheetFooter className="pt-4 border-t border-border">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditPlan(selectedSubscription?.plan || null);
                    setEditStatus(selectedSubscription?.status || null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={updateSubscription.isPending}
                >
                  {updateSubscription.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSubscription(null);
                  setIsEditing(false);
                }}
              >
                Close
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
