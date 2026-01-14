import { db, COLLECTIONS } from '../config/firebase';
import { Report, ReportReason } from '../types/type';
import firestore from '@react-native-firebase/firestore';

/**
 * Submit a report for a video
 */
export const submitVideoReport = async (
    videoId: string,
    reportedBy: string,
    reporterName: string,
    reason: ReportReason,
    additionalInfo?: string
): Promise<{ success: boolean; error?: string; reportId?: string }> => {
    try {
        // Check if user already reported this video
        const existingReport = await db
            .collection(COLLECTIONS.REPORTS)
            .where('videoId', '==', videoId)
            .where('reportedBy', '==', reportedBy)
            .limit(1)
            .get();

        if (!existingReport.empty) {
            return { success: false, error: 'You have already reported this video' };
        }

        // Create new report
        const reportRef = db.collection(COLLECTIONS.REPORTS).doc();

        const newReport: Report = {
            id: reportRef.id,
            videoId,
            reportedBy,
            reporterName,
            reason,
            additionalInfo: additionalInfo || '',
            timestamp: Date.now(),
            status: 'pending',
        };

        await reportRef.set(newReport);

        return { success: true, reportId: reportRef.id };
    } catch (error: any) {
        console.error('Error submitting report:', error);
        return { success: false, error: error.message || 'Failed to submit report' };
    }
};

/**
 * Get all reports submitted by a user
 */
export const getUserReports = async (userId: string): Promise<Report[]> => {
    try {
        const snapshot = await db
            .collection(COLLECTIONS.REPORTS)
            .where('reportedBy', '==', userId)
            .orderBy('timestamp', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data() as Report);
    } catch (error) {
        console.error('Error getting user reports:', error);
        return [];
    }
};

/**
 * Check if user has already reported a specific video
 */
export const checkIfUserReportedVideo = async (
    videoId: string,
    userId: string
): Promise<boolean> => {
    try {
        const snapshot = await db
            .collection(COLLECTIONS.REPORTS)
            .where('videoId', '==', videoId)
            .where('reportedBy', '==', userId)
            .limit(1)
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking report status:', error);
        return false;
    }
};

/**
 * Get all reports for a specific video (useful for admin)
 */
export const getVideoReports = async (videoId: string): Promise<Report[]> => {
    try {
        const snapshot = await db
            .collection(COLLECTIONS.REPORTS)
            .where('videoId', '==', videoId)
            .orderBy('timestamp', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data() as Report);
    } catch (error) {
        console.error('Error getting video reports:', error);
        return [];
    }
};
