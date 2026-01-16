import { useState, useMemo } from "react";
import {
  useQRCodes,
  useQRCodeStats,
  useQRCodeAnalytics,
  useToggleQRCodeStatus,
} from "../hooks/useQRCodes";
import { QRCode, QRCodeType } from "../api/admin-qr-codes";
import {
  Search,
  QrCode,
  Eye,
  Power,
  PowerOff,
  TrendingUp,
  Globe,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Skeleton } from "../components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function QRCodesPage() {
  const { data: qrCodesResponse, isLoading } = useQRCodes();
  const { data: statsResponse } = useQRCodeStats();
  const toggleStatus = useToggleQRCodeStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const qrCodes = qrCodesResponse?.data || [];
  const stats = statsResponse?.data;

  // Get analytics for selected QR code
  const { data: analyticsResponse } = useQRCodeAnalytics(
    selectedQRCode?.id || ""
  );
  const analytics = analyticsResponse?.data;

  // Filter and search QR codes
  const filteredQRCodes = useMemo(() => {
    return qrCodes.filter((qr) => {
      const matchesSearch =
        qr.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qr.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qr.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qr.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || qr.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && qr.is_active) ||
        (statusFilter === "inactive" && !qr.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [qrCodes, searchQuery, typeFilter, statusFilter]);

  const getTypeBadgeColor = (type: QRCodeType) => {
    switch (type) {
      case "url":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pdf":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "text":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "whatsapp":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "maps":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleToggleStatus = async (qr: QRCode) => {
    await toggleStatus.mutateAsync({
      id: qr.id,
      isActive: !qr.is_active,
    });
  };

  const handleViewAnalytics = (qr: QRCode) => {
    setSelectedQRCode(qr);
    setShowAnalytics(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">QR Codes</h1>
          <p className="text-muted-foreground mt-2">Manage all QR codes</p>
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
        <h1 className="text-3xl font-bold">QR Codes</h1>
        <p className="text-muted-foreground mt-2">
          Manage all QR codes ({filteredQRCodes.length} codes)
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total QR Codes</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Active Codes</div>
            <div className="text-2xl font-bold mt-1">{stats.active}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Scans</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {stats.totalScans}
            </div>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="text-sm text-muted-foreground">Top Code Scans</div>
            <div className="text-2xl font-bold mt-1">
              {stats.topCodes[0]?.scans || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="maps">Maps</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* QR Codes Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredQRCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No QR codes found
                  </td>
                </tr>
              ) : (
                filteredQRCodes.map((qr) => (
                  <tr 
                    key={qr.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => {
                      // Don't open drawer if clicking switch or button
                      if ((e.target as HTMLElement).closest('button') || 
                          (e.target as HTMLElement).closest('[role="switch"]')) {
                        return;
                      }
                      handleViewAnalytics(qr);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{qr.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {qr.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor(
                          qr.type
                        )}`}
                      >
                        {qr.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-sm">
                        {qr.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={qr.is_active}
                          onCheckedChange={() => handleToggleStatus(qr)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm">
                          {qr.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{qr.user?.email || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(qr.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalytics(qr);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* QR Code Analytics Drawer */}
      <Sheet open={showAnalytics} onOpenChange={setShowAnalytics}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              QR Code Analytics: {selectedQRCode?.name}
            </SheetTitle>
            <SheetDescription>
              Scan statistics and performance metrics
            </SheetDescription>
          </SheetHeader>
          {analytics && (
            <div className="space-y-6 py-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total Scans
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {analytics.totalScans}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Unique Scans
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {analytics.uniqueScans}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Countries
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {analytics.scansByCountry.length}
                  </div>
                </div>
              </div>

              {/* Scans by Date Chart */}
              {analytics.scansByDate.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Scans Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.scansByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Scans by Country */}
              {analytics.scansByCountry.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Scans by Country
                  </h3>
                  <div className="space-y-2">
                    {analytics.scansByCountry.slice(0, 10).map((item) => (
                      <div
                        key={item.country}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{item.country}</span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Scans */}
              {analytics.recentScans.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Scans</h3>
                  <div className="space-y-2">
                    {analytics.recentScans.map((scan) => (
                      <div
                        key={scan.id}
                        className="p-3 bg-muted rounded-lg text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div>
                              {new Date(scan.scanned_at).toLocaleString()}
                            </div>
                            {scan.country && (
                              <div className="text-muted-foreground">
                                {scan.country}
                              </div>
                            )}
                          </div>
                          {scan.ip_address && (
                            <div className="text-muted-foreground font-mono text-xs">
                              {scan.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
