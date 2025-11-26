'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Clock, Building2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getJobOpportunitiesByUserId } from '@/lib/jobs.api';
import { Job } from '@/types/jobs.types';
import UpcomingDeadlines from './UpComingDeadlines';
import { getUserInterviews, InterviewWithJob } from '@/lib/interviews.api';
import { getFollowUpReminders, type ProfessionalContact } from '@/lib/contacts.api';
import { getReferralRequests, type ReferralRequest } from '@/lib/referralRequests.api';
import { useRouter } from 'next/navigation';

export default function JobDeadlinesCalendar() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<InterviewWithJob[]>([]);
  const [contactReminders, setContactReminders] = useState<ProfessionalContact[]>([]);
  const [referralFollowUps, setReferralFollowUps] = useState<ReferralRequest[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load jobs
        const jobsData = await getJobOpportunitiesByUserId(user.uid);
        setJobs(jobsData as Job[]);

        // Load interviews
        const interviewsData = await getUserInterviews();
        setInterviews(interviewsData);

        try {
          const remindersData = await getFollowUpReminders(365);
          setContactReminders(remindersData);
        } catch (error) {
          console.error('Failed to load contact reminders:', error);
        }

        try {
          const referralData = await getReferralRequests();
          const followUps = referralData.filter(r => r.followUpDate || r.nextFollowUpDate);
          setReferralFollowUps(followUps);
        } catch (error) {
          console.error('Failed to load referral follow-ups:', error);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
        const deadlineDate = new Date(job.deadline);
        const year = deadlineDate.getFullYear();
        const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
        const day = String(deadlineDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(job);
      }
    });

    return map;
  }, [jobs]);

  const interviewsByDate = useMemo(() => {
    const map = new Map<string, InterviewWithJob[]>();
    interviews.forEach(interview => {
      if (interview.scheduled_date) {
        const interviewDate = new Date(interview.scheduled_date);
        const year = interviewDate.getFullYear();
        const month = String(interviewDate.getMonth() + 1).padStart(2, '0');
        const day = String(interviewDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(interview);
      }
    });

    return map;
  }, [interviews]);

  const contactRemindersByDate = useMemo(() => {
    const map = new Map<string, ProfessionalContact[]>();
    contactReminders.forEach(contact => {
      if (contact.nextFollowUpDate) {
        const reminderDate = new Date(contact.nextFollowUpDate);
        const year = reminderDate.getFullYear();
        const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
        const day = String(reminderDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(contact);
      }
    });

    return map;
  }, [contactReminders]);

  const referralFollowUpsByDate = useMemo(() => {
    const map = new Map<string, ReferralRequest[]>();
    referralFollowUps.forEach(referral => {
      const followUpDate = referral.nextFollowUpDate || referral.followUpDate;
      if (followUpDate) {
        const raw = String(followUpDate);
        const dateKey = raw.split('T')[0];
        if (!dateKey) {
          return;
        }

        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(referral);
      }
    });

    return map;
  }, [referralFollowUps]);



  // Get jobs for a specific date
  const getDataForDate = (day: number) => {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      jobs: jobsByDate.get(dateStr) || [],
      interviews: interviewsByDate.get(dateStr) || [],
      contactReminders: contactRemindersByDate.get(dateStr) || [],
      referralFollowUps: referralFollowUpsByDate.get(dateStr) || [],
    };
  };

  // Get jobs for selected date
  const selectedDateData = useMemo(() => {
    if (!selectedDate) return { jobs: [], interviews: [], contactReminders: [], referralFollowUps: [] };
    return {
      jobs: jobsByDate.get(selectedDate) || [],
      interviews: interviewsByDate.get(selectedDate) || [],
      contactReminders: contactRemindersByDate.get(selectedDate) || [],
      referralFollowUps: referralFollowUpsByDate.get(selectedDate) || [],
    };
  }, [selectedDate, jobsByDate, interviewsByDate, contactRemindersByDate, referralFollowUpsByDate]);

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

                const { jobs: dayJobs, interviews: dayInterviews, contactReminders: dayReminders, referralFollowUps: dayReferralFollowUps } = getDataForDate(day);
                const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const hasDeadlines = dayJobs.length > 0;
                const hasInterviews = dayInterviews.length > 0;
                const hasContactReminders = dayReminders.length > 0;
                const hasReferralFollowUps = dayReferralFollowUps.length > 0;
                const hasEvents = hasDeadlines || hasInterviews || hasContactReminders || hasReferralFollowUps;
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
                        ${hasEvents ? 'font-semibold' : ''}
                        relative
                      `}
                  >
                    <div className="text-sm">{day}</div>
                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {/* Show deadline dots */}
                        {dayJobs.slice(0, 2).map((_, i) => (
                          <div
                            key={`deadline-${i}`}
                            className={`w-1.5 h-1.5 rounded-full ${pastDate ? 'bg-red-400' : 'bg-blue-500'
                              }`}
                          />
                        ))}
                        {/* Show interview dots */}
                        {dayInterviews.slice(0, 2).map((_, i) => (
                          <div
                            key={`interview-${i}`}
                            className={`w-1.5 h-1.5 rounded-full ${pastDate ? 'bg-orange-400' : 'bg-green-500'
                              }`}
                          />
                        ))}
                        {/* Show contact reminder dots */}
                        {dayReminders.slice(0, 2).map((_, i) => (
                          <div
                            key={`reminder-${i}`}
                            className={`w-1.5 h-1.5 rounded-full ${pastDate ? 'bg-cyan-400' : 'bg-cyan-500'
                              }`}
                          />
                        ))}
                        {/* Show referral follow-up dots */}
                        {dayReferralFollowUps.slice(0, 2).map((_, i) => (
                          <div
                            key={`referral-${i}`}
                            className={`w-1.5 h-1.5 rounded-full ${pastDate ? 'bg-purple-400' : 'bg-purple-500'
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
                <span>Deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>Interview</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                <span>Contact Follow-up</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <span>Referral Follow-up</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Click on a date to view deadlines and interviews
              </p>
            ) : selectedDateData.jobs.length === 0 && selectedDateData.interviews.length === 0 && selectedDateData.contactReminders.length === 0 && selectedDateData.referralFollowUps.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No events on this date
              </p>
            ) : (
              <div className="space-y-4">
                {/* Deadlines Section */}
                {selectedDateData.jobs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Application Deadlines ({selectedDateData.jobs.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedDateData.jobs.map(job => (
                        <div
                          key={job.id}
                          className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <h5 className="font-semibold text-gray-900 mb-1">{job.title}</h5>
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
                  </div>
                )}

                {/* Interviews Section */}
                {selectedDateData.interviews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Interviews ({selectedDateData.interviews.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedDateData.interviews.map(interview => (
                        <div
                          key={interview.id}
                          className="p-3 border border-green-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all bg-green-50 cursor-pointer"
                          onClick={() => router.push(`/jobs/${user?.uid}?jobId=${interview.job_opportunity.id}`)}
                        >
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {interview.job_opportunity.title}
                          </h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Building2 size={14} />
                            <span>{interview.job_opportunity.company}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Clock size={14} />
                            <span>
                              {new Date(interview.scheduled_date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                              {interview.interview_type.replace('-', ' ')}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                              {interview.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Follow-up Reminders Section */}
                {selectedDateData.contactReminders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      Contact Follow-ups ({selectedDateData.contactReminders.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedDateData.contactReminders.map(contact => (
                        <div
                          key={contact.id}
                          onClick={() => router.push(`/dashboard/contacts?contactId=${contact.id}`)}
                          className="p-3 border border-cyan-200 rounded-lg hover:border-cyan-300 hover:shadow-sm transition-all bg-cyan-50 cursor-pointer"
                        >
                          <h5 className="font-semibold text-gray-900 mb-1">{contact.fullName}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Users size={14} />
                            <span>{contact.jobTitle || 'Contact'}{contact.company ? ` at ${contact.company}` : ''}</span>
                          </div>
                          {contact.relationshipType && (
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs rounded-full capitalize">
                                {contact.relationshipType}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referral Follow-ups Section */}
                {selectedDateData.referralFollowUps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Referral Follow-ups ({selectedDateData.referralFollowUps.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedDateData.referralFollowUps.map(referral => (
                        <div
                          key={referral.id}
                          onClick={() => referral.jobOpportunity && router.push(`/jobs/${user?.uid}?jobId=${referral.jobOpportunity.id}`)}
                          className="p-3 border border-purple-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all bg-purple-50 cursor-pointer"
                        >
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {referral.contact?.fullName || 'Contact'}
                          </h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Building2 size={14} />
                            <span>{referral.jobOpportunity?.company || 'Company'}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {referral.jobOpportunity?.title || 'Job Title'}
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                              {referral.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
