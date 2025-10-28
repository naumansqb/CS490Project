"use client";

import { useEffect, useState } from "react";
import {
  Certification,
  getCertificationsByUserId,
  deleteCertification,
} from "@/lib/certification.api";
import { useAuth } from "@/contexts/AuthContext";
import AddCertificationForm from "@/components/addCertificationForm";

export default function CertificationList() {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Certification>>();

  useEffect(() => {
    if (user?.uid) loadCertifications();
  }, [user]);

  const loadCertifications = async () => {
    if (!user?.uid) return;
    const data = await getCertificationsByUserId(user.uid);
    const sorted = [...data].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    setCertifications(sorted);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this certification?")) {
      await deleteCertification(id);
      loadCertifications();
    }
  };

  const isExpired = (cert: Certification) => {
    if (cert.doesNotExpire) return false;
    if (!cert.expirationDate) return false;
    return new Date(cert.expirationDate) < new Date();
  };

  const isExpiringSoon = (cert: Certification) => {
    if (cert.doesNotExpire || !cert.expirationDate) return false;
    const expiration = new Date(cert.expirationDate).getTime();
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    return expiration - now < oneMonth && expiration > now;
  };

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-2xl font-bold">Certifications</h2>

      <AddCertificationForm onSuccess={loadCertifications} />

      <ul className="space-y-4">
        {certifications.map((cert) => (
          <li
            key={cert.id}
            className={`border p-4 rounded flex justify-between items-start ${
              isExpired(cert) ? "border-red-500 bg-red-50" :
              isExpiringSoon(cert) ? "border-yellow-400 bg-yellow-50" :
              "border-gray-200 bg-white"
            }`}
          >
            <div>
              <h3 className="font-semibold text-lg">
                {cert.name} —{" "}
                <span className="text-sm text-gray-600">
                  {cert.issuingOrganization}
                </span>
              </h3>
              <p className="text-sm text-gray-600">
                Issued {new Date(cert.issueDate).toLocaleDateString()}
                {cert.doesNotExpire ? (
                  <span className="ml-2 text-green-600">(Does not expire)</span>
                ) : cert.expirationDate ? (
                  <>
                    {" "}– Expires {new Date(cert.expirationDate).toLocaleDateString()}
                  </>
                ) : null}
              </p>

              <div className="mt-2">
                {isExpired(cert) ? (
                  <span className="text-xs text-red-600 font-semibold">Expired</span>
                ) : isExpiringSoon(cert) ? (
                  <span className="text-xs text-yellow-600 font-semibold">Expiring soon</span>
                ) : (
                  <span className="text-xs text-green-600 font-semibold">Active</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(cert.id!);
                  setEditingValues(cert);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cert.id!)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editingId && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Edit Certification</h3>
          <AddCertificationForm
            editingId={editingId}
            defaultValues={editingValues}
            onCancel={() => setEditingId(null)}
            onSuccess={() => {
              setEditingId(null);
              loadCertifications();
            }}
          />
        </div>
      )}
    </div>
  );
}

