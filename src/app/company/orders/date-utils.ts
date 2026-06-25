// Helper to check if tour pickup is > 24 hours away
export function isMoreThan24HoursAway(tourDateStr: string, pickupTimeStr: string | null): boolean {
    try {
        const datePart = tourDateStr; // YYYY-MM-DD
        let timePart = '08:00:00';
        
        if (pickupTimeStr) {
            const timeClean = pickupTimeStr.trim().toUpperCase();
            const matches = timeClean.match(/(\d+):(\d+)\s*(AM|PM)/);
            if (matches) {
                let hours = parseInt(matches[1]);
                const minutes = parseInt(matches[2]);
                const ampm = matches[3];
                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                timePart = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            }
        }
        
        const pickupDate = new Date(`${datePart}T${timePart}`);
        const now = new Date();
        const diffMs = pickupDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours > 24;
    } catch {
        return false;
    }
}
