export interface Certification {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  doesNotExpire?: boolean;
  certificationNumber?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = "http://localhost:5000/api/certifications";

export async function createCertification(data: Partial<Certification>): Promise<Certification> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create certification (${res.status})`);
  return res.json();
}

export async function updateCertification(id: string, data: Partial<Certification>): Promise<Certification> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update certification (${res.status})`);
  return res.json();
}

export async function getCertificationsByUserId(userId: string): Promise<Certification[]> {
  const res = await fetch(`${BASE_URL}/user/${userId}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch certifications (${res.status})`);
  return res.json();
}

export async function deleteCertification(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete certification (${res.status})`);
}

