import { NotificationType } from "./enums.model";

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    read: boolean;
    createdAt: Date;
    payload: string;
}