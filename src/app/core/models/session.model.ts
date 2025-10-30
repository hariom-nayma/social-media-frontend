export interface Session {
    id: string;
    jwtToken: string;
    ipAddress: string;
    location: string;
    userAgent: string;
    deviceType: string;
    os: string;
    browser: string;
    loginTime: Date;
    lastActive: Date;
    active: boolean;
}
