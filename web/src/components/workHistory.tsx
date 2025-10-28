'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreVertical, Briefcase, MapPin, Edit, Trash2, Dot } from 'lucide-react'
import {
    WorkExperience,
    getWorkExperiencesByUserId,
    deleteWorkExperience,
} from '@/lib/workExperience.api'
import AddEmploymentForm from './addWorkExperienceForm'
import { format } from 'date-fns'

interface EmploymentHistoryProps {
    userId: string
}

export default function EmploymentHistory({ userId }: EmploymentHistoryProps) {
    const [experiences, setExperiences] = useState<WorkExperience[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null)

    const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string>('')

    const fetchExperiences = async () => {
        try {
            setLoading(true)
            const data = await getWorkExperiencesByUserId(userId)
            setExperiences(data)
        } catch (error) {
            console.error('Failed to load work experiences:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userId) fetchExperiences()
    }, [userId])

    const fmt = (d?: string | null) => {
        if (!d) return ''
        try {
            return format(new Date(d), 'MMM yyyy')
        } catch {
            return d as string
        }
    }

    const dateRange = (exp: WorkExperience) => {
        const start = fmt(exp.startDate)
        const end = exp.isCurrent ? 'Present' : exp.endDate ? fmt(exp.endDate) : 'Present'
        return `${start} – ${end}`
    }

    const locationOf = (exp: WorkExperience) => {
        if (exp.isRemote) return 'Remote'
        const p = [exp.locationCity, exp.locationState, exp.locationCountry].filter(Boolean)
        return p.length ? p.join(', ') : ''
    }

    const sorted = useMemo(() => {
        const clone = [...experiences]
        clone.sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1
            if (!a.isCurrent && b.isCurrent) return 1
            const ad = new Date(a.startDate).getTime()
            const bd = new Date(b.startDate).getTime()
            return bd - ad
        })
        return clone
    }, [experiences])

    const canDelete = sorted.length > 1

    const handleEdit = (experience: WorkExperience) => {
        setEditingExperience(experience)
        setIsAddModalOpen(true)
    }

    const handleDeleteClick = (id: string) => {
        if (!canDelete) return
        setExperienceToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!experienceToDelete) return
        const id = experienceToDelete

        setExperiences(prev => prev.filter(exp => exp.id !== id))

        try {
            await deleteWorkExperience(id)

            setDeleteDialogOpen(false)
            setExperienceToDelete(null)

            setDeleteSuccessMessage('Work experience deleted successfully!')
            setTimeout(() => setDeleteSuccessMessage(''), 4000)
        } catch (error) {
            console.error('Delete call threw, verifying actual server state...', error)

            try {
                const latest = await getWorkExperiencesByUserId(userId)
                setExperiences(latest)
                const stillExists = latest.some(e => e.id === id)

                setDeleteDialogOpen(false)
                setExperienceToDelete(null)

                if (stillExists) {
                    setDeleteSuccessMessage('Failed to delete entry. Please try again.')
                } else {
                    setDeleteSuccessMessage('Work experience deleted successfully!')
                }
                setTimeout(() => setDeleteSuccessMessage(''), 4000)
            } catch (refetchErr) {
                console.error('Follow-up fetch failed:', refetchErr)
                setDeleteSuccessMessage('Failed to delete entry. Please try again.')
                setTimeout(() => setDeleteSuccessMessage(''), 4000)
            }
        }
    }

    const handleFormSuccess = () => {
        setIsAddModalOpen(false)
        setEditingExperience(null)
        fetchExperiences()
    }

    // ---- UI ----
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-slate-700" />
                    Work Experience
                </h2>
                <Button onClick={() => setIsAddModalOpen(true)} size="lg" className="shadow-sm bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed">
                    + Add Experience
                </Button>
            </div>
            {deleteSuccessMessage && (
                <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                    {deleteSuccessMessage}
                </div>
            )}

            {loading && (
                <Card>
                    <CardContent className="p-6">
                        <p className="text-muted-foreground">Loading work experiences...</p>
                    </CardContent>
                </Card>
            )}

            { }
            {!loading && sorted.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">No work experience added yet</p>
                        <Button className="bg-[#3bafba] hover:bg-[#34a0ab] disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setIsAddModalOpen(true)}>Add Your First Experience</Button>
                    </CardContent>
                </Card>
            )}

            { }
            {!loading && sorted.length > 0 && (
                <div className="space-y-4">
                    {sorted.map((exp) => (
                        <Card key={exp.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        { }
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-semibold text-slate-900">{exp.positionTitle}</h3>
                                            {exp.isCurrent && (
                                                <Badge className="bg-green-500 hover:bg-green-600 text-white">CURRENT</Badge>
                                            )}
                                        </div>

                                        {/* Company */}
                                        <div className="text-slate-800 font-medium">{exp.companyName}</div>

                                        {/* Dot-separated meta */}
                                        <div className="mt-1 flex flex-wrap items-center text-sm text-slate-600">
                                            <span>{dateRange(exp)}</span>
                                            {locationOf(exp) && (
                                                <>
                                                    <Dot className="h-4 w-4" />
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {locationOf(exp)}
                                                    </span>
                                                </>
                                            )}
                                            {exp.employmentType && (
                                                <>
                                                    <Dot className="h-4 w-4" />
                                                    <span className="px-2 py-[2px] rounded-full bg-slate-100 text-slate-700 text-xs">
                                                        {exp.employmentType}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {exp.description && (
                                            <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{exp.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => handleEdit(exp)} className="cursor-pointer">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={!canDelete}
                                                onClick={() => canDelete && handleDeleteClick(exp.id)}
                                                className={`cursor-pointer ${canDelete ? 'text-red-600 focus:text-red-600 focus:bg-red-50' : 'opacity-50'}`}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AddEmploymentForm
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setEditingExperience(null)
                }}
                onSuccess={handleFormSuccess}
                experience={editingExperience}
                userId={userId}
            />

            {/* Delete confirm dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this work experience entry. Deleted entries cannot be recovered.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
