'use client'

import { useEffect, useState } from "react"
import DeleteAccount from "./deleteAccount"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import { getCurrentUser } from "@/lib/firebase/firebase-auth-service"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useAuth } from '@/contexts/AuthContext';


const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Marketing",
  "Sales",
  "Engineering",
  "Design",
  "Human Resources",
  "Legal",
  "Consulting",
  "Other"
]

const experienceLevels = [
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Executive"
]

export default function ProfileForm() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const { user: firebaseUser } = useAuth();

  const updateUserProfile = async (userId: string, updateData: any) => {
    try {
      console.log('User ID for update:', userId);
      const data = await apiClient.fetch(`/user-profiles/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    headline: "",
    bio: "",
    industry: "",
    experienceLevel: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
          const data = await apiClient.fetch(`/users/me`) as any;
          setUser(data);
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: firebaseUser?.email || "",
            phone: "",
            city: data.locationCity || "",
            state: data.locationState || "",
            headline: data.headline || "",
            bio: data.bio || "",
            industry: "",
            experienceLevel: data.experience_level || ""
          });
          console.log('Fetched profile data:', data);
      } catch (error) {
          console.error('Failed to load profile:', error);
      } finally {
      }
    };
    
    fetchProfile();
  }, []);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const bioLength = formData.bio.length
  const bioLimit = 500

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
    setShowSuccess(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required"
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required"
    }

    if (!formData.headline.trim()) {
      newErrors.headline = "Professional headline is required"
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required"
    } else if (formData.bio.length > bioLimit) {
      newErrors.bio = `Bio must be ${bioLimit} characters or less`
    }

    if (!formData.industry) {
      newErrors.industry = "Industry selection is required"
    }

    if (!formData.experienceLevel) {
      newErrors.experienceLevel = "Experience level is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        const updateForm = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          locationCity: formData.city,
          locationState: formData.state,
          headline: formData.headline,
          bio: formData.bio,
          careerLevel: formData.experienceLevel,
        }
        const updatedData = await updateUserProfile(firebaseUser?.uid!, updateForm);
    
    console.log('Profile updated:', updatedData);
    // Update your state or show success message
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      router.push(`/profile/${firebaseUser?.uid}`)
    }
    else {
      setShowSuccess(false)
      console.log("Form has errors:", errors)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      headline: "",
      bio: "",
      industry: "",
      experienceLevel: ""
    })
    setErrors({})
    setShowSuccess(false)
    router.push(`/profile/${firebaseUser?.uid}`)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Edit Your Professional Profile</h1>
            <p className="text-slate-600 mt-2">Tell us about yourself</p>
          </div>

          {showSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Profile saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>

              <Field>
                <FieldLabel htmlFor="fullName">First Name *</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={"John Doe"}
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <FieldDescription className="text-red-600">
                    {errors.fullName}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="fullName">Last Name *</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={"John Doe"}
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <FieldDescription className="text-red-600">
                    {errors.fullName}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <FieldDescription className="text-red-600">
                    {errors.phone}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Email *</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.email && (
                  <FieldDescription className="text-red-600">
                    {errors.email}
                  </FieldDescription>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="city">City *</FieldLabel>
                  <Input
                    id="city"
                    type="text"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && (
                    <FieldDescription className="text-red-600">
                      {errors.city}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="state">State *</FieldLabel>
                  <Input
                    id="state"
                    type="text"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && (
                    <FieldDescription className="text-red-600">
                      {errors.state}
                    </FieldDescription>
                  )}
                </Field>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-slate-900">Professional Details</h2>

              <Field>
                <FieldLabel htmlFor="headline">Professional Headline *</FieldLabel>
                <Input
                  id="headline"
                  type="text"
                  placeholder="Senior Software Engineer | Full Stack Developer"
                  value={formData.headline}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  className={errors.headline ? "border-red-500" : ""}
                />
                <FieldDescription>
                  A brief title that describes your professional identity
                </FieldDescription>
                {errors.headline && (
                  <FieldDescription className="text-red-600">
                    {errors.headline}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="bio">Professional Bio *</FieldLabel>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your professional background, skills, and what you're passionate about..."
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className={`min-h-32 ${errors.bio ? "border-red-500" : ""}`}
                  maxLength={bioLimit}
                />
                <FieldDescription className="flex justify-between">
                  <span>Share your story and what makes you unique</span>
                  <span className={bioLength > bioLimit ? "text-red-600" : "text-slate-500"}>
                    {bioLength}/{bioLimit}
                  </span>
                </FieldDescription>
                {errors.bio && (
                  <FieldDescription className="text-red-600">
                    {errors.bio}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="industry">Industry *</FieldLabel>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleChange("industry", value)}
                >
                  <SelectTrigger className={errors.industry ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <FieldDescription className="text-red-600">
                    {errors.industry}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="experienceLevel">Experience Level *</FieldLabel>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) => handleChange("experienceLevel", value)}
                >
                  <SelectTrigger className={errors.experienceLevel ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.experienceLevel && (
                  <FieldDescription className="text-red-600">
                    {errors.experienceLevel}
                  </FieldDescription>
                )}
              </Field>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button type="submit" className="flex-1" onClick={handleSubmit}>
                Save Profile
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </div>
        {/* Danger Zone - Account Deletion */}
        <div className="mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Delete Account Modal */}
        <DeleteAccount
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)} />
      </div>
    </div>
  )
}
