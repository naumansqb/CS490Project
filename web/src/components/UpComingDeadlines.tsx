import { useAuth } from "@/lib/firebase/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Job } from '@/types/jobs.types';
import { useEffect, useMemo, useState } from "react";
import { getJobOpportunitiesByUserId } from "@/lib/jobs.api";
import { AlertCircle, Calendar, Clock } from "lucide-react";

export default function UpcomingDeadlines(){
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

    const getDeadlineUrgency = (dateStr: string) => {
        const deadline = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 3) return 'soon'; 
        return 'normal'; 
    };

    const urgencyStyles = {
        soon: 'p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg',
        normal: 'p-4 border border-green-200 rounded-lg'
    };

    const headerStyles = {
        soon: 'font-semibold text-yellow-700 mb-2 flex items-center gap-2',
        normal: 'font-semibold text-green-700 mb-2 flex items-center gap-2'
    };

    return (
        <div>
            <Card>
                <CardHeader>
                <CardTitle>Upcoming Deadlines (Next 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-2">
                    {Array.from(jobsByDate.entries())
                    .filter(([date]) => {
                        const deadline = new Date(date);
                        const today = new Date();
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(today.getDate() + 30);
                        return deadline >= today && deadline <= thirtyDaysFromNow;
                    })
                    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                    .map(([date, jobs]) => (
                        <div key={date} className={urgencyStyles[getDeadlineUrgency(date)]}>
                        <div className={headerStyles[getDeadlineUrgency(date)]}>
                            <Calendar size={16} />
                            {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                            })}
                            <span className="text-sm font-normal text-gray-500">
                            ({Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                            </span>
                            {getDeadlineUrgency(date) === 'soon' && (
                               <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex items-center gap-1">
                                    <Clock size={12} />
                                    Deadline Soon
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 ml-6">
                            {jobs.map(job => (
                            <div key={job.id} className="text-sm">
                                <span className="font-medium">{job.title}</span>
                                <span className="text-gray-500"> at {job.company}</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    ))}
                </div>
                </CardContent>
            </Card>
        </div>
    )
}