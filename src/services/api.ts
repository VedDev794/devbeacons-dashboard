
const API_BASE_URL = 'https://devbecons-node-backend-gwfbckg9fbatg9dz.canadacentral-01.azurewebsites.net';

export interface Repository {
  repoName: string;
}

export interface Workflow {
  id: string;
  display_title: string;
}

export interface WorkflowStats {
  success: number;
  failure: number;
  progress: number;
  cancel: number;
}

export interface LogEntry {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: string;
}

export interface LogFile {
  name: string;
  logs: LogEntry[];
}

// Fetch repositories for the authenticated user
export async function fetchRepositories(accessToken: string): Promise<Repository[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/repos/${accessToken}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const data = await response.json();
    return data.repoNames.map((name: string) => ({ repoName: name }));
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
}

// Fetch workflows for a specific repository
export async function fetchWorkflows(
  accessToken: string, 
  ownerName: string, 
  repoName: string
): Promise<{workflows: Workflow[], stats: WorkflowStats}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/repos/${accessToken}/${ownerName}/${repoName}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch workflows');
    }
    
    const data = await response.json();
    
    const workflows = data.storeLogs?.map((log: any) => ({
      id: log.id,
      display_title: log.display_title
    })) || [];
    
    const stats = {
      success: data.success || 0,
      failure: data.failure || 0,
      progress: data.Progress || 0,
      cancel: data.Cancel || 0
    };
    
    return { workflows, stats };
  } catch (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }
}

// Fetch logs for a specific workflow
export async function fetchWorkflowLogs(
  accessToken: string,
  ownerName: string,
  repoName: string,
  workflowId: string
): Promise<LogFile[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/repos/${accessToken}/${ownerName}/${repoName}/${workflowId}/getLogs`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch workflow logs');
    }
    
    const data = await response.json();
    const logFiles: LogFile[] = [];
    
    // Process the complex log structure
    if (data.cleanedLogs) {
      Object.keys(data.cleanedLogs).forEach(jobName => {
        const jobLogs = data.cleanedLogs[jobName];
        
        Object.keys(jobLogs).forEach(fileName => {
          const fileData = jobLogs[fileName];
          const entries: LogEntry[] = [];
          
          // Process all log categories (not just SingleLogs)
          Object.keys(fileData).forEach(category => {
            // Check if this is an array of logs
            if (Array.isArray(fileData[category])) {
              // Process each log message
              fileData[category].forEach((log: string) => {
                // Detect log type based on content
                let type: LogEntry['type'] = 'info';
                if (log.includes('success') || log.includes('completed')) {
                  type = 'success';
                } else if (log.includes('warning') || log.includes('waiting')) {
                  type = 'warning';
                } else if (log.includes('error') || log.includes('failed')) {
                  type = 'error';
                }
                
                entries.push({ 
                  message: log,
                  type,
                  category: category === 'SingleLogs' ? undefined : category
                });
              });
            }
          });
          
          if (entries.length > 0) {
            logFiles.push({
              name: `${jobName}/${fileName}`,
              logs: entries
            });
          }
        });
      });
    }
    
    return logFiles;
  } catch (error) {
    console.error('Error fetching workflow logs:', error);
    throw error;
  }
}

// GitHub authentication URL
export function getGitHubAuthUrl(): string {
  return `${API_BASE_URL}/auth/github`;
}
