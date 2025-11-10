'use client';

import React, { useState, useMemo } from 'react';
import {
    GripVertical,
    Eye,
    EyeOff,
    FileText,
} from 'lucide-react';

export interface ResumeSection {
    id: string;
    name: string;
    label: string;
    enabled: boolean;
    order: number;
    required?: boolean;
}

interface ResumeSectionCustomizerProps {
    sections: ResumeSection[];
    onSectionsChange: (sections: ResumeSection[]) => void;
    className?: string;
}

export default function ResumeSectionCustomizer({
    sections,
    onSectionsChange,
    className = '',
}: ResumeSectionCustomizerProps) {
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Sort sections by order
    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => a.order - b.order);
    }, [sections]);


    // Toggle section visibility
    const toggleSection = (sectionId: string) => {
        const updatedSections = sections.map((s) =>
            s.id === sectionId && !s.required ? { ...s, enabled: !s.enabled } : s
        );
        onSectionsChange(updatedSections);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, sectionId: string) => {
        setDraggingId(sectionId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggingId || draggingId === targetId) {
            setDraggingId(null);
            return;
        }

        const draggedIndex = sections.findIndex((s) => s.id === draggingId);
        const targetIndex = sections.findIndex((s) => s.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggingId(null);
            return;
        }

        // Reorder sections
        const newSections = [...sections];
        const [removed] = newSections.splice(draggedIndex, 1);
        newSections.splice(targetIndex, 0, removed);

        // Update order values
        const reorderedSections = newSections.map((section, index) => ({
            ...section,
            order: index + 1,
        }));

        onSectionsChange(reorderedSections);
        setDraggingId(null);
    };


    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-semibold text-gray-900">Section Customization</h3>
                </div>
            </div>

            {/* Sections List */}
            <div className="p-4">
                <div className="text-xs text-gray-600 mb-3 flex items-center gap-2">
                    <span>Drag to reorder • Toggle to show/hide</span>
                </div>
                <div className="space-y-2">
                    {sortedSections.map((section) => {
                        const isDragging = draggingId === section.id;

                        return (
                            <div
                                key={section.id}
                                draggable={!section.required}
                                onDragStart={(e) => handleDragStart(e, section.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, section.id)}
                                className={`
                                    group relative flex items-center gap-3 p-3 rounded-lg border transition-all
                                    ${isDragging ? 'opacity-50 border-cyan-400 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}
                                    ${section.enabled ? 'bg-white' : 'bg-gray-50'}
                                    ${!section.required && 'cursor-move'}
                                `}
                            >
                                {/* Drag Handle */}
                                {!section.required && (
                                    <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                                )}

                                {/* Section Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium text-sm ${section.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {section.label}
                                        </span>
                                        {section.required && (
                                            <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium">
                                                Required
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Toggle Visibility */}
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        disabled={section.required}
                                        className={`p-2 rounded-md transition-all ${section.required
                                                ? 'opacity-50 cursor-not-allowed'
                                                : section.enabled
                                                    ? 'hover:bg-gray-100 text-gray-700'
                                                    : 'hover:bg-gray-200 text-gray-500'
                                            }`}
                                        title={section.enabled ? 'Hide section' : 'Show section'}
                                    >
                                        {section.enabled ? (
                                            <Eye className="w-4 h-4" />
                                        ) : (
                                            <EyeOff className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Info */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="text-xs text-gray-600 flex items-center gap-4">
                    <span>
                        <span className="font-medium">{sortedSections.filter((s) => s.enabled).length}</span> of{' '}
                        {sortedSections.length} sections visible
                    </span>
                </div>
            </div>
        </div>
    );
}

