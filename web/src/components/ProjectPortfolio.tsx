"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsByUserId, SpecialProject } from "@/lib/specialProjects.api";
import { Search } from "lucide-react";

export default function ProjectPortfolio() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SpecialProject[]>([]);
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sortOption, setSortOption] = useState("date-desc");
  const [selectedProject, setSelectedProject] = useState<SpecialProject | null>(null);

  useEffect(() => {
    if (user?.uid) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user?.uid) return;
    const data = await getProjectsByUserId(user.uid);
    setProjects(data);
  };

  const filtered = useMemo(() => {
    let filtered = [...projects];

    if (search.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.projectName.toLowerCase().includes(search.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (techFilter) {
      filtered = filtered.filter(
        (p) =>
          p.technologies &&
        p.technologies.some((t: string) =>
            t.toLowerCase().includes(techFilter.toLowerCase())
          )
      );
    }

    if (industryFilter) {
      filtered = filtered.filter(
        (p) => p.industry?.toLowerCase() === industryFilter.toLowerCase()
      );
    }

    switch (sortOption) {
      case "date-asc":
        filtered.sort(
          (a, b) =>
            new Date(a.startDate || "").getTime() -
            new Date(b.startDate || "").getTime()
        );
        break;
      case "date-desc":
        filtered.sort(
          (a, b) =>
            new Date(b.startDate || "").getTime() -
            new Date(a.startDate || "").getTime()
        );
        break;
      case "name":
        filtered.sort((a, b) => a.projectName.localeCompare(b.projectName));
        break;
    }

    return filtered;
  }, [projects, search, techFilter, industryFilter, sortOption]);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:w-1/3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Filter by tech"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Filter by industry"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="name">A-Z</option>
          </select>
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
            onClick={() => setSelectedProject(proj)}
          >
            {proj.mediaUrl ? (
              <img
                src={proj.mediaUrl}
                alt={proj.projectName}
                className="h-40 w-full object-cover rounded mb-3"
              />
            ) : (
              <div className="h-40 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}
            <h3 className="text-lg font-semibold mb-1">{proj.projectName}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {proj.description}
            </p>
            <div className="text-xs text-gray-500 mb-2">
              {proj.startDate &&
                new Date(proj.startDate).toLocaleDateString()}{" "}
              {proj.endDate && `– ${new Date(proj.endDate).toLocaleDateString()}`}
            </div>
            <div className="flex flex-wrap gap-1 text-xs">
            {proj.technologies?.slice(0, 3).map((tech: string) => (
  <span key={tech} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
    {tech}
  </span>
))}
              {proj.technologies && proj.technologies.length > 3 && (
                <span className="text-gray-400">+{proj.technologies.length - 3}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white max-w-2xl w-full rounded-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
              onClick={() => setSelectedProject(null)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {selectedProject.projectName}
            </h2>
            {selectedProject.mediaUrl && (
              <img
                src={selectedProject.mediaUrl}
                alt={selectedProject.projectName}
                className="mb-4 rounded-lg w-full"
              />
            )}
            <p className="mb-3 text-gray-700">{selectedProject.description}</p>

            {selectedProject.projectUrl && (
              <a
                href={selectedProject.projectUrl}
                target="_blank"
                className="text-blue-600 underline text-sm mb-3 block"
              >
                View Project
              </a>
            )}

            {selectedProject.repositoryUrl && (
              <a
                href={selectedProject.repositoryUrl}
                target="_blank"
                className="text-blue-600 underline text-sm mb-3 block"
              >
                Repository
              </a>
            )}

            <p className="text-xs text-gray-500">
              {selectedProject.technologies?.join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
