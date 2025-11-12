// =============================================
// API Module for Attendance Analytics
// =============================================

const API = {
  // Base URL - replace with your actual API endpoint
  baseURL: '/api',

  // Fetch class-level attendance data
  async getClassAttendance(meetingType = 'all') {
    try {
      // Mock data for now - replace with actual API call
      // const response = await fetch(`${this.baseURL}/class/attendance?type=${meetingType}`);
      // return await response.json();
      
      return this.mockClassData(meetingType);
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      throw error;
    }
  },

  // Fetch group-level attendance data
  async getGroupAttendance(groupId) {
    try {
      // const response = await fetch(`${this.baseURL}/group/${groupId}/attendance`);
      // return await response.json();
      
      return this.mockGroupData(groupId);
    } catch (error) {
      console.error('Error fetching group attendance:', error);
      throw error;
    }
  },

  // Fetch user-level attendance data
  async getUserAttendance(userId) {
    try {
      // const response = await fetch(`${this.baseURL}/user/${userId}/attendance`);
      // return await response.json();
      
      return this.mockUserData(userId);
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      throw error;
    }
  },

  // Fetch meeting list
  async getMeetingList(filters = {}) {
    try {
      // const queryParams = new URLSearchParams(filters);
      // const response = await fetch(`${this.baseURL}/meetings?${queryParams}`);
      // return await response.json();
      
      return this.mockMeetingList(filters);
    } catch (error) {
      console.error('Error fetching meeting list:', error);
      throw error;
    }
  },

  // Mock data generators (remove these when connecting to real API)
  mockClassData(meetingType) {
    const dates = this.generateDates(12);
    
    // Generate data for each meeting type
    const lectureData = dates.map(date => ({
      date,
      attendanceRate: 75 + Math.random() * 20
    }));
    
    const officeHoursData = dates.map(date => ({
      date,
      attendanceRate: 60 + Math.random() * 25
    }));
    
    const taCheckinData = dates.map(date => ({
      date,
      attendanceRate: 80 + Math.random() * 15
    }));

    const students = this.generateMockStudents(45);
    
    return {
      overallRate: 82.5,
      totalStudents: 45,
      totalMeetings: 28,
      studentsAtRisk: students.filter(s => s.attendanceRate < 75),
      trendData: {
        dates: dates,
        lecture: lectureData.map(d => d.attendanceRate),
        officeHours: officeHoursData.map(d => d.attendanceRate),
        taCheckin: taCheckinData.map(d => d.attendanceRate)
      },
      students
    };
  },

  mockGroupData(groupId) {
    const dates = this.generateDates(10);
    const data = dates.map(date => ({
      date,
      attendanceRate: 75 + Math.random() * 20
    }));

    return {
      groupName: 'Team Alpha',
      teamRate: 87.3,
      memberCount: 5,
      meetingCount: 15,
      avgResponseTime: 2.5,
      trendData: data,
      members: [
        { id: 1, name: 'Alice Johnson', attendanceRate: 92 },
        { id: 2, name: 'Bob Smith', attendanceRate: 85 },
        { id: 3, name: 'Charlie Brown', attendanceRate: 88 },
        { id: 4, name: 'Diana Prince', attendanceRate: 90 },
        { id: 5, name: 'Eve Wilson', attendanceRate: 82 }
      ]
    };
  },

  mockUserData(userId) {
    return {
      userName: 'John Doe',
      overall: 85.5,
      lecture: 88.2,
      officeHours: 75.0,
      teamMeeting: 92.3,
      meetingTypes: [
        { type: 'Lecture', rate: 88.2, attended: 15, total: 17 },
        { type: 'Office Hours', rate: 75.0, attended: 6, total: 8 },
        { type: 'Team Meeting', rate: 92.3, attended: 12, total: 13 }
      ]
    };
  },

  mockMeetingList(filters = {}) {
    const meetings = [
      {
        id: 1,
        type: 'lecture',
        typeName: 'Lecture',
        title: 'Introduction to Data Structures',
        date: '2025-11-10',
        time: '10:00 AM',
        status: 'attended',
        location: 'Room 301',
        duration: '90 min'
      },
      {
        id: 2,
        type: 'lecture',
        typeName: 'Lecture',
        title: 'Advanced Algorithms',
        date: '2025-11-08',
        time: '10:00 AM',
        status: 'attended',
        location: 'Room 301',
        duration: '90 min'
      },
      {
        id: 3,
        type: 'office-hours',
        typeName: 'Office Hours',
        title: 'Prof. Smith Office Hours',
        date: '2025-11-07',
        time: '2:00 PM',
        status: 'attended',
        location: 'Office 205',
        duration: '30 min'
      },
      {
        id: 4,
        type: 'team-meeting',
        typeName: 'Team Meeting',
        title: 'Project Sprint Planning',
        date: '2025-11-06',
        time: '4:00 PM',
        status: 'attended',
        location: 'Online',
        duration: '60 min'
      },
      {
        id: 5,
        type: 'lecture',
        typeName: 'Lecture',
        title: 'Database Design Principles',
        date: '2025-11-05',
        time: '10:00 AM',
        status: 'missed',
        location: 'Room 301',
        duration: '90 min'
      },
      {
        id: 6,
        type: 'office-hours',
        typeName: 'Office Hours',
        title: 'TA Check-in Session',
        date: '2025-11-04',
        time: '3:00 PM',
        status: 'missed',
        location: 'Office 210',
        duration: '30 min'
      },
      {
        id: 7,
        type: 'team-meeting',
        typeName: 'Team Meeting',
        title: 'Weekly Standup',
        date: '2025-11-03',
        time: '5:00 PM',
        status: 'attended',
        location: 'Online',
        duration: '45 min'
      },
      {
        id: 8,
        type: 'lecture',
        typeName: 'Lecture',
        title: 'Software Engineering Best Practices',
        date: '2025-11-01',
        time: '10:00 AM',
        status: 'attended',
        location: 'Room 301',
        duration: '90 min'
      }
    ];

    // Apply filters
    let filtered = meetings;
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(search) ||
        m.date.includes(search) ||
        m.typeName.toLowerCase().includes(search)
      );
    }

    return {
      meetings: filtered,
      summary: {
        total: meetings.length,
        attended: meetings.filter(m => m.status === 'attended').length,
        missed: meetings.filter(m => m.status === 'missed').length,
        rate: Math.round((meetings.filter(m => m.status === 'attended').length / meetings.length) * 100)
      }
    };
  },

  // Helper function to generate dates
  generateDates(count) {
    const dates = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7)); // Weekly intervals
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  },

  // Helper function to generate mock students
  generateMockStudents(count) {
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const students = [];
    for (let i = 0; i < count; i++) {
      students.push({
        id: i + 1,
        name: `${firstNames[i % 10]} ${lastNames[Math.floor(i / 10) % 10]}`,
        attendanceRate: Math.round(50 + Math.random() * 50)
      });
    }
    return students;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}