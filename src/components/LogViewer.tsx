
import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { LogFile, fetchWorkflowLogs } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface LogViewerProps {
  repoName: string;
  workflowId: string;
  workflowTitle: string;
}

export function LogViewer({ repoName, workflowId, workflowTitle }: LogViewerProps) {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { accessToken, ownerName } = useAuth();

  useEffect(() => {
    if (workflowId) {
      loadLogs();
    }
  }, [workflowId, repoName]);

  const loadLogs = async () => {
    if (!accessToken || !ownerName || !repoName || !workflowId) return;
    
    try {
      setLoading(true);
      const logs = await fetchWorkflowLogs(accessToken, ownerName, repoName, workflowId);
      setLogFiles(logs);
      
      // Set the first tab as active if logs are available
      if (logs.length > 0) {
        setActiveTab(logs[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load workflow logs');
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = () => {
    if (logFiles.length === 0) return;
    
    // Find the active log file
    const activeFile = logFiles.find(file => file.name === activeTab);
    if (!activeFile) return;
    
    // Create text content
    const content = activeFile.logs.map(log => log.message).join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}-${workflowTitle}-${activeTab.replace('/', '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-7 w-96 mb-4" />
        <div className="space-y-2">
          {Array(15).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (logFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No logs available</h3>
        <p className="text-muted-foreground mb-4">There are no logs available for this workflow.</p>
        <Button onClick={loadLogs} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{workflowTitle}</h2>
        <Button onClick={downloadLogs} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-devbeacons-darker border border-sidebar-border">
          {logFiles.map((file) => (
            <TabsTrigger key={file.name} value={file.name} className="text-xs">
              {file.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {logFiles.map((file) => (
          <TabsContent key={file.name} value={file.name} className="flex-1 mt-4">
            <div className="bg-devbeacons-darker border border-sidebar-border rounded-md p-4 overflow-auto h-[calc(100vh-240px)]">
              <pre className="text-sm font-mono">
                {file.logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`log-line ${log.type ? `log-line-${log.type}` : ''}`}
                  >
                    {log.message}
                  </div>
                ))}
              </pre>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
