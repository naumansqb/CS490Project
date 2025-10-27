'use client'

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { WorkExperience, createWorkExperience, updateWorkExperience } from '@/lib/workExperience.api';
interface AddEmploymentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    experience?: WorkExperience | null;
    userId: string;
}

const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Internship',
    'Freelance',
];

export default function AddEmploymentForm({
    isOpen,
    onClose,
    onSuccess,
    experience,
    userId,
}: AddEmploymentFormProps) {
    const isEditing = !!experience;

    const [formData, setFormData] = useState({
        companyName: '',
        positionTitle: '',
        employmentType: '',
        locationCity: '',
        locationState: '',
        isRemote: false,
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (experience) {
            setFormData({
                companyName: experience.companyName || '',
                positionTitle: experience.positionTitle || '',
                employmentType: experience.employmentType || '',
                locationCity: experience.locationCity || '',
                locationState: experience.locationState || '',
                isRemote: experience.isRemote || false,
                startDate: experience.startDate ? experience.startDate.split('T')[0] : '',
                endDate: experience.endDate ? experience.endDate.split('T')[0] : '',
                isCurrent: experience.isCurrent || false,
                description: experience.description || '',
            });
        } else {
            // Reset form when adding new
            setFormData({
                companyName: '',
                positionTitle: '',
                employmentType: '',
                locationCity: '',
                locationState: '',
                isRemote: false,
                startDate: '',
                endDate: '',
                isCurrent: false,
                description: '',
            });
        }
        setErrors({});
        setShowSuccess(false);
        setShowError(false);
    }, [experience, isOpen]);

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
        setShowSuccess(false);
        setShowError(false);
    };

    const handleCurrentChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            isCurrent: checked,
            endDate: checked ? '' : prev.endDate,
        }));
        if (errors.endDate) {
            setErrors((prev) => ({ ...prev, endDate: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.positionTitle.trim()) {
            newErrors.positionTitle = 'Job title is required';
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.isCurrent && !formData.endDate) {
            newErrors.endDate = 'End date is required (or check "Current position")';
        }

        if (formData.startDate && formData.endDate && !formData.isCurrent) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end < start) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Description must be 1000 characters or less';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            setShowError(true);
            return;
        }

        setIsSubmitting(true);
        setShowError(false);

        try {
            const submitData = {
                companyName: formData.companyName,
                positionTitle: formData.positionTitle,
                employmentType: formData.employmentType || undefined,
                locationCity: formData.locationCity || undefined,
                locationState: formData.locationState || undefined,
                isRemote: formData.isRemote,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : '',
                endDate: formData.isCurrent ? null : (formData.endDate ? new Date(formData.endDate).toISOString() : null),
                isCurrent: formData.isCurrent,
                description: formData.description || undefined,
            };

            if (isEditing && experience) {
                await updateWorkExperience(experience.id, submitData);
            } else {
                await createWorkExperience(submitData);
            }

            setShowSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 500);
        } catch (error) {
            console.error('Failed to save work experience:', error);
            setShowError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Work Experience' : 'Add Work Experience'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your work experience details'
                            : 'Add a new position to your work history'}
                    </DialogDescription>
                </DialogHeader>

                {showSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Work experience saved successfully!
                        </AlertDescription>
                    </Alert>
                )}

                {showError && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {Object.keys(errors).length > 0
                                ? 'Please fix the errors below'
                                : 'Failed to save work experience. Please try again.'}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <FieldGroup className="space-y-4">
                        {/* Job Title */}
                        <Field>
                            <FieldLabel htmlFor="positionTitle">Job Title *</FieldLabel>
                            <Input
                                id="positionTitle"
                                type="text"
                                placeholder="Software Engineer"
                                value={formData.positionTitle}
                                onChange={(e) => handleChange('positionTitle', e.target.value)}
                                className={errors.positionTitle ? 'border-red-500' : ''}
                            />
                            {errors.positionTitle && (
                                <FieldDescription className="text-red-600">
                                    {errors.positionTitle}
                                </FieldDescription>
                            )}
                        </Field>

                        {/* Company Name */}
                        <Field>
                            <FieldLabel htmlFor="companyName">Company Name *</FieldLabel>
                            <Input
                                id="companyName"
                                type="text"
                                placeholder="Google"
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                className={errors.companyName ? 'border-red-500' : ''}
                            />
                            {errors.companyName && (
                                <FieldDescription className="text-red-600">
                                    {errors.companyName}
                                </FieldDescription>
                            )}
                        </Field>

                        {/* Employment Type */}
                        <Field>
                            <FieldLabel htmlFor="employmentType">Employment Type</FieldLabel>
                            <Select
                                value={formData.employmentType}
                                onValueChange={(value) => handleChange('employmentType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employmentTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        {/* Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="locationCity">City</FieldLabel>
                                <Input
                                    id="locationCity"
                                    type="text"
                                    placeholder="San Francisco"
                                    value={formData.locationCity}
                                    onChange={(e) => handleChange('locationCity', e.target.value)}
                                    disabled={formData.isRemote}
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="locationState">State</FieldLabel>
                                <Input
                                    id="locationState"
                                    type="text"
                                    placeholder="CA"
                                    value={formData.locationState}
                                    onChange={(e) => handleChange('locationState', e.target.value)}
                                    disabled={formData.isRemote}
                                />
                            </Field>
                        </div>

                        {/* Remote Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isRemote"
                                checked={formData.isRemote}
                                onCheckedChange={(checked) =>
                                    handleChange('isRemote', checked === true)
                                }
                            />
                            <label
                                htmlFor="isRemote"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                This is a remote position
                            </label>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="startDate">Start Date *</FieldLabel>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                    className={errors.startDate ? 'border-red-500' : ''}
                                />
                                {errors.startDate && (
                                    <FieldDescription className="text-red-600">
                                        {errors.startDate}
                                    </FieldDescription>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="endDate">End Date</FieldLabel>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                    disabled={formData.isCurrent}
                                    className={errors.endDate ? 'border-red-500' : ''}
                                />
                                {errors.endDate && (
                                    <FieldDescription className="text-red-600">
                                        {errors.endDate}
                                    </FieldDescription>
                                )}
                            </Field>
                        </div>

                        {/* Current Position Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isCurrent"
                                checked={formData.isCurrent}
                                onCheckedChange={handleCurrentChange}
                            />
                            <label
                                htmlFor="isCurrent"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I currently work here
                            </label>
                        </div>

                        {/* Description */}
                        <Field>
                            <FieldLabel htmlFor="description">Job Description</FieldLabel>
                            <Textarea
                                id="description"
                                placeholder="Describe your responsibilities, achievements, and key projects..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className={`min-h-32 ${errors.description ? 'border-red-500' : ''}`}
                                maxLength={1000}
                            />
                            <FieldDescription className="flex justify-between">
                                <span>Share details about your role and accomplishments</span>
                                <span
                                    className={
                                        formData.description.length > 1000
                                            ? 'text-red-600'
                                            : 'text-slate-500'
                                    }
                                >
                                    {formData.description.length}/1000
                                </span>
                            </FieldDescription>
                            {errors.description && (
                                <FieldDescription className="text-red-600">
                                    {errors.description}
                                </FieldDescription>
                            )}
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Experience'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}