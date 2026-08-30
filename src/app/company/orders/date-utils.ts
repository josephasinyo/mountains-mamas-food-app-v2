// Helper to calculate hours remaining until tour pickup time in Mountain Time (America/Denver)
export const PICKUP_TIME_OPTIONS = Array.from({ length: 33 }).map((_, i) => {
    const hour24 = 5 + Math.floor(i / 2);
    const min = i % 2 === 0 ? '00' : '30';
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    return `${hour12}:${min} ${ampm}`;
});

// Helper to construct a Date object representing the specified date & pickup time in Mountain Time (America/Denver)
export function getMountainPickupDate(tourDateStr: string, pickupTimeStr: string | null): Date | null {
    try {
        if (!tourDateStr) return null;
        let datePart = tourDateStr.trim();
        if (datePart.includes('/')) {
            const [m, d, y] = datePart.split('/');
            datePart = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;

        let hours = 8;
        let minutes = 0;

        if (pickupTimeStr) {
            const timeClean = pickupTimeStr.trim().toUpperCase();
            const matches = timeClean.match(/(\d+):(\d+)\s*(AM|PM)?/);
            if (matches) {
                let h = parseInt(matches[1], 10);
                const m = parseInt(matches[2], 10);
                const ampm = matches[3];
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                hours = h;
                minutes = m;
            }
        }

        const [year, month, day] = datePart.split('-').map(Number);
        const targetUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0);

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Denver',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(new Date(targetUtcMs));
        const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

        const denverYear = getPart('year');
        const denverMonth = getPart('month');
        const denverDay = getPart('day');
        let denverHour = getPart('hour');
        if (denverHour === 24) denverHour = 0;
        const denverMinute = getPart('minute');

        const denverAsUtcMs = Date.UTC(denverYear, denverMonth - 1, denverDay, denverHour, denverMinute, 0);
        const offsetMs = denverAsUtcMs - targetUtcMs;

        return new Date(targetUtcMs - offsetMs);
    } catch {
        return null;
    }
}

export function getHoursUntilPickup(tourDateStr: string, pickupTimeStr: string | null): number {
    try {
        const pickupDate = getMountainPickupDate(tourDateStr, pickupTimeStr);
        if (!pickupDate) return 0;
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
        const pickupDate = getMountainPickupDate(tourDateStr, pickupTimeStr);
        if (!pickupDate) return '';
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

export const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    pending_request: 'Pending Order Request',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
};

export function isUnapprovedReq(order: any): boolean {
    if (!order) return false;
    if (order.status === 'cancelled' || order.status === 'fulfilled') return false;
    if (order.status === 'pending_request') return true;
    if (order.custom_fields?.is_approved === true) return false;
    
    const isLastMinute = order.custom_fields?.is_last_minute || (order.tour_date ? getHoursUntilPickup(order.tour_date, order.pickup_time) < 14 : false);
    return order.status === 'pending' && (isLastMinute || order.custom_fields?.is_approved === false);
}

export function getStatusLabel(order: any): string {
    if (!order) return '';
    if (isUnapprovedReq(order)) {
        return 'Pending Order Request';
    }
    return STATUS_LABELS[order.status] || (order.status ? order.status.replace('_', ' ') : '');
}

