import { useQuery } from '@tanstack/react-query';
import { apiService, CompanyInfo } from '@/services/api';

export const useCompanyInfo = () => {
  return useQuery<CompanyInfo>({
    queryKey: ['companyInfo'],
    queryFn: apiService.getCompanyInfo,
    staleTime: 30 * 60 * 1000, // 30 minutes - company info doesn't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  });
};