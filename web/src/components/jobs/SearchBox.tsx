import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface JobFilters {
  searchTerm: string;
  industry: string;
  jobType: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  deadlineFrom: string;
  deadlineTo: string;
  sortBy: string;
}

interface JobFiltersProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
  industries: string[];
  jobTypes: string[];
  resultCount: number;
}

export default function SearchBox({
  filters,
  onFilterChange,
  onClearFilters,
  industries,
  jobTypes,
  resultCount
}: JobFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleChange = (field: keyof JobFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value, index) => 
      index === 0 ? false : value !== '' && value !== 'all' && value !== 'dateAdded'
  );

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search by title, company, or keywords..."
            value={filters.searchTerm}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Industry
            </label>
            <select
              value={filters.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Job Type
            </label>
            <select
              value={filters.jobType}
              onChange={(e) => handleChange('jobType', e.target.value)}
              className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="all">All Types</option>
              {jobTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value)}
              className="w-full h-9 px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="dateAdded">Date Added</option>
              <option value="deadline">Deadline</option>
              <option value="salary">Salary (High to Low)</option>
              <option value="company">Company (A-Z)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Location
            </label>
            <Input
              placeholder="e.g., New York"
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </span>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-sm"
              >
                <X size={16} className="mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Min Salary ($)
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={filters.salaryMin}
                  onChange={(e) => handleChange('salaryMin', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Max Salary ($)
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 150000"
                  value={filters.salaryMax}
                  onChange={(e) => handleChange('salaryMax', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Deadline From
                </label>
                <Input
                  type="date"
                  value={filters.deadlineFrom}
                  onChange={(e) => handleChange('deadlineFrom', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Deadline To
                </label>
                <Input
                  type="date"
                  value={filters.deadlineTo}
                  onChange={(e) => handleChange('deadlineTo', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}