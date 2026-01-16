import { useState, useEffect } from "react";
import {
  useCompanyProfiles,
  useCompanyStats,
  useUpdateCompanyProfile,
  useSetDefaultCompanyProfile,
} from "../hooks/useCompanies";
import { CompanyProfile } from "../api/admin-companies";
import {
  Building2,
  Edit,
  Star,
  Search,
  Download,
  MapPin,
  Mail,
  Phone,
  Globe,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { StatCard } from "../components/ui/stat-card";
import { Pagination } from "../components/ui/pagination";
import { useDebounce } from "../hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { formatDate } from "../lib/format";
import { exportToCSV } from "../lib/export";

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(
    null
  );
  const [editForm, setEditForm] = useState<Partial<CompanyProfile>>({});

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: companiesResponse, isLoading, error } = useCompanyProfiles({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    userId: userIdFilter !== "all" ? userIdFilter : undefined,
    profileType:
      profileTypeFilter !== "all" ? profileTypeFilter : undefined,
    country: countryFilter !== "all" ? countryFilter : undefined,
  });

  const { data: statsResponse } = useCompanyStats();
  const updateProfile = useUpdateCompanyProfile();
  const setDefault = useSetDefaultCompanyProfile();

  const paginatedData = companiesResponse?.data;
  const companies = paginatedData?.data || [];
  const stats = statsResponse?.data;

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, userIdFilter, profileTypeFilter, countryFilter]);

  const handleEdit = (company: CompanyProfile) => {
    setSelectedCompany(company);
    setIsEditing(true);
    setEditingCompany(company);
    setEditForm({
      company_name: company.company_name,
      profile_name: company.profile_name,
      company_email: company.company_email,
      company_phone: company.company_phone || "",
      company_mobile: company.company_mobile || "",
      company_website: company.company_website || "",
      company_address: company.company_address || "",
      company_address_line2: company.company_address_line2 || "",
      company_city: company.company_city || "",
      company_postal_code: company.company_postal_code || "",
      company_country: company.company_country,
      company_tax_id: company.company_tax_id || "",
      company_vat_id: company.company_vat_id || "",
      company_registration_number: company.company_registration_number || "",
      contact_person_name: company.contact_person_name || "",
      contact_person_position: company.contact_person_position || "",
      bank_name: company.bank_name || "",
      bank_account_holder: company.bank_account_holder || "",
      iban: company.iban || "",
      bic: company.bic || "",
      primary_color: company.primary_color,
      secondary_color: company.secondary_color,
    });
  };

  const handleSave = async () => {
    if (editingCompany) {
      await updateProfile.mutateAsync({
        id: editingCompany.id,
        updates: editForm,
      });
      setIsEditing(false);
      setSelectedCompany(null);
    }
  };

  const handleSetDefault = async (company: CompanyProfile) => {
    await setDefault.mutateAsync({
      userId: company.user_id,
      profileId: company.id,
    });
  };

  const handleExport = () => {
    const exportData = companies.map((c) => ({
      id: c.id,
      company_name: c.company_name,
      profile_name: c.profile_name,
      email: c.company_email,
      phone: c.company_phone || "",
      city: c.company_city || "",
      country: c.company_country,
      profile_type: c.profile_type,
      is_default: c.is_default ? "Yes" : "No",
      user_email: c.user?.email || "",
      created_at: formatDate(c.created_at),
    }));

    exportToCSV(exportData, {
      filename: "companies",
      headers: [
        "ID",
        "Company Name",
        "Profile Name",
        "Email",
        "Phone",
        "City",
        "Country",
        "Type",
        "Default",
        "User Email",
        "Created",
      ],
    });
  };

  // Get unique countries from stats
  const uniqueCountries = stats?.byCountry.map((c) => c.country) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Profiles</h1>
          <p className="text-muted-foreground mt-2">Manage company profiles</p>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Profiles</h1>
          <p className="text-muted-foreground mt-2">Manage company profiles</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Error loading companies</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Profiles</h1>
          <p className="text-muted-foreground mt-2">
            Manage company profiles ({paginatedData?.total || 0} total)
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Profiles"
            value={stats.total}
            icon={Building2}
            description="All company profiles"
          />
          <StatCard
            title="Personal"
            value={stats.personal}
            icon={User}
            description="Personal profiles"
          />
          <StatCard
            title="Team"
            value={stats.team}
            icon={Building2}
            description="Team profiles"
          />
          <StatCard
            title="Default Profiles"
            value={stats.defaults}
            icon={Star}
            description="Set as default"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name, email, profile name, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="team">Team</SelectItem>
          </SelectContent>
        </Select>

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Companies List - Mobile Card View */}
      <div className="md:hidden space-y-4">
        {companies.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8">
            <EmptyState
              icon={Building2}
              title="No company profiles found"
              description={
                searchQuery
                  ? `No companies match your search "${searchQuery}"`
                  : "No company profiles registered yet"
              }
            />
          </div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(company);
                setIsEditing(false);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {company.company_name}
                    {company.is_default && (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {company.profile_name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Contact</div>
                  <div className="space-y-1">
                    {company.company_email && (
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {company.company_email}
                      </div>
                    )}
                    {company.company_phone && (
                      <div className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {company.company_phone}
                      </div>
                    )}
                    {company.company_website && (
                      <div className="text-sm flex items-center gap-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {company.company_website}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Location</div>
                  {(company.company_city || company.company_country) && (
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {[company.company_city, company.company_country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Type</div>
                  <Badge variant="outline" className="text-xs">
                    {company.profile_type}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Owner</div>
                  <div className="text-sm">
                    {company.user?.email || "Unknown"}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">
                    {formatDate(company.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {paginatedData && paginatedData.totalPages > 1 && (
          <div className="pt-4">
            <Pagination
              currentPage={page}
              totalPages={paginatedData.totalPages}
              onPageChange={setPage}
              totalItems={paginatedData.total}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Companies Table - Desktop View */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[22%]" />
            <col className="w-[15%] hidden lg:table-column" />
            <col className="w-[12%]" />
            <col className="w-[18%]" />
            <col className="w-[15%] hidden xl:table-column" />
          </colgroup>
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Company
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contact
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Location
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Owner
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {companies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8">
                  <EmptyState
                    icon={Building2}
                    title="No company profiles found"
                    description={
                      searchQuery
                        ? `No companies match your search "${searchQuery}"`
                        : "No company profiles registered yet"
                    }
                  />
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest("button") ||
                      (e.target as HTMLElement).closest('[role="menu"]')
                    ) {
                      return;
                    }
                    handleEdit(company);
                    setIsEditing(false);
                  }}
                >
                  <td className="px-3 lg:px-4 py-4">
                    <div className="min-w-0">
                      <div className="font-medium flex items-center gap-1.5">
                        <span className="truncate">{company.company_name}</span>
                        {company.is_default && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex-shrink-0 text-xs px-1.5 py-0">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5 truncate">
                        {company.profile_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-4">
                    <div className="space-y-0.5 min-w-0">
                      {company.company_email && (
                        <div className="text-sm flex items-center gap-1 min-w-0">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{company.company_email}</span>
                        </div>
                      )}
                      {company.company_phone && (
                        <div className="text-sm flex items-center gap-1 min-w-0">
                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{company.company_phone}</span>
                        </div>
                      )}
                      {company.company_website && (
                        <div className="text-sm hidden xl:flex items-center gap-1 min-w-0">
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{company.company_website}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-4 hidden lg:table-cell">
                    {(company.company_city || company.company_country) && (
                      <div className="text-sm flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {[company.company_city, company.company_country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 lg:px-4 py-4">
                    <Badge variant="outline" className="whitespace-nowrap text-xs">
                      {company.profile_type}
                    </Badge>
                  </td>
                  <td className="px-3 lg:px-4 py-4">
                    <div className="text-sm truncate" title={company.user?.email || "Unknown"}>
                      {company.user?.email || "Unknown"}
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-4 text-sm text-muted-foreground hidden xl:table-cell whitespace-nowrap">
                    {formatDate(company.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {paginatedData && paginatedData.totalPages > 1 && (
          <div className="px-4 lg:px-6 py-4 border-t border-border">
            <Pagination
              currentPage={page}
              totalPages={paginatedData.totalPages}
              onPageChange={setPage}
              totalItems={paginatedData.total}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Edit Sheet */}
      <Sheet
        open={!!selectedCompany}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCompany(null);
            setIsEditing(false);
            setEditingCompany(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Edit Company Profile" : "Company Profile Details"}
            </SheetTitle>
            <SheetDescription>
              {selectedCompany?.company_name
                ? isEditing
                  ? `Editing: ${selectedCompany.company_name}`
                  : `Viewing: ${selectedCompany.company_name}`
                : isEditing
                  ? "Update company profile information"
                  : "View company profile information"}
            </SheetDescription>
          </SheetHeader>
          {selectedCompany && (
            <div className="space-y-6 py-6">
              {!isEditing ? (
                <>
                  {/* View Mode */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold text-lg">
                          {selectedCompany.company_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCompany.profile_name}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Email
                        </div>
                        <div className="text-sm">{selectedCompany.company_email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Phone
                        </div>
                        <div className="text-sm">
                          {selectedCompany.company_phone || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Location
                        </div>
                        <div className="text-sm">
                          {[
                            selectedCompany.company_city,
                            selectedCompany.company_country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Type
                        </div>
                        <Badge variant="outline">
                          {selectedCompany.profile_type}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Default
                        </div>
                        <div className="text-sm">
                          {selectedCompany.is_default ? "Yes" : "No"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Created
                        </div>
                        <div className="text-sm">
                          {formatDate(selectedCompany.created_at)}
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
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Company Profile
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name *</Label>
                        <Input
                          value={editForm.company_name || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Profile Name *</Label>
                        <Input
                          value={editForm.profile_name || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              profile_name: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={editForm.company_email || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={editForm.company_phone || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={editForm.company_address || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            company_address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={editForm.company_city || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input
                          value={editForm.company_postal_code || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_postal_code: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={editForm.company_country || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_country: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tax ID</Label>
                        <Input
                          value={editForm.company_tax_id || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_tax_id: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>VAT ID</Label>
                        <Input
                          value={editForm.company_vat_id || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              company_vat_id: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editForm.primary_color || "#000000"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                primary_color: e.target.value,
                              })
                            }
                            className="w-20"
                          />
                          <Input
                            value={editForm.primary_color || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                primary_color: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editForm.secondary_color || "#000000"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                secondary_color: e.target.value,
                              })
                            }
                            className="w-20"
                          />
                          <Input
                            value={editForm.secondary_color || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                secondary_color: e.target.value,
                              })
                            }
                          />
                        </div>
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
                    setEditForm({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!editForm.company_name || updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCompany(null);
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
