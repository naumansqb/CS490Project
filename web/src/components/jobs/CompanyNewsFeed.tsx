'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Newspaper,
  ExternalLink,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { refreshCompanyNews, exportCompanyNews } from '@/lib/company.api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Company News interfaces matching our AI types
export interface CompanyNewsArticle {
  title: string;
  source: string;
  url: string;
  publishDate: string; // ISO date format
  category: 'funding' | 'product_launch' | 'hiring' | 'acquisition' | 'partnership' | 'award' | 'leadership_change' | 'general';
  summary: string;
  keyPoints: string[];
  relevanceScore: number; // 0-100
  thumbnailUrl?: string | null;
}

interface CompanyNewsFeedProps {
  companyId?: string;
  companyName: string;
  loading?: boolean;
  error?: string | null;
  news?: CompanyNewsArticle[]; // Real API data
  onNewsSelect?: (news: CompanyNewsArticle) => void; // For integration with cover letters
  onRefresh?: () => void; // Callback when news is refreshed
}

// Category display names and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  funding: { label: 'Funding', color: 'text-green-800', bgColor: 'bg-green-100' },
  product_launch: { label: 'Product Launch', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  hiring: { label: 'Hiring', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  acquisition: { label: 'Acquisition', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  partnership: { label: 'Partnership', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
  award: { label: 'Award', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  leadership_change: { label: 'Leadership', color: 'text-red-800', bgColor: 'bg-red-100' },
  general: { label: 'General', color: 'text-gray-800', bgColor: 'bg-gray-100' },
};

export default function CompanyNewsFeed({
  companyId,
  companyName,
  loading = false,
  error = null,
  news = [],
  onNewsSelect,
  onRefresh,
}: CompanyNewsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'relevance'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [displayLimit, setDisplayLimit] = useState<number>(3); // Show 3 articles by default

  // Use provided news data (from API)
  const newsData = news || [];

  // Filter and sort news
  const filteredAndSortedNews = useMemo(() => {
    let filtered = newsData;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((article) => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.source.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      } else {
        return b.relevanceScore - a.relevanceScore;
      }
    });

    return sorted;
  }, [newsData, selectedCategory, sortBy, searchQuery]);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(3);
  }, [selectedCategory, sortBy, searchQuery]);

  // Get articles to display (limited to displayLimit)
  const displayedNews = filteredAndSortedNews.slice(0, displayLimit);
  const hasMore = filteredAndSortedNews.length > displayLimit;

  const toggleExpand = (articleTitle: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleTitle)) {
      newExpanded.delete(articleTitle);
    } else {
      newExpanded.add(articleTitle);
    }
    setExpandedArticles(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Use companyId if available, otherwise use companyName
      const response = await refreshCompanyNews(
        companyId || companyName,
        undefined,
        !companyId // useName = true if no companyId
      );
      if (response.success && response.data) {
        // Update news via parent callback (which will update the news prop)
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error: any) {
      console.error('[Company News Refresh Error]', error);
      alert('Failed to refresh news. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      // Use companyId if available, otherwise use companyName
      await exportCompanyNews(
        companyId || companyName,
        format,
        {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined,
          useName: !companyId, // useName = true if no companyId
        }
      );
    } catch (error: any) {
      console.error('[Company News Export Error]', error);
      alert(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper size={20} />
            Company News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3bafba]"></div>
            <span className="ml-3 text-gray-600">Loading company news...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper size={20} />
            Company News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            <p>Failed to load company news: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper size={20} />
            Company News
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing || loading}
              className="flex items-center gap-2"
              title="Refresh news (force new AI call)"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {filteredAndSortedNews.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="flex items-center gap-2"
                  >
                    <Download size={16} className={exporting ? 'animate-spin' : ''} />
                    {exporting ? 'Exporting...' : 'Export'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText size={16} className="mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'relevance')}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="relevance">Sort by Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* News Count */}
        {filteredAndSortedNews.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {displayedNews.length} of {filteredAndSortedNews.length} article{filteredAndSortedNews.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* News Articles */}
        {filteredAndSortedNews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
            {loading ? (
              <p>Loading company news...</p>
            ) : news && news.length === 0 ? (
              <>
                <p>No recent news articles found for {companyName}.</p>
                <p className="text-sm mt-2">News will appear here as it becomes available.</p>
              </>
            ) : (
              <>
                <p>No news articles found.</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Try adjusting your search or filters.</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedNews.map((article, index) => {
              const isExpanded = expandedArticles.has(article.title);
              const categoryConfig = CATEGORY_CONFIG[article.category];

              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={`${categoryConfig.bgColor} ${categoryConfig.color} border-0`}
                            >
                              {categoryConfig.label}
                            </Badge>
                            <span className={`text-sm font-medium ${getRelevanceColor(article.relevanceScore)}`}>
                              {article.relevanceScore}% relevant
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(article.publishDate)}
                            </div>
                            <span>•</span>
                            <span>{article.source}</span>
                          </div>
                        </div>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3bafba] hover:text-[#34a0ab] transition-colors"
                          title={article.url.includes('google.com/search') ? 'Search Google for this article' : 'Read full article'}
                        >
                          <ExternalLink size={20} />
                        </a>
                      </div>

                      {/* Summary */}
                      <p className="text-gray-700">{article.summary}</p>

                      {/* Key Points (Expandable) */}
                      {article.keyPoints && article.keyPoints.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleExpand(article.title)}
                            className="flex items-center gap-2 text-sm font-medium text-[#3bafba] hover:text-[#34a0ab] transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={16} />
                                Hide Key Points
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} />
                                Show Key Points ({article.keyPoints.length})
                              </>
                            )}
                          </button>
                          {isExpanded && (
                            <ul className="mt-2 space-y-1 pl-4">
                              {article.keyPoints.map((point, idx) => (
                                <li key={idx} className="text-sm text-gray-600 list-disc">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Action Button (for cover letter integration) */}
                      {onNewsSelect && (
                        <Button
                          onClick={() => onNewsSelect(article)}
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          Use in Cover Letter
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Show More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setDisplayLimit(filteredAndSortedNews.length)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Show All Articles ({filteredAndSortedNews.length - displayLimit} more)
                </Button>
              </div>
            )}

            {/* Show Less Button (if showing all) */}
            {displayLimit >= filteredAndSortedNews.length && filteredAndSortedNews.length > 3 && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setDisplayLimit(3)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Show Less
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

