import api from '@/api/client';
import { Bug, BugStatus, BugStats, BugComment } from '../types';

export const bugTrackerApi = {
  getBugs: async (params?: { status?: BugStatus; priority?: string; module?: string }) => {
    const response = await api.get<Bug[]>('/v1/bugs', { params });
    return response.data;
  },

  createBug: async (data: Partial<Bug>) => {
    const response = await api.post<Bug>('/v1/bugs', data);
    return response.data;
  },

  getBugById: async (id: string) => {
    const response = await api.get<Bug>(`/v1/bugs/${id}`);
    return response.data;
  },

  updateBugStatus: async (id: string, status: BugStatus) => {
    const response = await api.patch<{ status: BugStatus }>(`/v1/bugs/${id}/status`, { status });
    return response.data;
  },

  assignBug: async (id: string, userId: string) => {
    const response = await api.patch<Bug>(`/v1/bugs/${id}/assign`, { userId });
    return response.data;
  },

  addComment: async (id: string, content: string, isInternal: boolean = false) => {
    const response = await api.post<BugComment>(`/v1/bugs/${id}/comments`, { content, isInternal });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<BugStats>('/v1/bugs/stats');
    return response.data;
  },

  getComments: async (id: string) => {
    const response = await api.get<BugComment[]>(`/v1/bugs/${id}/comments`);
    return response.data;
  },

  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/v1/bugs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
