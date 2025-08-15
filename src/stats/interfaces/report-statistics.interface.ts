export interface ReportStatistics {
  totalVisits: number;
  totalUsers: number;
  genderDistribution: { F: number; M: number; O: number };
  ageRangeDistribution: { infancia: number; juventud: number; adultez_joven: number; adultez_media: number; vejez: number };
  averageAge: number;
  visitsByDate: Array<{ date: string; count: number }>;
  topUsers: Array<{ userId: number; userName: string; visitCount: number }>;
}
