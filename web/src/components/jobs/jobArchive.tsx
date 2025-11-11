import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  AlertCircle,
  X,
  CheckCircle
} from 'lucide-react';

// Archive Button Component
export function ArchiveButton({ 
  jobId, 
  onArchive 
}: { 
  jobId: string; 
  onArchive: (jobId: string, reason?: string) => void;
}) {
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState('');

  const handleArchive = () => {
    onArchive(jobId, reason || undefined);
    setShowReasonDialog(false);
    setReason('');
  };

  if (showReasonDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Archive className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Archive Job
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Why are you archiving this job? (Optional)
                </p>
                <Input
                  placeholder="e.g., Position filled, No longer interested..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReasonDialog(false);
                      setReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleArchive}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Archive size={16} className="mr-2" />
                    Archive
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowReasonDialog(true)}
      className="flex items-center gap-2"
    >
      <Archive size={16} />
      Archive
    </Button>
  );
}

// Bulk Archive Button
export function BulkArchiveButton({
  selectedJobIds,
  onBulkArchive,
  onCancel
}: {
  selectedJobIds: string[];
  onBulkArchive: (jobIds: string[], reason?: string) => void;
  onCancel: () => void;
}) {
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState('');

  const handleArchive = () => {
    onBulkArchive(selectedJobIds, reason || undefined);
    setShowReasonDialog(false);
    setReason('');
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-blue-600" size={20} />
          <span className="font-medium text-blue-900">
            {selectedJobIds.length} job{selectedJobIds.length > 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => setShowReasonDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Archive size={16} className="mr-2" />
            Archive Selected
          </Button>
        </div>
      </div>

      {showReasonDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Archive className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Archive {selectedJobIds.length} Jobs
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Why are you archiving these jobs? (Optional)
                  </p>
                  <Input
                    placeholder="e.g., Cleaning up old applications..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mb-4"
                  />
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReasonDialog(false);
                        setReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleArchive}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Archive size={16} className="mr-2" />
                      Archive All
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Restore Button Component
export function RestoreButton({
  jobId,
  onRestore
}: {
  jobId: string;
  onRestore: (jobId: string) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onRestore(jobId)}
      className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
    >
      <ArchiveRestore size={16} />
      Restore
    </Button>
  );
}

// Permanent Delete Confirmation
export function PermanentDeleteConfirmation({
  jobId,
  jobTitle,
  onConfirm,
  onCancel
}: {
  jobId: string;
  jobTitle: string;
  onConfirm: (jobId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Permanently Delete Job?
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold">{jobTitle}</span>?
              </p>
              <p className="text-sm text-red-600 font-medium mb-6">
                This action cannot be undone. All data including contacts,
                notes, and history will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={() => onConfirm(jobId)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Archive Status Badge
export function ArchiveBadge({ reason, archivedAt }: { reason?: string; archivedAt?: string }) {
  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
        <Archive size={16} />
        <span>Archived</span>
      </div>
      {archivedAt && (
        <p className="text-xs text-gray-600">
          {new Date(archivedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
      {reason && (
        <p className="text-sm text-gray-700 mt-2 italic">"{reason}"</p>
      )}
    </div>
  );
}