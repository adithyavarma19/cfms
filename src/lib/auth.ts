const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async login(loginId: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async studentLogin(registrationNumber: string, dob: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ registrationNumber, dob }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async signOut() {
    this.setToken(null);
  }

  async getStudents() {
    return this.request<any[]>('/students');
  }

  async getStudentByUserId(userId: string) {
    return this.request<any>(`/students/by-user/${userId}`);
  }

  async getFaculty() {
    return this.request<any[]>('/faculty');
  }

  async getCourses() {
    return this.request<any[]>('/courses');
  }

  async getForms() {
    return this.request<any[]>('/forms');
  }

  async getStudentForms() {
    return this.request<any[]>('/forms/student');
  }

  async getForm(id: string) {
    return this.request<any>(`/forms/${id}`);
  }

  async createForm(form: any) {
    return this.request<any>('/forms', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }

  async updateForm(id: string, form: any) {
    return this.request<any>(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
  }

  async deleteForm(id: string) {
    return this.request<any>(`/forms/${id}`, {
      method: 'DELETE',
    });
  }

  async getResponses() {
    return this.request<any[]>('/responses');
  }

  async getFormResponses(formId: string) {
    return this.request<any[]>(`/responses/form/${formId}`);
  }

  async submitResponse(response: any) {
    return this.request<any>('/responses', {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  async checkResponse(formId: string) {
    return this.request<{ submitted: boolean }>(`/responses/check/${formId}`);
  }

  async getMyTargets() {
    return this.request<any[]>('/targets/my-targets');
  }

  async getTargets() {
    return this.request<any[]>('/targets');
  }

  async getFormTargets(formId: string) {
    return this.request<any[]>(`/targets/form/${formId}`);
  }

  async createStudent(student: any) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id: string, student: any) {
    return this.request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  }

  async deleteStudent(id: string) {
    return this.request<any>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  async createFaculty(faculty: any) {
    return this.request<any>('/faculty', {
      method: 'POST',
      body: JSON.stringify(faculty),
    });
  }

  async updateFaculty(id: string, faculty: any) {
    return this.request<any>(`/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(faculty),
    });
  }

  async deleteFaculty(id: string) {
    return this.request<any>(`/faculty/${id}`, {
      method: 'DELETE',
    });
  }

  async createCourse(course: any) {
    return this.request<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    });
  }

  async updateCourse(id: string, course: any) {
    return this.request<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(course),
    });
  }

  async deleteCourse(id: string) {
    return this.request<any>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

// Auth functions using local API
export async function signIn(loginId: string, password: string) {
  try {
    const data = await api.login(loginId, password);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function studentLogin(registrationNumber: string, dob: string) {
  try {
    const data = await api.studentLogin(registrationNumber, dob);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  await api.signOut();
}

export async function getUserRole(userId: string): Promise<"admin" | "student" | null> {
  try {
    const user = await api.getMe();
    return user?.role || null;
  } catch {
    return null;
  }
}

export async function getStudentByUserId(userId: string) {
  try {
    return await api.getStudentByUserId(userId);
  } catch {
    return null;
  }
}

export async function changePassword(newPassword: string) {
  throw new Error("Password change not implemented in local backend");
}
