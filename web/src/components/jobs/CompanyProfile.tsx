import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  MapPin as AddressIcon,
  Star,
  Linkedin,
  Twitter,
  Briefcase,
  Target,
  TrendingUp,
  User,
  Contact,
  Bell,
  BellOff,
  Loader2,
  RefreshCw,
  Download  
} from 'lucide-react';
import { checkFollowStatus, followCompany, unfollowCompany, exportCompanyProfile  } from '@/lib/company.api';
import { useAuth } from '@/contexts/AuthContext';

// Company data interface matching our AI output
export interface CompanyData {
  id?: string;
  companyName: string;
  companySize?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  description?: string | null;
  mission?: string | null;
  logoUrl?: string | null;
  contactInfo?: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  glassdoorRating?: number | null;
  socialMedia?: {
    linkedin?: string | null;
    twitter?: string | null;
  } | null;
  leadership?: Array<{
    name: string;
    title: string;
  }> | null;
  productsAndServices?: string[] | null;
  competitiveLandscape?: string | null;
}

interface CompanyProfileProps {
  company: CompanyData | null;
  companyName?: string; // Fallback if company data not loaded yet
  loading?: boolean;
  error?: string | null;
  companyId?: string; // Company ID for follow functionality
  onFollowChange?: () => void; // Callback when follow status changes
  onRefresh?: () => void; // Callback when refresh is clicked
}

