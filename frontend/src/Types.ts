// Types.ts
export interface ParsedResume {
    skills: {
      skills?: string[];
    };
    experience: {
      title: string;
      company: string;
      duration: string;
      achievements: string[];
    }[];
    projects: {
      title: string;
      description: string;
      link: string;
    }[];
  }
  
  export interface InterviewMessage {
    type: 'interviewer' | 'candidate';
    content: string;
    feedback?: string;
    score?: number;
  }
  
  export type InterviewStatus = 'not_started' | 'in_progress' | 'completed';