import { cookies } from 'next/headers';

export async function setCompanySession(companyName: string, email: string) {
    const sessionData = Buffer.from(JSON.stringify({ companyName, email })).toString('base64');
    (await cookies()).set('company_session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    });
}

export async function getCompanySession() {
    const cookie = (await cookies()).get('company_session')?.value;
    if (!cookie) return null;
    try {
        return JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
    } catch (e) {
        return null;
    }
}

export async function clearCompanySession() {
    (await cookies()).delete('company_session');
}