export default function CompanyProfile({ 
  company, 
  companyName, 
  loading = false, 
  error = null,
  companyId,
  onFollowChange,
  onRefresh
}: CompanyProfileProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Check follow status when component mounts or companyId changes
  useEffect(() => {
    if (companyId && user?.uid) {
      checkFollow();
    } else {
      setIsFollowing(false);
    }
  }, [companyId, user?.uid]);

  const checkFollow = async () => {
    if (!companyId || !user?.uid) return;
    
    try {
      setFollowStatusLoading(true);
      const response = await checkFollowStatus(companyId);
      if (response.success) {
        setIsFollowing(response.data.isFollowing);
      }
    } catch (error) {
      console.error('[Company Profile] Failed to check follow status:', error);
      setIsFollowing(false);
    } finally {
      setFollowStatusLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!companyId || !user?.uid) return;
    
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await unfollowCompany(companyId);
        setIsFollowing(false);
      } else {
        await followCompany(companyId);
        setIsFollowing(true);
      }
      // Notify parent to refresh news alerts
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('[Company Profile] Failed to follow/unfollow:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

    const handleExport = async () => {
  if (!companyId) {
    alert('Company data must be saved before exporting.');
    return;
  }
  
  try {
    setExportLoading(true);
    await exportCompanyProfile(companyId); // No need to handle blob manually now
  } catch (error) {
    console.error('[Company Profile] Failed to export:', error);
    alert('Failed to export company profile. Please try again.');
  } finally {
    setExportLoading(false);
  }
};

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
            <span className="ml-3 text-gray-600">Researching company information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <p>Failed to load company information: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no company data
  if (!company && !companyName) {
    return null;
  }

  const displayName = company?.companyName || companyName || 'Unknown Company';

  // Determine which tabs should be shown
  const hasMission = company?.mission;
  const hasProducts = company?.productsAndServices && company.productsAndServices.length > 0;
  const hasLeadership = company?.leadership && company.leadership.length > 0;
  const hasMarketPosition = company?.competitiveLandscape;

  // Debug logging
  console.log('[CompanyProfile] Tab visibility check:', {
    hasMission,
    hasProducts,
    hasLeadership,
    hasMarketPosition,
    productsAndServices: company?.productsAndServices,
    productsAndServicesType: typeof company?.productsAndServices,
    productsAndServicesIsArray: Array.isArray(company?.productsAndServices),
    leadership: company?.leadership,
    leadershipType: typeof company?.leadership,
    leadershipIsArray: Array.isArray(company?.leadership),
    competitiveLandscape: company?.competitiveLandscape,
    fullCompanyData: company,
  });

  // Count available tabs
  const availableTabs = [hasMission, hasProducts, hasLeadership, hasMarketPosition].filter(Boolean).length;
  const showTabs = availableTabs > 1; // Only show tabs if more than one section exists
  
  console.log('[CompanyProfile] Tab calculation:', {
    availableTabs,
    showTabs,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {company?.logoUrl && (
            <img 
              src={company.logoUrl} 
              alt={`${displayName} logo`}
              className="h-12 w-12 object-contain rounded"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            Company Information
          </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {companyId && (
              <Button
                onClick={handleExport}
                disabled={exportLoading || loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                title="Export company profile as PDF"
              >
                {exportLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Export
              </Button>
            )}
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center gap-2"
                title="Refresh company research (force new AI call)"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
          {companyId && user?.uid && (
            <Button
              onClick={handleFollow}
              disabled={followLoading || followStatusLoading}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={isFollowing ? "" : "bg-[#3bafba] hover:bg-[#34a0ab]"}
            >
              {followLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : isFollowing ? (
                <BellOff size={16} className="mr-2" />
              ) : (
                <Bell size={16} className="mr-2" />
              )}
              {followLoading
                ? "Updating..."
                : isFollowing
                ? "Unfollow"
                : "Follow for News"}
            </Button>
          )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company?.companySize && (
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Company Size</span>
                <p className="font-medium">{company.companySize} employees</p>
              </div>
            </div>
          )}
          
          {company?.industry && (
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Industry</span>
                <p className="font-medium">{company.industry}</p>
              </div>
            </div>
          )}
          
          {company?.location && (
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-sm text-gray-600">Headquarters</span>
                <p className="font-medium">{company.location}</p>
              </div>
            </div>
          )}

          {company?.glassdoorRating !== null && company?.glassdoorRating !== undefined && (
            <div className="flex items-center gap-2">
              <Star size={18} className="text-yellow-500 shrink-0 fill-yellow-500" />
              <div>
                <span className="text-sm text-gray-600">Glassdoor Rating</span>
                <p className="font-medium">{company.glassdoorRating.toFixed(1)} / 5.0</p>
              </div>
            </div>
          )}
        </div>

        {/* Website Link - Below basic info */}
        {company?.website && (
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-gray-400 shrink-0" />
            <div>
              <span className="text-sm text-gray-600">Website: </span>
              <a 
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        )}

        {/* Separator after website */}
        {company?.website && <div className="border-t pt-4"></div>}

        {/* Company Description */}
        {company?.description && (
          <div className="mb-18">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Building2 size={18} className="text-gray-400" />
              About
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{company.description}</p>
          </div>
        )}

        {/* Tabs for Mission, Products, Leadership, Market Position */}
        {showTabs ? (
          <Tabs defaultValue={hasMission ? "mission" : hasProducts ? "products" : hasLeadership ? "leadership" : "market"} className="w-full">
            <TabsList className={`grid w-full ${availableTabs === 2 ? 'grid-cols-2' : availableTabs === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {hasMission && (
                <TabsTrigger value="mission" className="flex items-center gap-2">
                  <Target size={16} />
                  Mission
                </TabsTrigger>
              )}
              {hasProducts && (
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Briefcase size={16} />
                  Products
                </TabsTrigger>
              )}
              {hasLeadership && (
                <TabsTrigger value="leadership" className="flex items-center gap-2">
                  <User size={16} />
                  Leadership
                </TabsTrigger>
              )}
              {hasMarketPosition && (
                <TabsTrigger value="market" className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Market
                </TabsTrigger>
              )}
            </TabsList>

            {hasMission && (
              <TabsContent value="mission" className="mt-4 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Target size={18} className="text-gray-400" />
                    Mission & Values
                  </h3>
                  <p className="text-gray-700 italic">{company.mission}</p>
                </div>
              </TabsContent>
            )}

            {hasProducts && (
              <TabsContent value="products" className="mt-4 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Briefcase size={18} className="text-gray-400" />
                    Products & Services
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.productsAndServices?.map((product, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            {hasLeadership && (
              <TabsContent value="leadership" className="mt-4 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User size={18} className="text-gray-400" />
                    Leadership Team
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.leadership?.map((leader, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="font-semibold text-gray-900">{leader.name}</div>
                        <div className="text-sm text-gray-600">{leader.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            {hasMarketPosition && (
              <TabsContent value="market" className="mt-4 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <TrendingUp size={18} className="text-gray-400" />
                    Market Position
                  </h3>
                  <p className="text-gray-700">{company.competitiveLandscape}</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          // If only one section, show without tabs
          <>
            {hasMission && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Target size={18} className="text-gray-400" />
                  Mission & Values
                </h3>
                <p className="text-gray-700 italic">{company.mission}</p>
              </div>
            )}
            {hasProducts && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-400" />
                  Products & Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.productsAndServices?.map((product, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hasLeadership && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User size={18} className="text-gray-400" />
                  Leadership Team
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {company.leadership?.map((leader, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="font-semibold text-gray-900">{leader.name}</div>
                      <div className="text-sm text-gray-600">{leader.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasMarketPosition && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <TrendingUp size={18} className="text-gray-400" />
                  Market Position
                </h3>
                <p className="text-gray-700">{company.competitiveLandscape}</p>
              </div>
            )}
          </>
        )}

        {/* Separator before contact/social */}
        {((company?.contactInfo && (company.contactInfo.email || company.contactInfo.phone || company.contactInfo.address)) || 
           (company?.socialMedia && (company.socialMedia.linkedin || company.socialMedia.twitter))) && (
          <div className="border-t pt-4"></div>
        )}

        {/* Contact Information and Social Media - Grid Layout */}
        {((company?.contactInfo && (company.contactInfo.email || company.contactInfo.phone || company.contactInfo.address)) || 
           (company?.socialMedia && (company.socialMedia.linkedin || company.socialMedia.twitter))) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            {company?.contactInfo && (
              (company.contactInfo.email || company.contactInfo.phone || company.contactInfo.address) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Contact size={18} className="text-gray-400" />
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    {company.contactInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <a 
                          href={`mailto:${company.contactInfo.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {company.contactInfo.email}
                        </a>
                      </div>
                    )}
                    {company.contactInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <a 
                          href={`tel:${company.contactInfo.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {company.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {company.contactInfo.address && (
                      <div className="flex items-center gap-2">
                        <AddressIcon size={16} className="text-gray-400" />
                        <span className="text-gray-700">{company.contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Social Media Links */}
            {company?.socialMedia && (
              (company.socialMedia.linkedin || company.socialMedia.twitter) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Globe size={18} className="text-gray-400" />
                    Social Media
                  </h3>
                  <div className="flex flex-col gap-2">
                    {company.socialMedia.linkedin && (
                      <a
                        href={company.socialMedia.linkedin.startsWith('http') ? company.socialMedia.linkedin : `https://${company.socialMedia.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Linkedin size={18} />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {company.socialMedia.twitter && (
                      <a
                        href={company.socialMedia.twitter.startsWith('http') ? company.socialMedia.twitter : `https://${company.socialMedia.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Twitter size={18} />
                        <span>Twitter</span>
                      </a>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Empty State - No company data yet */}
        {!company && companyName && (
          <div className="text-center py-4 text-gray-500">
            <p>Company information will be available after research is completed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

