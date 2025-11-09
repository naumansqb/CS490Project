'use client'

import React, { useState, useMemo, useEffect  } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Clock, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOpportunitiesByUserId } from '@/lib/jobs.api';
import { Job } from '@/types/jobs.types';
import UpcomingDeadlines from './UpComingDeadlines';

export default function JobDeadlinesCalendar() {
  const { user } = useAuth(); 
  const [jobs, setJobs] = useState<Job[]>([]); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const loadJobs = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jobsData = await getJobOpportunitiesByUserId(user.uid);
        setJobs(jobsData as Job[]);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user]);
  

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar data
  const { daysInMonth, firstDayOfMonth, monthName, year } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });

    return { daysInMonth, firstDayOfMonth, monthName, year };
  }, [currentDate]);

  // Group jobs by deadline date
  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    jobs.forEach(job => {
      if (job.deadline) {
        const dateKey = new Date(job.deadline).toISOString().split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(job);
      }
    });
    return map;
  }, [jobs]);

  // Get jobs for a specific date
  const getJobsForDate = (day: number) => {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return jobsByDate.get(dateStr) || [];
  };

  // Get jobs for selected date
  const selectedDateJobs = useMemo(() => {
    if (!selectedDate) return [];
    return jobsByDate.get(selectedDate) || [];
  }, [selectedDate, jobsByDate]);

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in the past
  const isPast = (day: number) => {
    const date = new Date(year, currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
            <Card>
                <CardContent className="p-12 text-center">
                <p className="text-gray-600">Loading deadlines...</p>
                </CardContent>
            </Card>
            </div>
        );
    }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={32} />
            Application Deadlines
          </h1>
          <p className="text-gray-600 mt-1">Track your job application deadlines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {monthName} {year}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft size={20} />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (typeof day !== 'number') return day;

                const jobs = getJobsForDate(day);
                const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const hasJobs = jobs.length > 0;
                const todayDate = isToday(day);
                const pastDate = isPast(day);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                      aspect-square p-2 rounded-lg border-2 transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                      ${todayDate ? 'bg-blue-100 font-bold' : ''}
                      ${pastDate ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}
                      ${hasJobs ? 'font-semibold' : ''}
                      relative
                    `}
                  >
                    <div className="text-sm">{day}</div>
                    {hasJobs && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {jobs.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              pastDate ? 'bg-red-400' : 'bg-blue-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-blue-500 bg-blue-50"></div>
                <span>Selected Date</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span>Has Deadline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              ) : (
                'Select a Date'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Click on a date to view deadlines
              </p>
            ) : selectedDateJobs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No deadlines on this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateJobs.map(job => (
                  <div
                    key={job.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Building2 size={14} />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {job.industry}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        {job.jobType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines List */}
      <UpcomingDeadlines />
    </div>
  );
}