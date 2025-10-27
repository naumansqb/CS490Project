import { apiClient } from "./api";

export type Certification = {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  doesNotExpire?: boolean;
  certificationNumber?: string;
  fileUrl?: string;
  category?: string;
  verificationStatus?: "Pending" | "Verified" | "Expired";
};

export const getCertificationsByUserId = (userId: string) => {
  return apiClient.fetch<Certification[]>(`/certifications/user/${userId}`, {
    method: "GET",
  });
};

export const createCertification = (payload: FormData) => {
  return apiClient.fetch<Certification>(`/certifications`, {
    method: "POST",
    body: payload,
  });
};

export const updateCertification = (id: string, payload: FormData) => {
  return apiClient.fetch<Certification>(`/certifications/${id}`, {
    method: "PUT",
    body: payload,
  });
};

export const deleteCertification = (id: string) => {
  return apiClient.fetch(`/certifications/${id}`, {
    method: "DELETE",
  });
};
