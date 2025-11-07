// src/utils/shared.ts
export const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };
  
  export const formatTimeDisplay = (startTime?: string, endTime?: string) => {
    if (!startTime && !endTime) return '';
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    if (startTime) return `${startTime}-tól`;
    return `${endTime}-ig`;
  };