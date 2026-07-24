// Helper to calculate hours remaining until tour pickup time
export const PICKUP_TIME_OPTIONS = Array.from({ length: 33 }).map((_, i) => {
    const hour24 = 5 + Math.floor(i / 2);
    const min = i % 2 === 0 ? '00' : '30';
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    return `${hour12}:${min} ${ampm}`;
});

export function getHoursUntilPickup(tourDateStr: string, pickupTimeStr: string | null): number {
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
        return diffMs / (1000 * 60 * 60);
    } catch {
        return 0;
    }
}

// Helper to check if tour pickup is >= 14 hours away
export function isMoreThan14HoursAway(tourDateStr: string, pickupTimeStr: string | null): boolean {
    return getHoursUntilPickup(tourDateStr, pickupTimeStr) >= 14;
}

// Helper to check if tour pickup is >= 24 hours away
export function isMoreThan24HoursAway(tourDateStr: string, pickupTimeStr: string | null): boolean {
    return getHoursUntilPickup(tourDateStr, pickupTimeStr) >= 24;
}

// Helper to get formatted remaining time until tour pickup
export function getFormattedRemainingTime(tourDateStr: string, pickupTimeStr: string | null): string {
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
        
        if (diffMs <= 0) return 'pickup time has passed';
        
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const mins = totalMinutes % 60;
        
        const parts: string[] = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (mins > 0 && days === 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
        
        return parts.length > 0 ? `${parts.join(', ')} remaining` : 'less than a min remaining';
    } catch {
        return '';
    }
}

