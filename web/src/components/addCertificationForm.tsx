"use client";

import { useState } from "react";
import {
  createCertification,
  updateCertification,
  Certification,
} from "@/lib/certification.api";

type Props = {
  onSuccess?: () => void;
  editingId?: string | null;
  defaultValues?: Partial<Certification>;
  onCancel?: () => void;
};

export default function AddCertificationForm({
  onSuccess,
  editingId,
  defaultValues,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState({
    name: defaultValues?.name || "",
    issuingOrganization: defaultValues?.issuingOrganization || "",
    issueDate: defaultValues?.issueDate || "",
    expirationDate: defaultValues?.expirationDate || "",
    doesNotExpire: defaultValues?.doesNotExpire || false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.currentTarget;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setFormData((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Certification> = {
      name: formData.name,
      issuingOrganization: formData.issuingOrganization,
      issueDate: new Date(formData.issueDate).toISOString(), // ✅ convert to ISO
      doesNotExpire: formData.doesNotExpire,
    };

    if (!formData.doesNotExpire && formData.expirationDate) {
      payload.expirationDate = new Date(
        formData.expirationDate
      ).toISOString(); // ✅ convert to ISO
    } else {
      payload.expirationDate = undefined;
    }

    if (editingId) {
      await updateCertification(editingId, payload);
    } else {
      await createCertification(payload);
    }

    onSuccess?.();
    onCancel?.();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      issuingOrganization: "",
      issueDate: "",
      expirationDate: "",
      doesNotExpire: false,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Certification Name *"
          value={formData.name}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          name="issuingOrganization"
          placeholder="Issuing Organization *"
          value={formData.issuingOrganization}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="issueDate"
          value={formData.issueDate}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="expirationDate"
          value={formData.expirationDate}
          onChange={handleChange}
          disabled={formData.doesNotExpire}
          className="border p-2 rounded"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="doesNotExpire"
            checked={formData.doesNotExpire}
            onChange={handleChange}
          />
          Does not expire
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {editingId ? "Update Certification" : "Save Certification"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
