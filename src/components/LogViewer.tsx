
import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogFile, fetchWorkflowLogs } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LogViewerProps {
  repoName: string;
  workflowId: string;
  workflowTitle: string;
}

export function LogViewer({ repoName, workflowId, workflowTitle }: LogViewerProps) {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
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
      
      // Set the first file as active if logs are available
      if (logs.length > 0) {
        setActiveFile(logs[0].name);
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
    const currentFile = logFiles.find(file => file.name === activeFile);
    if (!currentFile) return;
    
    // Create text content
    const content = currentFile.logs.map(log => log.message).join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}-${workflowTitle}-${activeFile.replace('/', '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs downloaded successfully');
  };

  const handleFileChange = (value: string) => {
    setActiveFile(value);
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

  // Find the active log file
  const currentLogFile = logFiles.find(file => file.name === activeFile);

  // Group logs by category
  const logsByCategory: Record<string, LogEntry[]> = {};
  if (currentLogFile) {
    currentLogFile.logs.forEach(log => {
      const category = log.category || 'General';
      if (!logsByCategory[category]) {
        logsByCategory[category] = [];
      }
      logsByCategory[category].push(log);
    });
  }

  // Extract categories and ensure "General" (SingleLogs) comes first
  const categories = Object.keys(logsByCategory).sort((a, b) => {
    if (a === 'General') return -1;
    if (b === 'General') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{workflowTitle}</h2>
        <Button onClick={downloadLogs} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
      
      <div className="mb-4 w-full max-w-xs">
        <Select value={activeFile} onValueChange={handleFileChange}>
          <SelectTrigger className="w-full bg-devbeacons-darker border-sidebar-border">
            <SelectValue placeholder="Select a file" />
          </SelectTrigger>
          <SelectContent className="bg-devbeacons-darker border-sidebar-border">
            {logFiles.map((file) => (
              <SelectItem key={file.name} value={file.name} className="text-xs">
                {file.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
        
      <div className="bg-devbeacons-darker border border-sidebar-border rounded-md p-4 overflow-auto h-[calc(100vh-240px)]">
        {currentLogFile && (
          <div className="text-sm font-mono">
            <Accordion type="single" collapsible className="w-full">
              {categories.map((category) => (
                <AccordionItem key={category} value={category} className="border-b border-sidebar-border">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline hover:bg-sidebar-border/20 px-2">
                    {category}
                  </AccordionTrigger>
                  <AccordionContent>
                    {logsByCategory[category].map((log, index) => (
                      <div 
                        key={index}
                        className={`log-line p-1 ${log.type ? `log-line-${log.type}` : ''}`}
                      >
                        {log.message}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
}
